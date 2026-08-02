# Database Layer Review — cookbook-maker (`redesign` branch)
_2026-08-02 — informational only, no code changed. Extracted from `CODE_REVIEW.md` and re-verified against source._

## Scope

`src/js/db.js`, `src/js/backup.js`, `src/js/sequence.js`, `src/stores/projects.js`, `src/stores/recipes.js`, plus the two call sites that own destructive DB flows (`src/views/Settings.vue`, `src/views/RecipeEditor.vue`).

Every finding below was checked against the source; verdicts distinguish confirmed defects from claims that did not survive verification.

## Summary

The persistence layer is the strongest part of the codebase — real transaction use, a documented store/db invariant, and a genuinely thoughtful pre-restore snapshot in `backup.js`. The problems cluster in one place: **the Pinia stores' in-memory mirror of IndexedDB drifts from what was actually persisted**, in three independent ways, none of which require a race or a second tab. The project already documents this exact invariant in `CLAUDE.md`; the code violates it in two of the three places it applies.

---

## High priority

### D1. Restore wipes the database with no confirmation
`src/views/Settings.vue:45-55` → `src/js/backup.js:8-29`

Picking a file in the import dialog calls `restoreDatabase()` immediately. `importInto` runs with `clearTablesBeforeImport: true` (`backup.js:21`), so every table is wiped first. Every other destructive action in the app (delete project, recipe, chapter) has a confirm step; the only one that can destroy the entire library does not.

**Fix:** gate `handleFileChange` behind the existing modal component, and surface what's at stake — `peakImportFile` already parses the file at `backup.js:10`, so the confirm can name the incoming record counts against the current ones before anything is cleared.

**Note:** the recovery path itself is well built. `backup.js:17` snapshots to `preRestoreSnapshot` before the destructive write and `Settings.vue:58-68` auto-downloads it on failure. This finding is about the missing gate, not the recovery.

### D2. Store actions recompute sequences instead of reading back what `db.js` persisted
`src/stores/projects.js:68-73` (`createChapter`), `:80-101` (`removeChapter`) vs `src/js/db.js:107-111`, `:115-146`

This violates the invariant recorded in `CLAUDE.md` and in `openspec/changes/archive/2026-07-05-initial-project-tech-setup/design.md` Decision 3.

**`removeChapter` — divergence is reproducible today, no race needed.** Both sides reassign orphaned recipes into the Miscellaneous chapter, but they iterate in different orders:

| | source | iteration order |
|---|---|---|
| `db.js:125-142` | `where('chapterId').equals(id).toArray()` | primary key |
| `projects.js:92-97` | `this.projectRecipes.filter(...)` | array insertion |

Same starting sequence, different assignment. Delete a chapter whose recipes were added out of id order and the in-memory ordering no longer matches the persisted ordering — visible immediately, silently corrected on next reload.

**`createChapter` — same class, currently latent.** `db.addChapter` returns only an id, so `projects.js:71` recomputes `nextSequence(existing)` against the in-memory chapter list while `db.js:109` computed it against the DB rows. They agree only while the cache is fresh.

**Fix (both):** the enclosing invariant says derived values come back from `db.js`. Have `deleteChapter` return its reassignments (`[{ id, chapterId, sequence }]`) and `addChapter` return `{ id, sequence }`; have the stores apply those instead of recomputing. This is the same shape `addRecipeToProject` already uses correctly at `db.js:179` — it returns `{ id, sequence, chapterId }` and `projects.js:103-108` consumes it. Follow that pattern.

### D3. Deleting a recipe leaves stale associations in the projects store
`src/stores/recipes.js:24-27` vs `src/js/db.js:51-55`

`db.deleteRecipe` correctly cascades in a transaction — it deletes the recipe *and* its `project_recipes` rows. `recipesStore.removeRecipe` only filters `this.recipes`. Nothing notifies `projectsStore`, so `projectsStore.projectRecipes` keeps rows pointing at a deleted recipe until the next `load()`.

The visual symptom is masked — `ProjectView.vue:47` and `compileBook.js:19` both drop unresolvable references — which is why this hasn't surfaced. The unmasked consequence is arithmetic: `removeChapter`'s inline `Math.max(...)` at `projects.js:89-91` counts the ghost rows, so sequence assignment is computed over a recipe count that no longer exists. D2 and D3 compound.

**Fix:** have `removeRecipe` also prune `projectsStore.projectRecipes` (cross-store call, or an event), mirroring the cascade `db.js:51-55` already performs. Whichever direction you pick, the rule worth writing down is that an in-memory cascade must mirror every DB-level cascade.

---

## Medium priority

### D4. Bare `.update()` calls report success when the row is gone
`src/js/db.js:49, 82, 113, 182`

`updateRecipe`, `updateProject`, `updateChapter`, and `moveProjectRecipe` are unguarded `Table.update()` calls. Dexie resolves these with a count of `0` rather than throwing when the key doesn't exist. The stores then do `if (found) Object.assign(...)` (`projects.js:60`, `:78`, `:114`; `recipes.js:22`) and report success either way — a save against a just-deleted row is a silent no-op.

