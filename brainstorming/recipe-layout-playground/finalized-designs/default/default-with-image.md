Rough layout sketch for a new recipe layout component (src/components/RecipeLayout<Name>.vue) — treat the exact numbers below as approximate intent, not a spec to copy literally; use judgment on the real implementation. Background guide: 12-column grid with 0.15in gutters, inside the standard 7.5in x 10in content area (0.5in page margins).
- Title: columns 1-7 of 12 (~left 0.00in, top 0.00in, width 4.32in, height 1.00in)
- Image: columns 8-12 of 12 (~left 4.50in, top 0.01in, width 3.00in, height 2.13in)
- Chef's Notes: columns 1-7 of 12 (~left 0.00in, top 1.04in, width 4.31in, height 1.13in), boxed background (surface-container-low + outline-variant border)
- Ingredients: columns 1-9 of 12 (~left 0.00in, top 2.28in, width 5.57in, height 2.25in), 1 column, qty alignment: inline
- QR Code: columns 10-11 of 12 (~left 5.97in, top 2.72in, width 1.25in, height 1.25in), caption visible, size fixed at 1.25in x 1.25in (do not resize - RecipeQRCode.vue stamps its SVG at this exact size)
- Instructions: columns 1-12 of 12 (~left 0.00in, top 4.75in, width 7.50in, height 5.25in)
QR code is always its own standalone frame here, NOT nested inside RecipeIngredients like it is today (RecipeIngredients.vue's <li class="qr-item">) — pull RecipeQRCode out so it's a sibling of RecipeIngredients/RecipeImage/RecipeNotes, and drop the qr-item usage from RecipeIngredients.vue if this becomes the layout of record.
Reuse the existing RecipeTitle / RecipeImage / RecipeIngredients / RecipeInstructions / RecipeNotes / RecipeQRCode subcomponents as-is; only the positioning wrapper is new. Register the new component in RecipeSheet.vue's LAYOUT_COMPONENTS map.

Reference CSS (absolute positions, inches):
.blk-title {
  position: absolute;
  left: 0.00in;
  top: 0.00in;
  width: 4.32in;
  height: 1.00in;
}
.blk-image {
  position: absolute;
  left: 4.50in;
  top: 0.01in;
  width: 3.00in;
  height: 2.13in;
}
.blk-notes {
  position: absolute;
  left: 0.00in;
  top: 1.04in;
  width: 4.31in;
  height: 1.13in;
}
.blk-ingredients {
  position: absolute;
  left: 0.00in;
  top: 2.28in;
  width: 5.57in;
  height: 2.25in;
}
.blk-qr {
  position: absolute;
  left: 5.97in;
  top: 2.72in;
  width: 1.25in;
  height: 1.25in;
}
.blk-instructions {
  position: absolute;
  left: 0.00in;
  top: 4.75in;
  width: 7.50in;
  height: 5.25in;
}