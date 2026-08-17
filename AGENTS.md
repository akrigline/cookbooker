# Project agent memory

This file is the project's committed home for project-intrinsic agent knowledge: build, test, release, architecture, and sharp-edge notes that should travel with the code.

- Add durable project-specific notes here as they are discovered through real work.
- The root `DESIGN.md` (following the [google-labs-code/design.md](https://github.com/google-labs-code/design.md)
  spec: YAML frontmatter of `colors`/`typography`/`rounded`/`spacing`/`components` tokens, then 8
  ordered sections) is the canonical design-system reference — colors, typography, layout,
  elevation, shapes, and component values. It's generated from and should be kept in sync with the
  actual CSS (`src/css/tokens.css` and component `<style>` blocks), not the other way around: if a
  future change makes `DESIGN.md` disagree with the code, the code wins and `DESIGN.md` needs
  updating. Known inconsistencies between components that haven't been reconciled yet are tracked
  in `brainstorming/design-system-inconsistencies.md`, not in `DESIGN.md` itself.
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
  `--color-success*`, `--ink-*`) came from `DESIGN_TOKENS_PLAN.md`'s literal-to-token migration
  (2026-08-02, tokens renamed `--gray-*` → `--ink-*` 2026-08-16) and are deliberately a
  light-only, minimal set — see that file for the full per-family rationale. One thing a later
  cleanup pass should not mistake for leftover work: the 11 `--ink-*` stops include one
  (`--ink-46`) added mid-migration because ~25 call sites sat exactly at the midpoint between two
  of the original 10 stops (a second addition, `--ink-86`, was later folded back into `--ink-84`
  once usage showed the two were a view/component naming split rather than a real distinct tone —
  don't re-add it without new evidence).

- `RecipePreviewDialog.vue` (opened from `ProjectView.vue`'s chapter recipe rows) stays a `Modal`
  dialog, not a slide-out panel or dedicated route — decided when adding prev/next navigation
  (`openspec/changes/archive/.../cookbook-recipe-preview-navigation` once archived). It has no
  focusable/selectable content besides the Edit/Close/nav buttons, so arrow-key shortcuts don't
  conflict with text selection, and the dialog already has room for nav controls in its header.
  `ProjectView.vue` owns navigation state (`previewChapterId`/`previewIndex`, derived from
  `recipesInChapter()`) and passes `hasPrev`/`hasNext` + a `recipe` prop down; the dialog only
  emits `navigate(delta)`. Any future preview-reopen flow (e.g. from the recipe editor) should
  target this same dialog, not a route.

- The cookbook page's "Import Recipes" shortcut (`ProjectView.vue` → `RecipeImport.vue` →
  back to `ProjectView.vue`, openspec: `cookbook-import-shortcut`) carries its return-context the
  same way `RecipeEditor.vue` does (see the entry above): a `?returnToProject=<id>` query param
  (`src/js/returnContext.js`'s `computeImportReturnContext`), not `history.state` — so it's a real,
  bookmarkable URL and survives a page refresh. `RecipeImport.vue` derives `returnContext` from
  `route.query` and uses it both for the "Back to Cookbook" link and the post-confirm redirect.
  The one-shot `autoSelectIds` payload (only the successfully-created recipe IDs) still rides
  `router.push({ state: {...} })` / `history.state`, since it's ephemeral data, not a navigable
  location. `ProjectView.vue` consumes `history.state.autoSelectIds` in `onMounted`, intersects it against
  `recipesStore.recipes` (via `src/js/cookbookImportShortcut.js`'s `intersectExistingRecipeIds`,
  since the route-state IDs could reference a since-deleted recipe) to populate `libSelectedIds`,
  then immediately `history.replaceState`s the field away so a later back-navigation doesn't
  re-trigger it. `LibrarySidebarPanel.vue` ("Add Recipes") is always rendered inline, not a
  toggleable panel — there is no open/close flag to set; "opening" it is just populating
  `libSelectedIds` (which reveals its bulk-action bar) and scrolling `.pv-sidebar` into view. The
  library toolbar's own "Import Recipes" entry point (`RecipeLibrary.vue` → `/library/import`,
  no `returnTo` state) is untouched by this and keeps its original stay-on-page behavior.

- `openspec validate <change> --strict` requires delta specs at
  `openspec/changes/<change>/specs/<capability>/spec.md` (a folder per capability), not a flat
  `specs/<capability>.md` file — a flat file parses as zero deltas and fails validation with no
  file-level error pointing at the cause. `openspec/changes/cookbook-import-shortcut/specs/` (once
  archived, check `openspec/changes/archive/`) is a reference example of the folder layout.

- Each recipe's `fitsOnPage` field (nullable boolean; `null` = not yet measured) is computed by
  `src/js/recipeFitMeasure.js`'s `measureRecipeFit()`, which mounts `RecipeSheet` into a detached,
  off-screen `div` sized to `PagePreview.vue`'s print-page dimensions (8.5in × 11in, 0.5in padding)
  and compares `scrollHeight`/`clientHeight`. `src/stores/recipes.js`'s `createRecipe`/`editRecipe`
  call `triggerFitMeasurement()` after every write (fire-and-forget, `.catch(() => {})`'d so a
  since-deleted recipe's `RecordNotFoundError` from the persist step never becomes an unhandled
  rejection) — this is the single choke point recipe-import's bulk create also flows through, so
  no separate wiring was needed in `RecipeImport.vue`. `RecipeFitWarningBadge.vue` renders only
  when `fitsOnPage === false`, in both `RecipeLibrary.vue` and `ChapterCard.vue`.

- `ProjectView.vue`/`ChapterCard.vue`'s drag-and-drop has a nested-`draggable`
  gotcha: a non-default chapter's card is itself `draggable` (for chapter
  reordering), and its recipe rows/list are `draggable` too, nested inside
  it. `dragstart`/`dragover`/`drop` all bubble, so a recipe drag inside a
  non-default chapter used to also fire the chapter-level handlers (dragging
  a recipe across chapters would spuriously swap the two chapters'
  positions) - fixed by `e.stopPropagation()` in every recipe-level drag
  handler (`onRecipeDragStart`/`onRecipeDragOver`/`onRecipeDrop`/
  `onRecipeDragEnd`). Any new draggable element nested inside the chapter
  card needs the same treatment. Both recipe and chapter reordering report a
  drop as "insert after this id, or null for top" (`src/js/sequence.js`'s
  `sequenceForInsertAfter`, a single midpoint-sequence write) rather than a
  two-item position swap, computed from which half of the hovered
  row/card the pointer is over - `ChapterCard.vue` renders that as an
  insertion line (`::before`/`::after` on the row/card) between two existing
  items, not a highlight around a whole drop target. Moving a recipe into a
  *different* chapter is the one exception that still always appends at the
  end (matching what `moveRecipeToChapter`/`addRecipeToProject` actually do
  server-side), so its insertion line is pinned to the end of that chapter's
  list rather than tracking the pointer.

