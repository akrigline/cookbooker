Rough layout sketch for a new recipe layout component (src/components/RecipeLayout<Name>.vue) — treat the exact numbers below as approximate intent, not a spec to copy literally; use judgment on the real implementation. Background guide: 12-column grid with 0.15in gutters, inside the standard 7.5in x 10in content area (0.5in page margins).
- Title: columns 1-12 of 12 (~left 0.00in, top 0.00in, width 7.50in, height 1.00in)
- Ingredients: columns 1-4 of 12 (~left 0.00in, top 1.18in, width 2.38in, height 7.57in), 1 column, qty alignment: right
- Instructions: columns 5-12 of 12 (~left 2.56in, top 1.20in, width 4.88in, height 8.75in)
- QR Code: columns 2-3 of 12 (~left 0.64in, top 8.75in, width 1.25in, height 1.25in), caption visible, size fixed at 1.25in x 1.25in (do not resize - RecipeQRCode.vue stamps its SVG at this exact size)
- Image: hidden in this sketch (no photo for this recipe / this layout doesn't use one).
- Chef's Notes: hidden in this sketch (no notes for this recipe).
QR code is always its own standalone frame here, NOT nested inside RecipeIngredients like it is today (RecipeIngredients.vue's <li class="qr-item">) — pull RecipeQRCode out so it's a sibling of RecipeIngredients/RecipeImage/RecipeNotes, and drop the qr-item usage from RecipeIngredients.vue if this becomes the layout of record.
Reuse the existing RecipeTitle / RecipeImage / RecipeIngredients / RecipeInstructions / RecipeNotes / RecipeQRCode subcomponents as-is; only the positioning wrapper is new. Register the new component in RecipeSheet.vue's LAYOUT_COMPONENTS map.

Reference CSS (absolute positions, inches):
.blk-title {
  position: absolute;
  left: 0.00in;
  top: 0.00in;
  width: 7.50in;
  height: 1.00in;
}
.blk-ingredients {
  position: absolute;
  left: 0.00in;
  top: 1.18in;
  width: 2.38in;
  height: 7.57in;
}
.blk-qr {
  position: absolute;
  left: 0.64in;
  top: 8.75in;
  width: 1.25in;
  height: 1.25in;
}
.blk-instructions {
  position: absolute;
  left: 2.56in;
  top: 1.20in;
  width: 4.88in;
  height: 8.75in;
}