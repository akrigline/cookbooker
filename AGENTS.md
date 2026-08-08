# Project agent memory

This file is the project's committed home for project-intrinsic agent knowledge: build, test, release, architecture, and sharp-edge notes that should travel with the code.

- Add durable project-specific notes here as they are discovered through real work.
- Do not adhere to or reference any documents in `brainstorming/` unless specifically mentioned by the user for a specific task.
- The `superpowers` plugin is a transient exploration/brainstorming tool, not the project's durable convention.
  OpenSpec is. Any superpowers output (plans, specs, SDD task artifacts) must be directed to
  `brainstorming/superpowers/` rather than the plugin's default `docs/` location. The `.superpowers/`
  runtime state directory is gitignored and can stay at the project root.
- Spec-driven development uses the OpenSpec CLI (`openspec` on PATH). Active change proposals live in
  `openspec/changes/<name>/`, completed ones are moved to `openspec/changes/archive/<date>-<name>/`, and
  the current merged capability specs live in `openspec/specs/<capability>/spec.md`. See the
  `openspec-propose`/`openspec-apply-change`/`openspec-archive-change` skills for the workflow.
- `npm test` runs vitest (happy-dom + fake-indexeddb, see `vitest.config.js`); `npm run build` runs the
  Vite production build. Both must stay green before landing a change.
- No `@vue/test-utils` (or any component-testing library) is installed, so none of the app's `.vue`
  files can be mounted in a test today — component logic worth unit-testing needs to live in a plain
  `.js` module (as `qrShare.js`, `sequence.js`, etc. already do) rather than in a component test that
  can't exist yet.
- The router (`src/router/index.js`) uses `createWebHistory()`. A `spaFallback404` plugin in
  `vite.config.js` copies `dist/index.html` to `dist/404.html` after build, so static hosts without a
  rewrite rule (e.g. GitHub Pages) serve the app shell for deep links/hard refreshes instead of a bare
  404. `public/CNAME` carries the custom domain (`cookbooker.akrigline.com`) into every build (GitHub
  Pages needs it in the published artifact for Actions-based deploys, since there's no `gh-pages`
  branch to hold it) and `vite.config.js`'s `base` is `'/'` to match serving from the domain root
  rather than a `/cookbooker/` project subpath.
- Release/deploy is a two-workflow chain, deliberately not a single push→deploy workflow: push causes
  a release, and release creation causes the deploy — not push causing deploy directly. This is set up
  so release creation can later become a manual, deliberate act (batching commits before shipping)
  without touching the deploy trigger.
  - `.github/workflows/release.yml` runs on push to `main`: tests + builds as a validation gate, then
    computes a date-based tag (`v2026.08.07`, suffixed `-2`/`-3`... for same-day repeats, always in
    `America/New_York` regardless of the runner's TZ) via the `git/matching-refs` API, creates a
    GitHub Release with `gh release create --generate-notes`, then explicitly dispatches
    `pages.yml` via `gh workflow run pages.yml -f tag=...`.
  - `.github/workflows/pages.yml` runs on `release: published` (or manual `workflow_dispatch` with a
    `tag` input) and does the actual build + `actions/deploy-pages` publish, checked out at the
    release's tag.
  - The explicit dispatch step in `release.yml` exists because actions taken with the default
    `GITHUB_TOKEN` don't trigger other workflows' event listeners (recursion guard) — `release:
    published` fired by `gh release create` using `GITHUB_TOKEN` would NOT auto-fire `pages.yml`.
    `workflow_dispatch`/`repository_dispatch` are the documented exceptions, which is why the dispatch
    step works. A **human** manually publishing a release (UI or their own `gh` login) is not
    `GITHUB_TOKEN`-authored, so `release: published` fires normally in that case — meaning a future
    switch to manual-only releases needs no changes to `pages.yml`, only removing the automated
    `release` job from `release.yml`.
  - `release.yml`'s `concurrency: group: release, cancel-in-progress: false` serializes runs (queues
    rather than cancels) so two near-simultaneous pushes can't both compute the same same-day tag
    suffix. `pages.yml` keeps `concurrency: group: pages, cancel-in-progress: true` since a stale
    in-flight deploy should lose to a newer one.
- `chrome-devtools-mcp` is configured and ready. Setup (resolved 2026-08-02):
  - MCP config: `~/.gemini/config/mcp_config.json` (server name: `chrome-devtools`)
  - Shim: `~/.gemini/antigravity-cli/mcp/chrome-devtools-shim.mjs` — injects `--executablePath` and
    `--chromeArg=--no-sandbox` onto `process.argv` before importing the real entry point
  - Chrome binary: `~/.cache/puppeteer/chrome/linux-150.0.7871.24/chrome-linux64/chrome`
  - MCP binary: `~/.npm/_npx/15c61037b1978c83/node_modules/chrome-devtools-mcp/` (v1.6.0, matches
    puppeteer 25.3.0)
  - If Chrome is re-installed/updated, update the `CHROME_PATH` constant in the shim and re-run
    `find ~/.cache/puppeteer/chrome -name "chrome" -type f` to get the new path.
  - If the MCP cache hash changes (e.g. after a fresh npx invocation), update `MCP_ENTRY` in the shim
    using `find ~/.npm/_npx -maxdepth 4 -iname chrome-devtools-mcp`.
