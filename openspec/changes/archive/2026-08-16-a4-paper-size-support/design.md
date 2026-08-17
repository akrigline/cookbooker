## Context

Page geometry is currently a fixed set of constants in `src/js/pageDimensions.js` (`PAGE_WIDTH_IN = 8.5`, `PAGE_HEIGHT_IN = 11`, `PAGE_MARGIN_IN = 0.5`, `PAGE_GUTTER_IN = 0.75`), deliberately centralized there specifically so DOM-measurement modules (`recipeFitMeasure.js`, `tocLayout.js`) can never disagree with what actually renders (`PagePreview.vue`, `print.css`'s `@page` rule). That centralization is the load-bearing mechanism this design has to extend, not bypass — the project has already been bitten once by width drift between measurement and render (documented in `pageDimensions.js`'s own comments, the TOC-clipping incident).

Paper size is a **global, app-wide** setting, not a per-cookbook one — a single user's printer takes one kind of paper. The scenario driving this is cross-border sharing: a cookbook authored/exported under one paper size may be opened and printed by a different user whose printer expects the other size, purely by changing their own global setting. This is confirmed by the existing precedent: `src/stores/settings.js`'s `ingredientQtyAlign` is exactly this shape (global app setting, `src/js/db.js`'s `settings` table, loaded once at boot in `main.js`).

`fitsOnPage` is a nullable boolean persisted per recipe (`print-and-export` spec's "Single-Page Recipe Layout Constraint"), computed once at create/edit time. It is not currently paper-size-aware because it's implicitly Letter-only. Since paper size becomes global (one active size at a time, not per-project), there's no ambiguity in measuring `fitsOnPage` against "the" current paper size — but existing recipes' stored values go stale the moment the global setting changes, since nothing re-triggers measurement on a settings change today.

## Goals / Non-Goals

**Goals:**
- Let the user pick A4 or Letter as a global app setting, defaulting to Letter (zero change for existing users).
- Make every page-size-dependent surface (screen preview, print `@page` rule, TOC pagination, `fitsOnPage` measurement) consistently follow that one global value, using `pageDimensions.js` as the single source of truth the same way `doubleSided` handling already does.
- Re-evaluate `fitsOnPage` for all recipes when the setting changes, so overflow warnings are accurate without requiring the user to re-save every recipe.

**Non-Goals:**
- Per-cookbook or per-recipe paper size. Explicitly rejected — see Why in proposal.md.
- Scaling margins/gutters proportionally to paper size. Margins are a binding/safe-area convention, not proportional to sheet size; both paper sizes keep the same absolute `PAGE_MARGIN_IN`/`PAGE_GUTTER_IN`.
- Any change to double-sided printing's own logic (recto-forced starts, gutter side) beyond making its absolute-inch math paper-size-aware where it already reads `PAGE_MARGIN`/`PAGE_GUTTER`.
- Adding paper sizes beyond Letter/A4 in this change (the data shape should not preclude it later, but only these two ship now).

## Decisions

**1. `pageDimensions.js` becomes a `PAPER_SIZES` map with size-aware accessors, not a second set of constants.**
`PAPER_SIZES = { letter: { widthIn: 8.5, heightIn: 11, ... }, a4: { widthIn: 8.27, heightIn: 11.69, ... } }`, with `getPaperSize(paperSize)` falling back to Letter for any unknown/absent id, and `pageWidth(paperSize)`/`pageHeight(paperSize)` replacing the old flat `PAGE_WIDTH`/`PAGE_HEIGHT` string constants. `pageContentBox({ doubleSided, paperSize })` gains an optional, defaulted (`'letter'`) `paperSize` param so existing callers keep compiling during the migration.
*Alternative considered*: keep `PAGE_WIDTH_IN` etc. as mutable/reassignable globals swapped when the setting changes. Rejected — implicit global mutable state is exactly the kind of drift this module exists to prevent; an explicit parameter threaded through every call site is traceable and testable.

**2. Margins/gutters stay fixed absolute inches for both paper sizes.**
`PAGE_MARGIN_IN`/`PAGE_GUTTER_IN` are unchanged, size-independent constants. Only width/height vary by paper size. Consequence: A4's content box is slightly narrower (~7.27in vs 7.5in) and noticeably taller (~10.69in vs 10in) than Letter's — this shifts pagination outcomes on A4, which is expected and is the entire point of the `fitsOnPage` re-measurement decision below.

**3. The physical `@page { size }` rule is set by runtime `<style>` injection, not a CSS variable.**
`@page`'s `size` property does not reliably resolve CSS custom properties across browsers, and `@page` cannot be scoped by class or attribute selector. `print.css` keeps its existing static `@page { size: 8.5in 11in; margin: 0; }` as the Letter fallback. `ProjectPrint.vue` creates/updates a single `<style id="cm-page-size-override">` element in `document.head` (in a `watch` on the resolved paper size, removed `onBeforeUnmount`) containing the resolved `@page` rule for the current size — only injected when the size is non-Letter, so Letter users (the default, and majority case) never exercise this path at all.
*Alternative considered*: a print-time media-query trick using `@page { size: var(...) }` — rejected as unsupported; a second static `@page` rule gated by a body class — rejected because `@page` has no scoping mechanism for that.

**4. `fitsOnPage` measurement reads the current global paper size, and changing the setting triggers a bulk re-measurement.**
`recipeFitMeasure.js`'s off-screen measurement container is sized from `pageWidth(paperSize)`/`pageHeight(paperSize)`; `recipes.js`'s `triggerFitMeasurement` reads the current setting from `useSettingsStore()` and passes it through. A new `recipesStore.remeasureAllFits()` action re-runs `triggerFitMeasurement` for every loaded recipe; the Settings view's paper-size change handler calls it (fire-and-forget, same error-swallowing contract as the existing per-recipe trigger) immediately after the setting write succeeds.
*Alternative considered*: leave stale `fitsOnPage` values until the recipe is next edited. Rejected — the whole point of `fitsOnPage` is to warn proactively before print time; a stale "fits" badge after switching to A4 is actively misleading, not just incomplete.

## Risks / Trade-offs

- **[Risk]** Switching the global paper size changes `fitsOnPage` for potentially every recipe in the library, which may read as surprising/alarming (a wave of new warning badges appearing). **Mitigation**: this is flagged as an intentional, expected **BREAKING** consequence in the proposal, not a bug; no suppression is planned since surfacing it is the feature's purpose.
- **[Risk]** `recipesStore.remeasureAllFits()` mounts/unmounts a full `RecipeSheet` instance per recipe sequentially (same mechanism as the existing single-recipe path) — for a large library this could take a noticeable, user-visible amount of time after flipping the setting. **Mitigation**: fire-and-forget, non-blocking (matches existing single-recipe behavior); no loading spinner is required since the Settings toggle itself completes immediately and badges update as each measurement resolves.
- **[Risk]** The `document.head` style-injection approach is a manual DOM side effect outside Vue's normal reactive-template model. **Mitigation**: scoped to one clearly-named element id, created/torn down symmetrically in `ProjectPrint.vue`'s own lifecycle hooks, and skipped entirely for the default (Letter) case — the highest-traffic path has zero exposure to this code.

## Migration Plan

No data migration needed: `DEFAULT_SETTINGS.pageSize` defaults to `'letter'`, and `validateSettings` falls back to Letter for any missing or unrecognized stored value (mirrors the existing `ingredientQtyAlign`/`KNOWN_QTY_ALIGNS` pattern) — an app that has never seen this setting behaves exactly as it does today. No rollback concerns beyond reverting the code change, since no destructive writes are introduced.

## Open Questions

None outstanding — paper size list (Letter, A4), global (not per-project) scope, and fixed-margin behavior were confirmed directly with the requester before this design was written.
