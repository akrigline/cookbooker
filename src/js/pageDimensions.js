// Shared print-page geometry so every DOM-measurement module
// (recipeFitMeasure.js, tocLayout.js) agrees on the same physical page size
// as PagePreview.vue and print.css's `@page` rule (8.5in x 11in, 0.5in
// margin) - keeping the numbers in one place means the two measurement
// modules can't drift out of sync with each other or with the real print
// output.
export const PAGE_WIDTH_IN = 8.5
export const PAGE_HEIGHT_IN = 11
export const PAGE_MARGIN_IN = 0.5

// Inner (binding-side) margin on every page of a double-sided book. This is a
// JS constant rather than a CSS literal because it has to be the SAME number in
// two places that can't see each other: ProjectPrint.vue's nth-of-type gutter
// rules, and the off-screen measurement in tocLayout.js. ProjectPrint.vue binds
// it into its own CSS as a custom property (`--page-gutter`) instead of
// re-typing `0.75in`, so measurement and render cannot drift apart - which is
// exactly how the table of contents ended up clipping entries: measurement
// assumed a 7.5in content width while double-sided pages actually render 7.25in.
export const PAGE_GUTTER_IN = 0.75

export const PAGE_WIDTH = `${PAGE_WIDTH_IN}in`
export const PAGE_HEIGHT = `${PAGE_HEIGHT_IN}in`
export const PAGE_MARGIN = `${PAGE_MARGIN_IN}in`
export const PAGE_GUTTER = `${PAGE_GUTTER_IN}in`

// CSS "in" units are always exactly 96 CSS px by spec - a fixed physical-unit
// conversion, not a device/zoom-dependent quirk - so this is a safe constant
// rather than something that needs measuring at runtime.
export const CSS_PX_PER_IN = 96

/**
 * The content box a page's slotted content actually gets - i.e. what
 * PagePreview.vue's `.page-preview__content` resolves to, after
 * `.page-preview__margin`'s padding is taken off the 8.5x11in sheet.
 *
 * `doubleSided` matters and is easy to forget: ProjectPrint.vue widens one
 * side's padding to PAGE_GUTTER on every page after the cover, so a
 * double-sided book's content box is NARROWER than a single-sided one's
 * (7.25in vs 7.5in) on both rectos and versos - the gutter just swaps sides.
 * Any off-screen measurement that renders page content has to use this, or it
 * measures a wider line than the page will actually print and overestimates
 * how much fits.
 */
export function pageContentBox({ doubleSided = false } = {}) {
  const widthIn = PAGE_WIDTH_IN - PAGE_MARGIN_IN - (doubleSided ? PAGE_GUTTER_IN : PAGE_MARGIN_IN)
  const heightIn = PAGE_HEIGHT_IN - PAGE_MARGIN_IN * 2
  return {
    widthIn,
    heightIn,
    widthPx: widthIn * CSS_PX_PER_IN,
    heightPx: heightIn * CSS_PX_PER_IN,
  }
}