- Objects passed to any Dexie write (`db.addRecipe`, `db.updateRecipe`, etc.) must be plain
  data, not Vue-reactive. A component that stages parsed/derived data in a `ref`/`reactive`
  container before writing it (e.g. a review screen that lets the user toggle items before
  committing) will hand Dexie a reactive Proxy, which fails IndexedDB's structured-clone
  check with `DataCloneError: ... could not be cloned` — wrap the object with `markRaw()`
  when it's staged, not when it's written.
- Pinia store actions in `src/stores/*.js` must never recompute or hardcode a value (like
  `sequence`) that `src/js/db.js` already derived for the same write — read it back from the
  `db.js` call's return value instead. This is an explicit invariant
  (`openspec/changes/archive/2026-07-05-initial-project-tech-setup/design.md` Decision 3: store
  actions must keep IndexedDB and in-memory state from drifting apart); every `db.js` write
  returns whatever the store needs for this (`addRecipeToProject` → `{ id, sequence, chapterId }`,
  `addChapter` → `{ id, sequence }`, `deleteChapter` → `{ reassigned }`, `createProject` → the
  created rows, the `swap*Sequences` pair → both new sequences). Two corollaries:
  - An in-memory cascade must mirror every DB-level cascade. `db.deleteRecipe` deletes the
    recipe's `project_recipes` rows, so `recipesStore.removeRecipe` calls
    `projectsStore.pruneRecipeAssociations` — otherwise the projects store keeps rows pointing at
    a deleted recipe and they get counted when deriving the next sequence.
  - Writes that are only correct together live in `db.js` inside one `db.transaction`, never as a
    `Promise.all` of independent store writes — a rejected fan-out commits some rows and not
    others, with no rollback. This covers the two-row sequence swaps and the N-row batches
    (`resequenceProjectRecipes`, `moveProjectRecipesToChapter`, `addRecipesToProject`,
    `removeProjectRecipes`), each of which returns the persisted values for the store to mirror.
- `db.js` throws typed errors instead of failing silently: `RecordNotFoundError` (Dexie's
  `Table.update()` resolves with `0` rather than throwing when the key is gone, so every update
  goes through the `updateOrThrow` helper) and `DuplicateRecipeError` (a recipe appears at most
  once per cookbook; the projects store treats it as an idempotent no-op). UI code that awaits a
  store write needs a `catch`, or the rejection only reaches the console while the dialog that
  raised it sits open in its busy state. `RecipeEditor.save()` is the single-write shape;
  `ProjectView`'s `persist(description, run)` helper is the shape for a view with many writes —
  every write there goes through it, reporting into one shared banner and closing whatever modal
  was open, since a stale-row failure is never retryable from the dialog that raised it.
- `peakImportFile` from `dexie-export-import` resolves for any parseable JSON, so it is *not* on
  its own a validity check. `backup.js`'s `inspectBackupFile` verifies the `formatName`/`tables`
  header and is what both the restore-confirmation UI and `restoreDatabase` call.
- The AI recipe-import prompt (`src/js/recipeImportPrompt.js`) must ask the LLM for markdown
  emphasis (`**bold**` / `*italic*`), matching what `src/js/richtext.js`'s `renderChefNotes`
  renders. Don't change it back to HTML tags (`<strong>`/`<em>`) — `src/js/recipeImport.js`
  extracts Chef's Notes via `.textContent`, which silently strips real HTML tags but leaves
  markdown-style asterisks intact.
- `backup.js`'s `restoreDatabase` uses `clearTablesBeforeImport: true`, so a failure partway
  through an import can leave tables cleared with only partial data restored. It snapshots the
  DB just before the destructive import and attaches it to the thrown error as
  `err.preRestoreSnapshot` (a Blob), which `Settings.vue` auto-downloads as a recovery file on
  that failure path — but this only covers failures during `importInto` itself; a residual risk
  remains for failure modes `peakImportFile`'s validation doesn't catch. A full fix (staging the
  import in a temp DB and swapping) would need a larger redesign than this.
- The shared `nextSequence()` helper (`src/js/sequence.js`) computes the next sequence value
  from *all* rows passed in. Chapter sequences are computed over every chapter for a project,
  including the default Miscellaneous chapter (sequence 0) — so the first custom chapter
  created gets sequence 1, not 0. Custom-chapter reordering is unaffected since
  `reorderChapter` filters siblings to non-default chapters before comparing, but don't assume
  a fresh custom chapter starts at sequence 0 in tests or new code.

