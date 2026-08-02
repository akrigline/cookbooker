# Code Review — cookbook-maker (`redesign` branch)
_2026-08-02 — informational only, no code changed._

## Scope note
**Database-layer findings have been moved to `DB_REVIEW.md`** — `src/js/db.js`, `src/js/backup.js`, `src/js/sequence.js`, `src/stores/*`, and the two views that own destructive DB flows (`Settings.vue`'s backup/restore, `RecipeEditor.vue`'s save path). They turned out to share a single root cause and read better together. This document covers everything else.

## How this was produced
Read-through of all `src/js/*`, `src/stores/*`, `src/router/*`, all `src/components/*.vue`, all `src/views/*.vue`, plus `vite.config.js`/`vitest.config.js`/`package.json`/`decoder/`. `npm test` and `npm run build` were run. A sample of the findings below (line numbers, the `conversions.js` density-table bug, `ProjectView.vue`'s line count, the router's missing guard) was independently re-verified by reading the source directly.

## Executive summary
The app is in decent shape for its stage — logic-layer code (`src/js/*`, `src/stores/*`) is generally clean, has real test coverage (80 tests passing), and the project has documented several of its own sharp edges in `CLAUDE.md`, which is good practice. The two biggest gaps are:

1. **The entire Vue layer (22 `.vue` files, ~4,900 lines, including a 1,985-line view) has zero test coverage**, and can't easily get any — `@vue/test-utils` isn't installed, so no `.vue` file can currently be mounted in a test.
2. **A handful of concrete, high-impact bugs** exist in the AI recipe-import flow and in shared display logic (unit conversion) that are worth fixing regardless of test coverage. The persistence layer has its own cluster of these — see `DB_REVIEW.md`.

No lint/format tooling, no typecheck, and no CI config exist at all — everything currently relies on local `npm test`/`npm run build` runs.

---

## Critical / High priority

| # | File | Issue | Failure scenario |
|---|------|-------|-------------------|
| 1 | `src/js/conversions.js:44-75` | `DENSITY_TABLE` matches by `lower.includes(keyword)`, first-match-wins. `butter` (line 55) is listed before `milk` (line 60), and there's no `buttermilk`/`peanut butter` entry. Verified: `"buttermilk".includes("butter")` is `true`, so it hits the `butter` entry first. | A recipe with "buttermilk" or "peanut butter" gets silently converted using butter's density (227 g/cup) instead of the correct one — wrong printed gram amounts with no indication anything's off. |
| 2 | `src/views/RecipeImport.vue:102-118` | `confirmImport()` loops over AI-parsed candidates calling `createRecipe` with no per-item try/catch and no partial-failure handling. | If recipe N of M throws mid-loop, recipes 1..N-1 are already saved but the review screen looks unchanged and `candidates` isn't cleared — the natural next move (click Import again) creates duplicates of what already saved. |
| 3 | `src/views/ProjectView.vue` | 1,985 lines — chapter CRUD, recipe CRUD, multi-select, three separate drag-and-drop systems, library search, and 5 modals all in one file, with **zero test coverage** (and can't be tested today — see Tooling below). By far the largest and highest-risk file in the app. | Any future change here is high-risk-of-regression with no automated safety net; also, per-recipe reordering within a chapter is drag-and-drop-only (chapters get explicit up/down buttons, recipes don't) — keyboard/screen-reader users cannot reorder recipes at all. |
| 4 | `src/router/index.js` | No catch-all/404 route, and no guard verifying `:projectId`/`:recipeId` actually resolve before rendering. Verified: `ProjectView.vue:610` dereferences `project.subtitle` with no `v-if="project"` guard. | Navigating to a deleted/stale project id, or hitting the route before the store's `load()` resolves, throws a runtime `TypeError` instead of showing a "not found" state. |

## Medium priority

