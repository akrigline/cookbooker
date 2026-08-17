## 1. Page geometry foundation

- [x] 1.1 In `src/js/pageDimensions.js`, replace `PAGE_WIDTH_IN`/`PAGE_HEIGHT_IN`/`PAGE_WIDTH`/`PAGE_HEIGHT` with a `PAPER_SIZES` map (`letter`: 8.5x11in, `a4`: 8.27x11.69in), `DEFAULT_PAPER_SIZE = 'letter'`, `getPaperSize(paperSize)` (falls back to Letter for unknown/absent), and `pageWidth(paperSize)`/`pageHeight(paperSize)` accessors. Keep `PAGE_MARGIN_IN`/`PAGE_GUTTER_IN`/`PAGE_MARGIN`/`PAGE_GUTTER`/`CSS_PX_PER_IN` unchanged.
- [x] 1.2 Give `pageContentBox({ doubleSided, paperSize })` an optional `paperSize` param (default `'letter'`), computing width/height via `getPaperSize(paperSize)`.
- [x] 1.3 Update `src/js/recipeFitMeasure.js`'s import from the removed `PAGE_WIDTH`/`PAGE_HEIGHT` to `pageWidth()`/`pageHeight()` called with no argument (stays Letter for now), so the app still builds after step 1.1's rename.
- [x] 1.4 Update `src/js/pageDimensions.test.js`: keep existing Letter/no-arg assertions as regression tripwires, add a parallel `a4` block computing expected values from `PAPER_SIZES.a4` and the margin constants (not re-hardcoded literals), and add a `getPaperSize('bogus')` fallback-to-Letter test.

## 2. Thread paper size through measurement and rendering

- [x] 2.1 In `src/js/tocLayout.js`, add `pageSize` (default `'letter'`) to `createMeasureContainer`'s and `measureTocLayout`'s options, threading to `pageContentBox({ doubleSided, paperSize: pageSize })`.
- [x] 2.2 In `src/components/PagePreview.vue`, add a `paperSize: { type: String, default: 'letter' }` prop; bind `--pp-width`/`--pp-height` custom properties from `pageWidth(paperSize)`/`pageHeight(paperSize)` on `.page-preview`, and change its CSS to consume `var(--pp-width)`/`var(--pp-height)` instead of literal `8.5in`/`11in`. Leave `.page-preview__margin` padding and `.page-preview__page-number` offsets as literal `0.5in` (size-independent). Confirm the `@media print` block needs no change.
- [x] 2.3 In `src/js/recipeFitMeasure.js`, add `paperSize` (default `'letter'`) to `createContainer`'s and `measureRecipeFit`'s options, using `pageWidth(paperSize)`/`pageHeight(paperSize)` for the off-screen container.

## 3. Global paper size setting

- [x] 3.1 In `src/js/db.js`, add `pageSize: DEFAULT_PAPER_SIZE` to `DEFAULT_SETTINGS`, and extend `validateSettings` with a `KNOWN_PAPER_SIZES` check (unrecognized/missing value falls back to the default), mirroring the existing `ingredientQtyAlign`/`KNOWN_QTY_ALIGNS` handling.
- [x] 3.2 In `src/stores/settings.js`, add `pageSize: DEFAULT_PAPER_SIZE` to state, populate it in `load()` from the stored settings row, and add `async setPageSize(value)` following the `setIngredientQtyAlign` pattern.
- [x] 3.3 In `src/stores/settings.test.js`, add coverage for `setPageSize` and `load()` picking up a stored `pageSize`, matching the existing `ingredientQtyAlign` test shape.

## 4. Wire paper size into print/preview

- [x] 4.1 In `src/views/ProjectPrint.vue`, read `pageSize` from `useSettingsStore()` as a computed, pass `:paper-size="pageSize"` to every `<PagePreview>` usage (cover, blank, toc, divider, recipe), and add `pageSize` to the TOC re-measurement `watch` dependency list, threading it into `measureTocLayout`.
- [x] 4.2 In `src/views/ProjectPrint.vue`, add a `watch(pageSize, ...)` effect that creates/updates a `<style id="cm-page-size-override">` element in `document.head` with the resolved `@page { size: <w>in <h>in; margin: 0; }` rule, only when `pageSize !== 'letter'`; remove the element `onBeforeUnmount`.
- [x] 4.3 Add a comment in `src/css/print.css` noting its static `@page` rule is the Letter default, overridden per the global setting by `ProjectPrint.vue`.

## 5. Recipe fit re-measurement

- [x] 5.1 In `src/stores/recipes.js`, import `useSettingsStore`; have `triggerFitMeasurement` read the current `pageSize` and pass it to `measureRecipeFit(recipe, { paperSize })`.
- [x] 5.2 Add a `remeasureAllFits()` action to `src/stores/recipes.js` that calls `triggerFitMeasurement` for every loaded recipe (fire-and-forget, matching the existing per-recipe error-swallowing contract).

## 6. Settings UI

- [x] 6.1 In `src/views/Settings.vue`, add a Paper Size control next to the existing ingredient-quantity-alignment toggle, iterating `Object.values(PAPER_SIZES)` from `pageDimensions.js`.
- [x] 6.2 Wire its change handler to call `settingsStore.setPageSize(value)` (routed through the existing `error` banner on failure, matching `setIngredientQtyAlign`'s handler) followed by an un-awaited `recipesStore.remeasureAllFits()` call on success.

## 7. Verification

- [x] 7.1 Run `npm test` and `npm run build`; both must be green.
- [x] 7.2 Manually switch Paper Size to A4 in Settings, open an existing cookbook's print view, and confirm the screen preview resizes, TOC re-paginates, and Chrome's print-preview layout panel reports A4.
- [x] 7.3 Confirm a recipe that newly overflows on A4 shows its `fitsOnPage` warning badge in the library/chapter card without being re-saved.
- [x] 7.4 Toggle double-sided printing + A4 together and confirm the gutter math still holds (asymmetric margins, recto/verso page numbering).
- [x] 7.5 Switch back to Letter and confirm output matches pre-change behavior exactly.
- [x] 7.6 Confirm a settings row saved before this change (no `pageSize` key) loads cleanly as Letter with no migration step required.

## 8. Code review follow-up

Code review (medium effort) found that the original task list's `PagePreview`
call-site inventory missed several surfaces beyond `ProjectPrint.vue`, so they
stayed hardcoded to Letter regardless of the global setting - inconsistent
with the `print-and-export` spec's "every page's physical dimensions" wording
and with the paper-size-aware `fitsOnPage` badge shown for the same recipe.

- [x] 8.1 `src/views/RecipePrint.vue` (single-recipe print/export): read
      `pageSize` from `useSettingsStore()`, pass it to `PagePreview`, and
      apply the same `@page` size override `ProjectPrint.vue` does.
- [x] 8.2 Extracted the `@page` override injection (`applyPageSizeOverride`/
      `clearPageSizeOverride`) into a shared `src/js/pageSizeOverride.js` so
      `ProjectPrint.vue` and `RecipePrint.vue` can't drift on that logic.
- [x] 8.3 `src/views/RecipeEditor.vue`'s live preview, `src/views/RecipeImport.vue`'s
      review-stage previews, and `src/components/RecipePreviewDialog.vue` now
      also pass `:paper-size` from `useSettingsStore()`, so every `PagePreview`
      call site in the app agrees with the global setting.