- The QR-sharing decoder is the app's own `/decode` route (`src/views/DecodeRecipe.vue`), not a
  separately-deployed site — `generateQRURL` in `src/js/qrShare.js` builds the QR link from
  `window.location.origin` at generation time, so a code generated from a dev server or preview
  build encodes that origin rather than production.

- `@magrinj/parse-ingredients` is patched via `patch-package`. The upstream package
  mis-parses quantities like `"1 ¼ cups milk"` (integer + space + unicode fraction) because
  its `unicodeFractionRegex` lacked `\s*`. The fix is a one-character change in
  `findQuantityAndConvertIfUnicode` — PR open at https://github.com/magrinj/parse-ingredients/pull/1
  (authored by akrigline). Installing directly from the GitHub fork branch didn't work because
  the fork's `lib/` build output wasn't committed, leaving an empty package with no JS.
  The patch lives in `patches/@magrinj+parse-ingredients+1.0.0.patch` and is auto-applied via
  `"postinstall": "patch-package"` in `package.json`. When the PR merges and a new version is
  published to npm, bump `package.json` to that version and delete the patch file.

- `@magrinj/parse-ingredients` also declares `"sideEffects": false`, which makes production
  tree-shaking (`npm run build`, Rollup/Rolldown - `npm run dev` and `npm test` never tree-shake,
  so neither one catches this) drop *any* side-effect-only import of its locale submodules,
  including a bare `import '@magrinj/parse-ingredients/locale/en'` that binds no name. Without
  that registration, every `parseIngredientLine()` call throws `Error: One of the locale you have
  provided is not supported.` at runtime - only in the built bundle, not in dev/test. The fix in
  `src/js/conversions.js` imports the locale module's default export (`defineLocale()`'s return
  value, which is always `undefined` - the registration is a side effect, not the export) and
  references it in a live `if (ENGLISH_LOCALE !== undefined) throw ...` branch. This isn't
  decorative: a `void`-only reference to the same binding still gets eliminated (the bundler can
  prove it has no observable effect), while an actual conditional branch survives - verified
  empirically by rebuilding and grepping `dist/assets/*.js` for locale-only content (e.g.
  `"gallon"`). Don't simplify that guard away as dead code; it's the only thing standing between
  this module and getting tree-shaken again.

- `@magrinj/parse-ingredients` matches unit abbreviations against its locale data
  case-sensitively, so real-world casing like `"1 Tbsp"`/`"2 TBSP"`/`"1 CUP"` failed to match and
  got swallowed into the ingredient name instead of being recognized as a unit. `conversions.js`'s
  `parseIngredientsText` fixes this the simple way: it lowercases each line before handing it to
  `parseIngredientLine`, and keeps the original-case line in the returned `raw` field for display.
  Accepted tradeoff: the classic capital-`T` (tablespoon) vs. lowercase-`t` (teaspoon) convention
  no longer works post-lowercasing (`"T"` reads as teaspoon) - not worth preserving given how rare
  that bare single-letter form is in real recipe text. Separately, `"tsb"`/`"tsb."` (a letter
  transposition of `"tbs"` that shows up often enough in real imports to special-case) were added
  as tablespoon aliases in the patched `patches/@magrinj+parse-ingredients+1.0.0.patch` locale
  data (`lib/locale/en.{cjs,mjs}`) - a genuinely unrecognized abbreviation, not a casing problem,
  so lowercasing alone doesn't fix it.

- `src/css/tokens.css`'s chrome-palette tokens (`--color-focus`, `--color-danger*`,
  `--color-success*`, `--gray-*`) came from `DESIGN_TOKENS_PLAN.md`'s literal-to-token migration
  (2026-08-02) and are deliberately a light-only, minimal set — see that file for the full
  per-family rationale. Two things a later cleanup pass should not mistake for leftover work:
  the 11 `--gray-*` stops include one (`--gray-46`) added mid-migration because ~25 call sites
  sat exactly at the midpoint between two of the original 10 stops (a second addition,
  `--gray-86`, was later folded back into `--gray-84` once usage showed the two were a
  view/component naming split rather than a real distinct tone — don't re-add it without new
  evidence); and plenty of `oklch(...)` literals at hue 25 (danger-adjacent) and hue 250
  (focus-adjacent) remain in components on purpose — they're hover/disabled/selection-state
  shades distinct from the exact literal each token captures, and the plan's scope was strictly
  "replace exact matches," not "generalize every color in the family."

## Maintaining this file

Keep this file for knowledge useful to almost every future agent session in this project.
Do not repeat what the codebase already shows; point to the authoritative file or command instead.
Prefer rewriting or pruning existing entries over appending new ones.
When updating this file, preserve this bar for all agents and keep entries concise.
