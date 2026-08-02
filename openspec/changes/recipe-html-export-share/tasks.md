## 1. Base64 Helpers

- [ ] 1.1 In `src/js/recipeExport.js` (new file), add `blobToDataUri(blob)`: read
      `blob.arrayBuffer()`, base64-encode in chunks (avoid `String.fromCharCode`
      call-stack limits on large images), return `data:<mime>;base64,<data>` using
      `blob.type` as the mime type.
- [ ] 1.2 In `src/js/recipeImport.js`, add `dataUriToBlob(dataUri)`: parse the mime
      type out of the `data:<mime>;base64,` header, base64-decode the payload into a
      `Blob`. Return `null` (not throw) on a malformed URI or decode failure.

## 2. Export Module

- [ ] 2.1 In `src/js/recipeExport.js`, add `exportRecipeToHtml(recipe)` (async):
      build a full HTML document (doctype, `<meta name="cookbook-maker-format"
      content="recipe/1">`, one `cm-recipe` article) matching the `recipe/1` shape
      documented in `recipeImportPrompt.js`.
- [ ] 2.2 Serialize `.cm-title` (HTML-escaped), `.cm-ingredients` (one `<li>` per
      ingredient's `.raw` text), `.cm-instructions` (one `<li>` per newline-split
      instruction step, HTML-escaped), `.cm-notes` (HTML-escaped) — reusing the
      existing field names `recipeImport.js` already expects.
- [ ] 2.3 Serialize `<meta class="cm-layout" content="...">` from `layoutTemplate`,
      `<meta class="cm-ingredient-columns" content="...">` from `ingredientColumns`,
      `<meta class="cm-ingredient-qty-align" content="...">` from
      `ingredientQtyAlign`.
- [ ] 2.4 When `recipe.image` is present, await `blobToDataUri(recipe.image)` and
      emit `<img class="cm-image" src="...">` plus
      `<meta class="cm-image-aspect-ratio" content="...">` from
      `imageAspectRatio`; when absent, emit neither element.

## 3. Import Extraction

- [ ] 3.1 In `src/js/recipeImport.js`, add extraction of `.cm-image`'s `src` via
      `dataUriToBlob`, defaulting to `null` when the element is absent or decoding
      fails.
- [ ] 3.2 Add extraction of `.cm-ingredient-columns`, `.cm-ingredient-qty-align`,
      and `.cm-image-aspect-ratio` `content` values, each validated against
      `templates.js`'s `INGREDIENT_COLUMN_OPTIONS`, `INGREDIENT_QTY_ALIGN_OPTIONS`,
      and `IMAGE_ASPECT_RATIOS` respectively (same pattern as the existing
      `KNOWN_LAYOUT_IDS` check), falling back to `db.js`'s existing defaults (`1`,
      `'right'`, `'auto'`) when absent or unrecognized.
- [ ] 3.3 Wire these four new fields (`image`, `ingredientColumns`,
      `ingredientQtyAlign`, `imageAspectRatio`) into the object returned by
      `parseRecipeElement`.

## 4. Editor UI

- [ ] 4.1 In `src/views/RecipeEditor.vue`, add an "Export recipe" button to the
      existing `isEditing`-gated action row, next to the Print button.
- [ ] 4.2 On click: assemble the current recipe fields (same shape used for save),
      call `exportRecipeToHtml`, wrap the result in a `Blob`
      (`type: 'text/html'`), and trigger a download via a temporary `<a>` +
      `URL.createObjectURL` (revoke the object URL after triggering the download).
- [ ] 4.3 Name the downloaded file `<slugified-title>.html`.

## 5. Tests

- [ ] 5.1 New `src/js/recipeExport.test.js`: unit-test `blobToDataUri` round-trips
      a small `Blob`'s bytes and mime type correctly.
- [ ] 5.2 In `src/js/recipeExport.test.js`, round-trip test: build a recipe object
      with an image `Blob`, markdown-formatted notes, multiple ingredients, and
      non-default `layoutTemplate`/`ingredientColumns`/`ingredientQtyAlign`/
      `imageAspectRatio`; run it through `exportRecipeToHtml` then
      `parseRecipeImportHtml`; assert every field matches, including comparing the
      re-decoded image `Blob`'s bytes against the original via `arrayBuffer()`.
- [ ] 5.3 In `src/js/recipeImport.test.js`, add a backward-compatibility test:
      HTML with none of the new optional elements (i.e. today's AI-transcribed
      shape) still imports successfully with `image: null`, `ingredientColumns:
      1`, `ingredientQtyAlign: 'right'`, `imageAspectRatio: 'auto'`.
- [ ] 5.4 In `src/js/recipeImport.test.js`, add a malformed-image test: a
      `.cm-image` with an invalid `data:` URI produces a candidate recipe with
      `image: null` rather than a parse failure.
- [ ] 5.5 Run `npm test` and `npm run build`; both must be green.

## 6. Manual Verification

- [ ] 6.1 In the running app, export a recipe with a photo, non-default layout,
      2-column ingredients, left-aligned quantities, and a square aspect ratio;
      confirm the downloaded `.html` file opens and looks correct as plain text.
- [ ] 6.2 Import that same file via `RecipeImport.vue`'s file picker; confirm the
      staged preview matches the original recipe exactly, including the photo.
- [ ] 6.3 Paste the same file's contents into the paste entry point; confirm
      identical results.
- [ ] 6.4 Export a recipe with no photo; confirm the downloaded file has no
      `.cm-image` element and re-imports with a null image.
- [ ] 6.5 Confirm an existing AI-transcribed HTML file (no new elements) still
      imports exactly as it did before this change.
