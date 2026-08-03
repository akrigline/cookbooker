## 1. Create Inline QR Component

- [x] 1.1 Create `src/components/RecipeQRCode.vue` — no dialog/overlay scaffolding; accepts a `recipe` prop
- [x] 1.2 In `RecipeQRCode.vue`, reuse `generateQRURL`, `isPayloadOversized`, and `qrVersion` logic from `qrShare.js` (same thresholds as current modal)
- [x] 1.3 Use `QRCode.toString(url, { type: 'svg' })` to generate an inline SVG string; set `width` and `height` to `1.25in` directly on the SVG element
- [x] 1.4 When oversized or too-dense, render a small italic fallback text ("Ingredient list too long to encode as QR") instead of the SVG
- [x] 1.5 Add a small caption label below the canvas (e.g., "Scan for shopping list") — `display:none` in screen preview, visible in print via `@media print` override

## 2. Embed QR in Recipe Layout

- [x] 2.1 Import and add `<RecipeQRCode :recipe="recipe" />` to `RecipeSheet.vue` as an absolute-positioned element (bottom-right of `.recipe-sheet` article)
- [x] 2.2 Add `position:relative` to `.recipe-sheet` if not already present (needed for child absolute positioning)
- [x] 2.3 Apply a small white padding halo around the QR widget to prevent overlap with layout content at print edges
- [x] 2.4 Verify visually in all 7 layout templates (`RecipeLayoutHeroSplitBalanced`, `HeroSplitAsymmetric`, `AsymmetricSidebar`, `ColumnOptimized`, `BalancedHeader`, `DualColumnBottomSplit`, `TextOnly`) that the QR does not obscure content

## 3. Remove Editor Modal

- [x] 3.1 Remove the `showQRModal` ref, `QRCodeShare` import, and the "Share via QR" toolbar button from `src/views/RecipeEditor.vue`
- [x] 3.2 Remove the `main:has(.cm-qr-overlay)` print-suppression CSS from `RecipeEditor.vue`
- [x] 3.3 Delete `src/components/QRCodeShare.vue`

## 4. Tests

- [x] 4.1 Remove or update existing tests in `qrShare.test.js` that reference the modal interaction (overlay open/close, copy-link, print-QR-code button)
- [x] 4.2 Cover the truncation/fallback logic in `qrShare.test.js` (`maxIngredients`, `isPayloadOversized`) — `RecipeQRCode.vue` itself has no dedicated test file, since `@vue/test-utils` isn't installed and no `.vue` file in this project can be mounted in a test (see `AGENTS.md`)
- [x] 4.3 Verify `npm test` passes with no regressions

## 5. Verify

- [x] 5.1 Open the full-cookbook print preview (`/project/:id/print`) and confirm the QR appears on each recipe page
- [x] 5.2 Open the single-recipe print preview (`/project/:id/recipe/:id/print`) and confirm the QR appears
- [x] 5.3 Confirm a recipe with a very long ingredient list shows the fallback text notice instead of a canvas
- [x] 5.4 Confirm `npm run build` completes without errors