**Fix:** check the returned count and throw a typed "record no longer exists" error, so callers can distinguish it from a write failure and tell the user their edit was not saved.

### D5. Two-row reorder swaps are non-transactional
`src/stores/projects.js:131-134`, `:145-148`

Both `reorderChapter` and `reorderProjectRecipe` swap sequences via `Promise.all` of two independent writes. If the second rejects, the first has already committed — two rows now share a sequence, with no rollback and no error surfaced.

**Fix:** push the swap down into `db.js` as a single `db.transaction('rw', ...)` that writes both rows, and have the store apply the result. This also removes the store's direct-write-then-mirror pattern in the one place ordering correctness depends on it.

### D6. `RecipeEditor.save()` swallows write failures entirely
`src/views/RecipeEditor.vue:96-115`

No `try`/`catch` and no busy flag (unlike the `deleting` flag its own `confirmDelete` uses two functions down). A rejection escapes as an unhandled promise rejection: no error shown, no navigation, user left on an apparently-unresponsive form.

This matters more than a generic missing-catch because of the sharp edge `CLAUDE.md` already documents: reactive objects reaching Dexie fail structured-clone with `DataCloneError`. `RecipeEditor` is exactly where that would fire, and it currently surfaces nowhere. The double-submit duplicate is the secondary risk; the silent failure is the primary one.

---

## Low priority

- **`load()` is N+1** (`stores/projects.js:25-36`) — one `getChaptersForProject` + one `getProjectRecipes` per project, in two `Promise.all` loops. Both tables are indexed on `projectId`, so this is correct, just chatty. Matters only at scale.
- **`createProject` defaults are declared twice** (`db.js:65-72` and `stores/projects.js:41-47`) — identical literals in both. `db.js` is authoritative; the store's copy exists only to populate the in-memory row and will silently disagree if one side changes. Same read-back fix as D2 applies: return the created row.
- **Snapshot phase has no progress reporting** (`backup.js:17`) — `exportDB(db)` is called without the `progressCallback` that `exportDatabase` and `importInto` both receive, so `Settings.vue`'s "Working… n/m" indicator sits frozen through the entire pre-restore snapshot on a large DB. One-argument fix.
- **No constraint against adding a recipe to a project twice** — `db.addRecipeToProject` doesn't check for an existing pairing. `ProjectView.vue:368` filters already-added recipes in the UI, so this is currently unreachable, but the invariant lives only in the view.
- **Sorting is always in JS** — `project_recipes` is indexed on `chapterId` but not `[chapterId+sequence]`, so every ordered read (`projects.js:19-22`, `compileBook.js:14-19`) does a full fetch then sorts. Correct and fine at this scale; noted only as the thing to change first if ordering ever gets slow.
- **`sequence.js` has no dedicated test file** — it backs a documented cross-file invariant and is exercised only indirectly through `db.test.js`. Given D2 sits directly on top of it, it's worth pinning: notably that chapter sequences are computed over *all* chapters including the default Miscellaneous one (sequence 0), so the first custom chapter gets sequence 1 rather than 0 — already documented in `CLAUDE.md` and easy to regress.

---

## Claims that did not survive verification

- **"Sequence assignment needs compare-and-swap; two tabs can compute the same next value."** Partly wrong. `addRecipeToProject` (`db.js:154-180`) is already inside a `rw` transaction spanning `project_recipes`, and IndexedDB serializes readwrite transactions on the same object stores across same-origin tabs — its read-then-write is atomic. The only genuine race is `addChapter` (`db.js:107-111`), which reads via `getChaptersForProject()` and writes via `.add()` with no transaction between them. Wrapping that one function in `db.transaction('rw', db.chapters, ...)` closes it; no CAS scheme is needed.
- **"Dropping unresolved recipe references is a data-integrity bug, and `compileBook` should dedupe."** Downgraded to Low. `ProjectView.vue:47` does the identical `.filter()`, so dropping dangling references is the app's consistent deliberate behavior in a schema with no FK enforcement — not a one-file oversight. The dedupe half is unmotivated: nothing in the codebase produces duplicate `recipeId` rows (see the Low item above).

---

## Suggested order

1. **D1** — confirmation on restore. Highest consequence, cheapest fix.
2. **D3** — cascade the delete in memory. Small, and it removes a compounding input to D2.
3. **D2** — return derived values from `db.js`; delete both recomputations. Restores the documented invariant.
4. **D6** — `catch` + busy flag in `save()`. Makes the `DataCloneError` sharp edge visible instead of silent.
5. **D5** — transactional swap in `db.js`.
6. **D4** — typed error on no-op updates. Touches four call sites, so worth doing as one pass.
7. Transaction-wrap `addChapter` (the one real race), and add `sequence.test.js` alongside the D2 work.

Items 2, 3, and 5 all move logic from the stores into `db.js` and have the stores consume the result. Doing them together is less work than doing them separately, and leaves the store layer with no independently-derived state at all.
