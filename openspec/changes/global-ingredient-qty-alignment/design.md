## Context

Alignment lives today as `recipes.ingredientQtyAlign` (default `'right'`), edited per-recipe in
`RecipeEditor.vue`, threaded through 7 `RecipeLayout*.vue` wrappers as a `qtyAlign` prop into
`RecipeIngredients.vue`, and round-tripped through `recipe/1` HTML export. This is the app's
first schema migration (`db.version(1)` → `db.version(2)`) and first `settings` table, so backup/
restore safety and load-ordering get equal weight with the feature itself. Full rationale for
every decision below (including rejected alternatives) lives in
`brainstorming/global-ingredient-qty-alignment.md`, which was independently reviewed by four
agents against this repo's real `node_modules` — this document only carries the decisions
forward, not the supporting argument.

## Goals / Non-Goals

**Goals:**
- One app-wide `ingredientQtyAlign` preference applied to every rendered recipe (editor preview,
  import preview, print, project print).
- Safe schema migration: a new `settings` table with no seed step and no `db.on('populate')`
  change.
- Backup/restore stays safe across the version bump: old backups still restore, and a backup from
  a *newer* app version is rejected before any destructive step, not after.

**Non-Goals:**
- No per-recipe override (removed entirely, not demoted to a fallback).
- No per-cookbook scope.
- No migration of existing per-recipe values into the new global default.
- No cross-tab settings sync (consistent with `recipes`/`projects` stores today).
- No print-determinism work (font-loading race is a pre-existing, separate gap).

## Decisions

- **Scope: app-wide, not per-cookbook.** Two render sites (`RecipeEditor.vue` live preview,
  `RecipeImport.vue` staged preview) have no project context, so per-cookbook scope would force a
  fallback default that can disagree with the book the recipe prints in. App-wide also
  establishes the settings home for future preferences at the cheapest possible moment (before
  the DB grows).
- **Storage: `settings: 'key'` table, singleton row `{key:'app', ingredientQtyAlign}`, `db.version(2)`
  with no `.upgrade()` callback.** Zero-row-write migrations are the safest possible version-change
  transaction. `getSettings()` merges defaults over a missing row; `updateSettings()` upserts — a
  missing row is normal (fresh install, or a pre-v2 restore that clears `settings`), not an error
  state.
- **Retired field, not stripped.** `recipes.ingredientQtyAlign` stays on old rows (stripping means
  rewriting every recipe row, including its image Blob, inside the blocking upgrade transaction,
  for zero functional gain). Recorded as an exported `RETIRED_RECIPE_FIELDS` constant so the name
  is greppable and never reused with different semantics. `Table.update()` merges, so this does
  **not** drain from re-saved rows.
- **`updateSettings` skips the `updateOrThrow` pattern** other `db.js` writers use: a missing
  settings row is expected and recoverable (just upsert), unlike a deleted recipe/project row
  where silent loss is the bug `updateOrThrow` guards against.
- **Render seam: `RecipeSheet.vue` resolves a `--recipe-qty-align` CSS custom property** (same
  idiom as the existing `--recipe-accent`), not `RecipeIngredients.vue` reading the store
  directly. This deletes the `qtyAlign` prop and all 7 wrapper bindings, keeps a per-cookbook
  override cheap to add later (`RecipeSheet` is the one seam with project context at 3 of its 5
  call sites), and keeps the logic testable despite no component-mount test library being
  available (a CSS variable is inert data; a store subscription in a leaf component is not).
- **Backup gate lives in `inspectBackupFile`, before `restoreDatabase` takes its
  pre-restore snapshot.** Reject a backup with `databaseVersion > db.verno`, or containing table
  names this schema doesn't know. `restoreDatabase` then passes `acceptVersionDiff: true` only.
  `acceptMissingTables: true` is deliberately **not** passed — it guards the wrong direction (a
  table in the export missing from the live DB, not the reverse) and is unreachable dead code in
  `dexie-export-import` whose failure path runs after `clearTablesBeforeImport` has already
  committed, i.e. wipes local data with no rollback.
- **Load ordering: memoized `settingsStore.load()`, awaited with a 1500ms bound in `main.js`
  before `app.mount()`**, not `App.vue`'s `onMounted` (which runs after every child mounts —
  provably too late) and not a bare unbounded `await` (`db.open()` has no timeout against a
  blocked tab).
- **Multi-tab handling deferred.** Dexie already installs default `versionchange`/`blocked`
  handlers; the real symptom without a custom handler is a stale old tab silently reopening in
  dynamic-schema mode, not a hang. Add a `db.on('versionchange')` reload banner only if it's cheap
  on implementation day.

## Migration Plan

Three commits, in order, matching `openspec/changes/global-ingredient-qty-alignment/tasks.md`:

1. **Backup safety alone.** The `inspectBackupFile` gate + `acceptVersionDiff: true`. At today's
   `db.verno === 1` the new version check is always false, so this commit is a provable no-op —
   it lands in a release before the schema bump exists.
2. **The feature, end to end**, in dependency order: schema + `db.js` helpers → `settings.js`
   store → `main.js` bootstrap → `RecipeSheet.vue` CSS variable + wrapper/prop deletion →
   `RecipeEditor.vue` removal → `Settings.vue` UI + `TABLE_LABELS` + `confirmRestore` reload.
   Verifiable end-to-end in-browser after the `RecipeSheet` step: flip the stored value, reload,
   confirm every view moves together.
3. **`recipe/1` format change.** Isolated last because it's the one piece touching a format other
   people's exported files use — a revert of this commit alone leaves the app-wide preference
   intact.

**Manual verification required before release**: fake-indexeddb models neither `blocked` nor
cross-tab `versionchange`, so the v1→v2 upgrade must be checked against a real Chrome profile
holding a real v1 database (single tab, then two tabs open).

## Risks / Trade-offs

- **Existing per-recipe choices get silently overridden by the global default on upgrade** → no
  mitigation shipped (recorded non-goal); acceptable since the default matches the pre-existing
  default and the app is single-user.
- **A pre-v2 backup restore leaves `settings` empty** (the table didn't exist in the backup) →
  already handled by the same missing-row path as a fresh install; `Settings.vue`'s restore-diff
  table will show `App settings: 1 → 0`, which is accurate, not a bug.
- **`db.on('versionchange')` footgun**: a handler returning `false` (e.g. an arrow function with
  an implicit return) suppresses Dexie's default auto-close and recreates the two-tab deadlock →
  documented inline at the call site if/when that handler is added.
