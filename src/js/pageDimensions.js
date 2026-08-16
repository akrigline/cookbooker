// Shared print-page geometry so every DOM-measurement module
// (recipeFitMeasure.js, tocLayout.js) agrees on the same physical page size
// as PagePreview.vue and print.css's `@page` rule (8.5in x 11in, 0.5in
// margin) - keeping the numbers in one place means the two measurement
// modules can't drift out of sync with each other or with the real print
// output.
export const PAGE_WIDTH_IN = 8.5
export const PAGE_HEIGHT_IN = 11
export const PAGE_MARGIN_IN = 0.5

export const PAGE_WIDTH = `${PAGE_WIDTH_IN}in`
export const PAGE_HEIGHT = `${PAGE_HEIGHT_IN}in`
export const PAGE_MARGIN = `${PAGE_MARGIN_IN}in`

// CSS "in" units are always exactly 96 CSS px by spec - a fixed physical-unit
// conversion, not a device/zoom-dependent quirk - so this is a safe constant
// rather than something that needs measuring at runtime.
export const CSS_PX_PER_IN = 96