- **`src/js/richtext.js:14-17`** — bold/italic regexes pair *any* two `*`/`_` markers in the string, not just an intended pair. A stray asterisk in Chef's Notes (e.g. "2 * 3") can turn unrelated text into unintended `<em>` spans.
- **`src/js/recipeImport.js` / `recipeImportPrompt.js`** — the prompt asks the LLM to strip `[cite:N]` citation markers, but there's no code-level sanitization backing that up; a noncompliant response leaves junk directly in imported titles/notes. Also, `extractLayoutTemplate` silently falls back to a default on any unrecognized value while `title`/`instructions` hard-fail — inconsistent strictness.
- **`src/js/qrShare.js`** — the ingredient-list truncation option (`maxIngredients`) is fully implemented and tested but never actually passed by `RecipeQRCode.vue`, so long ingredient lists always hit the "too long to encode" fallback instead of the graceful truncation path that already exists.
- **7 recipe layout templates** (`src/components/RecipeLayout*.vue`) — near-identical prop-wiring boilerplate (default values like `?? 'right'`, `?? 'auto'`) is duplicated across all 7 files rather than centralized; a future default change means editing 6+ files and risks silent drift between templates.
- **`src/components/PagePreview.vue:19-28`** — fixed `height: 11in; overflow: hidden` with no truncation warning anywhere in the render chain. A recipe with a long title or many ingredients/instructions gets silently clipped mid-line, on-screen and potentially in print, with no visual indicator.
- **`src/views/Settings.vue:93,97`** — both backup/restore icon SVGs use an invalid `y3` attribute instead of `y2` (verified), so the arrow strokes silently fail to render on the most important buttons on the page.
- **Inconsistent destructive-action UX** — `RecipeLibrary.vue` uses the native `confirm()` for delete while Dashboard/ProjectView/RecipeEditor all use a custom accessible modal.

## Low priority / polish

- `src/components/RecipeIngredients.vue:52-53` calls `getIngredientParts()` twice per row (once for quantity, once for name) — redundant work, not correctness-affecting.
- `ProjectPrint.vue`/`RecipePrint.vue` duplicate toolbar/print-button markup and CSS — minor DRY opportunity.
- Accessibility gaps: `RecipeImage.vue`/`RecipeThumbnail.vue` use `alt=""` on actual recipe photos (should describe the recipe, not be treated as decorative); `Sidebar.vue`'s closed mobile panel stays in the tab order (no `inert`/`aria-hidden`) and its hamburger button has no `aria-expanded`; `RecipeEditor.vue`'s image `<label>` has no `for`/`id` association.

## Testing & tooling

- `npm test` and `npm run build` both currently **pass** (80 tests / 12 files, ~12s; build ~1.3s, 412 KB JS / 39 KB CSS).
- **No `@vue/test-utils` or any component-testing library is installed** — confirmed no such package exists in `node_modules/@vue/`. This means none of the 22 `.vue` files can be mounted/tested today; it's a tooling gap, not just a coverage gap.
- Highest-value files to eventually test, in priority order: `ProjectView.vue` (1,985 lines, zero coverage), `Dashboard.vue` (506 lines), `RecipeEditor.vue`, `RecipeImport.vue` (wraps well-tested logic but the UI flow itself is untested). `Settings.vue` also belongs on this list for its backup/restore flow — tracked in `DB_REVIEW.md`.
- `pageLayout.js`, `templates.js`, and `useObjectUrl.js` have no dedicated test file. (`sequence.js` is also untested — see `DB_REVIEW.md`.)
- No ESLint/Prettier config or `lint` script; no typecheck script; no `.github/workflows` or any CI config — test/build passing is currently only known locally, never enforced automatically.
- Dependency versions are unusually high (`vite ^8.1.1`, `vitest ^4.1.9`, `vue ^3.5.39`) — worth a quick sanity check that these aren't accidental prerelease pins.
- `decoder/` (the standalone QR-share decoder page) is in good shape: intentionally isolated per its own README, with its own regression test covering XSS-safety and version pinning.

## Suggested priority order
1. Fix the `conversions.js` density-table ordering/substring bug.
2. Add per-item error handling to `RecipeImport.vue`'s import loop.
3. Add a router catch-all + not-found guards for missing project/recipe ids.
4. Decide whether to invest in `@vue/test-utils` now (unlocks testing `ProjectView.vue` before it grows further) or defer.
5. Everything else in Medium/Low can be picked up opportunistically or bundled into the redesign work already in flight.

Sequence this against the database work in `DB_REVIEW.md`, which carries its own ordering. Its top item (confirmation on restore) outranks everything here.
