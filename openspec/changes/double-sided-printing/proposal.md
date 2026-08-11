## Why

Cookbook exports currently print single-sided only, with uniform margins on
every page. Users binding a printed cookbook (spiral, perfect-bound, etc.)
need a wider inner margin on the binding edge so content isn't lost in the
gutter, and chapters/TOC conventionally start on a right-hand page in a
bound book. Today's fixed 0.5in margin and always-top-right page number
don't support that.

## What Changes

- Add a per-project "Double-sided printing" toggle (`doubleSidedEnabled`,
  default off) alongside the existing page-numbers toggle.
- When enabled, interior pages (everything after the Cover) get an
  asymmetric margin: 0.75in gutter (binding edge) / 0.5in outer, swapping
  sides by page parity (recto: gutter left; verso: gutter right).
- The Table of Contents and every chapter start on a recto (right-hand)
  page, inserting a blank verso page before them when needed. A blank page
  is always inserted between Cover and TOC.
- Page numbers mirror to the outer top corner (top-right on recto,
  top-left on verso) instead of always top-right.
- The Cover stays single-sided (symmetric margin, no gutter) regardless of
  the toggle.
- Bundled fix: `@page`'s print margin and `PagePreview.vue`'s own 0.5in
  padding currently stack at actual print time (~1in real margin against
  a 0.5in on-screen preview); this change makes `@page` the sole source of
  real print margin, zeroing the component's padding under `@media print`.
- Recipe-fit measurement (`recipeFitMeasure.js`) uses the correct total
  horizontal margin (1.25in vs. today's 1in) when double-sided is enabled,
  so the fit-on-page warning stays accurate.

When the toggle is off, all print/export behavior is unchanged from today.

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `print-and-export`: adds the double-sided toggle, gutter margins,
  recto-forced chapter/TOC starts with blank-page insertion, mirrored page
  numbers, and corrects the print-margin stacking bug and fit-measurement
  margin constant.

## Impact

- `src/js/db.js`: new `doubleSidedEnabled` project field (no schema/index
  change).
- `src/components/EditCookbookModal.vue`: new checkbox.
- `src/js/compileBook.js`: new blank-aware, parity-aware page layout
  function (replaces/extends `assignPageNumbers`).
- `src/views/ProjectPrint.vue`: renders blank page entries, conditional
  `<style>` block for `@page :left`/`:right`/`:first` gutter margins,
  toggles a screen-preview class for `nth-of-type`-driven mirroring.
- `src/components/PagePreview.vue`: margin/page-number styling driven by
  parent-selector rules instead of fixed values; print padding zeroed.
- `src/css/print.css`: baseline `@page` rule and comment updated to
  reflect the new margin ownership split.
- `src/js/recipeFitMeasure.js`: horizontal margin constant becomes
  project-aware.
- `compileBook.test.js`: new tests for blank insertion and parity-aware
  numbering.
