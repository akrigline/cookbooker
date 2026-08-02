## 1. Create Inline QR Component

- [ ] 1.1 Create `src/components/RecipeQRCode.vue` — no dialog/overlay scaffolding; accepts a `recipe` prop
- [ ] 1.2 In `RecipeQRCode.vue`, reuse `generateQRURL`, `isPayloadOversized`, and `qrVersion` logic from `qrShare.js` (same thresholds as current modal)
- [ ] 1.3 Use `QRCode.toString(url, { type: 'svg' })` to generate an inline SVG string; set `width` and `height` to `1.25in` directly on the SVG element
- [ ] 1.4 When oversized or too-dense, render a small italic fallback text ("Ingredient list too long to encode as QR") instead of the SVG
- [ ] 1.5 Add a small caption label below the canvas (e.g., "Scan for shopping list") — `display:none` in screen preview, visible in print via `@media print` override

## 2. Embed QR in Recipe Layout

- [ ] 2.1 Import and add `<RecipeQRCode :recipe="recipe" />` to `RecipeSheet.vue` as an absolute-positioned element (bottom-right of `.recipe-sheet` article)
- [ ] 2.2 Add `position:relative` to `.recipe-sheet` if not already present (needed for child absolute positioning)
- [ ] 2.3 Apply a small white padding halo around the QR widget to prevent overlap with layout content at print edges
- [ ] 2.4 Verify visually in all 7 layout templates (`RecipeLayoutHeroSplitBalanced`, `HeroSplitAsymmetric`, `AsymmetricSidebar`, `ColumnOptimized`, `BalancedHeader`, `DualColumnBottomSplit`, `TextOnly`) that the QR does not obscure content

## 3. Remove Editor Modal

- [ ] 3.1 Remove the `showQRModal` ref, `QRCodeShare` import, and the "Share via QR" toolbar button from `src/views/RecipeEditor.vue`
- [ ] 3.2 Remove the `main:has(.cm-qr-overlay)` print-suppression CSS from `RecipeEditor.vue`
- [ ] 3.3 Delete `src/components/QRCodeShare.vue`

## 4. Tests

- [ ] 4.1 Remove or update existing tests in `qrShare.test.js` that reference the modal interaction (overlay open/close, copy-link, print-QR-code button)
- [ ] 4.2 Add unit tests for `RecipeQRCode.vue`: renders canvas when payload fits; renders fallback text when oversized
- [ ] 4.3 Verify `npm test` passes with no regressions

## 5. Verify

- [ ] 5.1 Open the full-cookbook print preview (`/project/:id/print`) and confirm the QR appears on each recipe page
- [ ] 5.2 Open the single-recipe print preview (`/project/:id/recipe/:id/print`) and confirm the QR appears
- [ ] 5.3 Confirm a recipe with a very long ingredient list shows the fallback text notice instead of a canvas
- [ ] 5.4 Confirm `npm run build` completes without errors