- Print page numbers are NOT rendered via CSS Paged Media margin boxes
  (`@page { @bottom-right { content: counter(page) } }`), despite that being
  the original design decision (`openspec/changes/archive/2026-07-27-initial-
  specification/design.md` Decision 3) - Chrome's support for that spec proved
  too unreliable (footer content silently failing to render, `counter-reset`
  on the UA `page` counter not reliably restarting numbering after the
  Cover/TOC). `src/js/compileBook.js`'s `assignPageNumbers()` computes plain
  JS page numbers instead (front matter unnumbered; body numbering starts at
  1 on the first chapter divider, per print convention and the
  `print-and-export` spec's "System Print Integration" requirement), and
  `PagePreview.vue`'s `pageNumber` prop renders them as a normal absolutely-
  positioned element in the page's bottom-right corner - not a footer.
  `TableOfContentsPage.vue` reads the same `assignPageNumbers()` maps to
  print each entry's page number with a dotted leader.
- The print margin comes entirely from `PagePreview.vue`'s own
  `.page-preview__margin` padding (0.5in) - the SAME box in screen preview
  and print, not a print-only approximation of some other margin.
  `src/css/print.css`'s `@page` rule sets `margin: 0` deliberately: an
  earlier design used `@page`'s own margin as the real margin (with this
  padding zeroed at print so the two didn't stack), but that meant two
  independently-declared margins had to be kept in sync by hand, and it
  silently broke page-number positioning + double-sided gutters when
  `.page-preview` briefly needed a non-fixed height for other reasons -
  see git history around `PagePreview.vue`/`ProjectPrint.vue` if this
  surfaces again. Because `@page`'s margin is 0, a user's own print-dialog
  "Margins" setting is the only remaining place a second margin could
  sneak in on top of ours - `PrintToolbar.vue` tells users to pick "None".
  Double-sided books' asymmetric binding gutter
  (`ProjectPrint.vue`'s `nth-of-type`-based padding/page-number overrides
  on `.page-preview__margin`) is this same mechanism, not a separate
  print-only one - no more imperative `@page :left`/`:right` `<style>`
  injection needed.

- The table of contents can span multiple physical pages (2 columns each), not a fixed one page.
  The intra-page column split is real CSS, not hand-rolled JS: `TableOfContentsPage.vue`'s
  `.toc-rows` is `columns: 2; column-fill: auto`, sized by `.toc-page`'s
  `grid-template-rows: auto 1fr` (heading row, then rows row - `.toc-rows` is pinned to
  `grid-row: 2` so continuation pages without an `<h2>` still land in the `1fr` track). That grid
  replaced a hand-tuned `calc(100% - 60px)` heading reserve, which was 3px wrong and was a constant
  someone had to re-derive whenever the heading's type changed; `auto 1fr` is correct by
  construction. It must stay a *definite* height - `column-fill: auto` is only honored by
  Chrome/WebKit when the multicol container's height resolves (W3C csswg-drafts #4689), which a
  `1fr` track in a fixed-height grid does. Each row component has `break-inside: avoid` so a wrapped
  multi-line title never splits across the column boundary. An earlier version reimplemented
  column-balancing by hand in JS from measured row heights (e.g. gluing a chapter header to its
  first recipe so neither would be stranded cost ~6 lines of blank space whenever a fresh chapter
  started near a column's end) - trust the browser's layout for this, don't rebuild it.
  `src/js/tocLayout.js`'s `measureTocLayout` only has to find the *page* cut points: it mounts
  `TableOfContentsPage` off-screen in a plain div sized by `pageDimensions.js`'s `pageContentBox()`,
  with every remaining row in that same real `columns: 2; column-fill: auto` flow, and - since CSS
  multicol lets content that overflows N columns spill into repeating column "runs" extending
  sideways past the container's own width, rather than clipping it, in continuous (non-paginated)
  media - reads back each row's rendered x position to know which column (and via
  `Math.floor(columnIndex / 2)`, which page) real column-fill layout placed it on. That inference
  has been checked against N separate real 2-column pages and is exact; **when the TOC drops
  entries, the bug is almost never the algorithm - it is that measurement was handed geometry or
  content that differs from what renders.** Three separate instances of exactly that shipped:
  - **Content width.** `ProjectPrint.vue` widens one side's padding to `PAGE_GUTTER` on every page
    after the cover, so a double-sided book's content box is 7.25in, not 7.5in - on *both* rectos
    and versos, since the gutter just swaps sides. Measuring 7.5in wrapped titles later than the
    page does. This is why `measureTocLayout` takes `{ doubleSided }`, and why `ProjectPrint.vue`
    keys its gutter CSS off `--page-gutter`/`--page-margin` bound from `pageDimensions.js` rather
    than re-typing the literals - one source, so the two cannot drift.
  - **Page numbers.** Real numbers come from `layoutBookPages`, which needs the TOC's page count,
    which is what the measurement computes - so measurement renders a placeholder (`1`). That is
    only safe because `TocRecipeRow`/`TocChapterRow` reserve a fixed number column
    (`--toc-number-width` from `compileBook.js`'s `maxPageNumberDigits`, plus `tabular-nums`): with
    an auto-width number, a rendered 3-digit number is wider than the measured `1`, squeezes
    `.toc-title`, and tips borderline titles onto a second line. `maxPageNumberDigits` is
    deliberately an over-estimating bound computed from the plan alone, because it must be knowable
    *before* the measurement - don't "tighten" it into a function of the real numbers, that
    reintroduces the cycle.
  - **A `+ 90` fudge** in the old `CONTENT_HEIGHT_PX`, added to make page 1 look right, which
    over-filled every page by ~90px. That constant and `CONTENT_WIDTH_IN` are both gone.
  All three were invisible: `PagePreview` clips with `overflow: hidden` and TOC pages suppress its
  overflow warning (below). `ProjectPrint.vue`'s dev-only `warnOnClippedTocRows` is the replacement
  signal - it console-warns when any rendered row escapes its `.page-preview__content` box. Reach
  for it first when this area misbehaves, and trust it over reasoning.
  Measurement needs only two off-screen mounts total
  regardless of how many pages result: one with the heading shown (page 1) to find how many rows
  fit there, and one without (every subsequent page) for whatever didn't fit, since column-fill is
  monotonic and overflow just keeps spilling sideways through as many page-worth column-pairs as
  needed. Reuses `TableOfContentsPage.vue` for measurement (same rationale as
  `recipeFitMeasure.js`'s overflow check - measured and displayed markup must be identical, which is
  also why `TocChapterRow.vue`/`TocRecipeRow.vue` are their own components), so
  `TableOfContentsPage.vue`'s `rows` prop is a flat, already-page-sliced list - never a pre-split
  pair of column arrays, and never a JS-computed height passed down as a prop. Because pagination
  needs a DOM mount, it's async - `compileBook.js`'s `layoutBookPages` takes a pre-computed
  `tocPageCount` instead of a `showToc` boolean, and `ProjectPrint.vue` runs the async measurement
  in a `watch` before computing `bookLayout`, gating the entire page list behind a `tocReady` ref so
  a wrong/undercounted TOC page count (and therefore wrong chapter/recipe page numbers) is never
  shown, even briefly. `PagePreview.vue`'s `hideOverflowWarning` prop (set by `ProjectPrint.vue` on
  every TOC page) suppresses its own scrollHeight/clientHeight overflow banner there - TOC pages are
  deliberately packed right to the column height's edge, which otherwise trips that heuristic as a
  false positive. Two sharp edges that already bit this: (1) `.toc-title` must be
  `flex: 0 1 auto; min-width: 0` (shrinkable), not `flex: 0 0 auto` - with `flex-shrink: 0` a long
  title doesn't wrap, it overflows horizontally past its column and visually bleeds into the next
  one; (2) `index.html` loads Google Fonts with `display=swap`, so text renders in a fallback font
  first and swaps once the real font loads - measuring before that swap reads row heights/wrap
  points against the wrong font, so both `tocLayout.js` and `recipeFitMeasure.js`
  `await document.fonts.ready` *after* mounting (not as an upfront gate before anything mounts -
  `ready` only accounts for fonts already requested by something on the page, so checking it too
  early can resolve before the measurement mount's own fonts are even requested).

## Known issues

- `RecipeImage.vue`'s `.recipe-image` defaults to `height: 100%`, only overridden to `height: auto`
  when `aspectRatio` matches one of `ASPECT_RATIO_CSS`'s explicit keys (`1:1`/`4:3`/`3:4`/`16:9`).
  `'auto'` (the default `imageAspectRatio` value) isn't one of those keys, so a lone `RecipeImage` in
  a column-direction flex container (nothing else in that flex line to resolve `100%` against)
  balloons to fill the container's remaining space and squeezes out whatever's below it. Confirmed
  affecting the legacy `hero-split-balanced`, `hero-split-asymmetric`, and `asymmetric-sidebar`
  templates (their Title+Image+Notes column) whenever a recipe's `imageAspectRatio` is left at
  `'auto'` - masked whenever the user picks an explicit aspect ratio, which sets the overriding
  inline `height: auto`. Found and left unfixed (out of scope) during
  `openspec/changes/two-column-configurable-layout` (see its `tasks.md` §6.2); `RecipeLayoutTwoColumn.vue`
  and `RecipeLayoutDefault.vue` sidestep it by wrapping each image slot in a `div` with an explicit
  percentage height instead of relying on `RecipeImage`'s own `height: 100%`. Fixing the 3 legacy
  layouts needs the same wrapper treatment (or adding an `'auto'` entry to `ASPECT_RATIO_CSS` and
  proving that doesn't regress the object-fit: cover framing those templates rely on).

## Maintaining this file

Keep this file for knowledge useful to almost every future agent session in this project.
Do not repeat what the codebase already shows; point to the authoritative file or command instead.
Prefer rewriting or pruning existing entries over appending new ones.
When updating this file, preserve this bar for all agents and keep entries concise.
