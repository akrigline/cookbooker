## Why

There is currently no way to get a single recipe, with its full settings (photo, layout,
ingredient display options), out of the app to share with someone else or move into another
cookbook-maker instance. The only existing recipe-transfer mechanism (`recipe/1` HTML, see
`recipe-import`) is one-directional (paste/upload only, produced by an LLM transcription
prompt) and explicitly drops images. Rather than introduce a second, JSON-based format to
carry the fields HTML can't currently express, this change expands the existing `recipe/1`
HTML format so one format serves both AI transcription and full-fidelity recipe export/import.

## What Changes

- Add a new `recipe-export` capability: an "Export recipe" action in the recipe editor that
  downloads the current recipe as a self-contained `recipe/1` HTML file (title, ingredients,
  instructions, notes, layout template, ingredient display settings, and photo).
- Extend the `recipe/1` HTML format (additive, no version bump) with three new optional
  elements: `.cm-image` (the photo, embedded as an unresized base64 data URI),
  `.cm-ingredient-columns`, and `.cm-ingredient-qty-align`/`.cm-image-aspect-ratio` display
  settings. Existing AI-transcribed HTML (which never has these) continues to parse unchanged.
- Extend `recipe-import` field extraction to read these new optional elements back into a
  recipe's `image`, `ingredientColumns`, `ingredientQtyAlign`, and `imageAspectRatio` fields,
  falling back to the application's standard defaults when absent. **BREAKING** (spec-level
  only, not data-loss): imported recipes are no longer unconditionally stripped of their image —
  a recipe element carrying `.cm-image` now produces a recipe with that image instead of `null`.

## Capabilities

### New Capabilities
- `recipe-export`: lets a user download a single recipe, with its full settings and photo, as
  a `recipe/1` HTML file from the recipe editor.

### Modified Capabilities
- `recipe-import`: recipe field extraction gains support for the new optional `.cm-image`,
  `.cm-ingredient-columns`, `.cm-ingredient-qty-align`, and `.cm-image-aspect-ratio` elements,
  replacing the current unconditional "image is always null" behavior with "image is null
  unless the source carries `.cm-image`".

## Impact

- `src/js/recipeImport.js` — extend `parseRecipeElement` and its helpers; add a
  `dataUriToBlob` helper.
- New `src/js/recipeExport.js` — `exportRecipeToHtml`, `blobToDataUri`.
- `src/views/RecipeEditor.vue` — new "Export recipe" button (existing `isEditing`-gated
  action row).
- `src/js/recipeImportPrompt.js` — unchanged; AI transcription still has no real photo to embed.
- `src/js/qrShare.js` / `RecipeQRCode.vue` — unchanged; separate, deliberately lightweight
  mechanism.
- Tests: new `src/js/recipeExport.test.js`; extend `src/js/recipeImport.test.js`.
