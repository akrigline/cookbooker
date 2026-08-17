## Why

The app hardcodes US Letter (8.5in x 11in) as the only page size, but cookbooks are shared and printed across borders — a user outside the US (or receiving an imported cookbook from a US user) has no way to print on the A4 paper their printer actually takes.

## What Changes

- Add a global "Paper Size" app setting (Letter or A4, defaulting to Letter) in Settings, following the same pattern as the existing `ingredientQtyAlign` setting — one value for the whole app, not per-cookbook.
- `src/js/pageDimensions.js` becomes paper-size-aware: page width/height are looked up per paper size instead of hardcoded; margin and binding-gutter widths stay fixed absolute inches for both sizes.
- Screen preview (`PagePreview.vue`), the print `@page` rule, table-of-contents pagination measurement, and the `fitsOnPage` per-recipe fit check all read the current global paper size instead of assuming Letter.
- Switching the global paper size re-evaluates every recipe's `fitsOnPage` flag so overflow warnings reflect the new size immediately, without requiring the user to re-save each recipe. **BREAKING**: a recipe that fit on Letter may now show as not fitting on A4 (and vice versa) purely because the global setting changed — this is expected, not a regression.

## Capabilities

### New Capabilities

(none — this extends two existing capabilities)

### Modified Capabilities
- `app-settings`: adds a global Paper Size setting (Letter/A4, default Letter) alongside the existing ingredient-quantity-alignment setting, with the same storage/default/persistence guarantees.
- `print-and-export`: the page geometry (dimensions, margins on the physical `@page` rule, TOC pagination measurement, and the `fitsOnPage` single-page-fit check) becomes paper-size-dependent, driven by the new global setting instead of a fixed Letter assumption. Existing double-sided gutter/margin behavior is unchanged in kind, just computed against whichever paper size is active.

## Impact

- `src/js/pageDimensions.js` (page geometry constants/accessors)
- `src/css/print.css` (`@page` rule)
- `src/components/PagePreview.vue` (screen/print page box)
- `src/views/ProjectPrint.vue` (paper-size threading, dynamic `@page` size override)
- `src/js/tocLayout.js` (TOC pagination measurement)
- `src/js/recipeFitMeasure.js`, `src/stores/recipes.js` (`fitsOnPage` measurement + bulk re-measurement on setting change)
- `src/js/db.js`, `src/stores/settings.js`, `src/views/Settings.vue` (new global setting storage/UI)
- Tests: `src/js/pageDimensions.test.js`, `src/stores/settings.test.js`
