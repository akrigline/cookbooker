## Context

`recipe-import` already defines a strict structured-HTML format, `recipe/1`
(`data-cm-format="recipe" data-cm-version="1"`), parsed by
`src/js/recipeImport.js`. Today it flows one direction only: an LLM transcribes
a messy source (per the prompt in `src/js/recipeImportPrompt.js`) into this
HTML, the user pastes/uploads it, and `RecipeImport.vue` stages it for review
before writing to the library. The format deliberately has no way to carry an
image, and nothing in the app *produces* `recipe/1` HTML from an existing
recipe — there is no export path at all.

We want to let a user get one full recipe (including its photo and display
settings) out of the app as a shareable file. Rather than add a second,
JSON-based format for this, we're expanding `recipe/1` itself so the same
parser and the same format serve both jobs: AI transcription (text only, as
today) and full-fidelity export/import (adds the photo and display settings).
`RecipeImport.vue`'s file-upload path already accepts arbitrary `.html` files,
so the import side needs no UI changes — only `parseRecipeElement` needs to
learn to read the new optional elements.

## Goals / Non-Goals

**Goals:**
- One `recipe/1` format, additive only — a file with none of the new elements
  (i.e. everything the AI prompt produces today) still parses exactly as it
  does today.
- A recipe exported by this feature and re-imported reproduces the original
  recipe's title, ingredients, instructions, notes, layout template, image,
  ingredient column count, ingredient quantity alignment, and image aspect
  ratio.
- Export produces a single, self-contained `.html` file (no external image
  references) so it can be emailed, AirDropped, etc. as one artifact.

**Non-Goals:**
- No JSON export format — this change replaces that idea with the HTML
  expansion.
- No resizing/compression of the exported image — embedded as-is.
- No bulk/whole-cookbook export — one recipe per export action.
- No change to `recipeImportPrompt.js` or the shopping-list QR feature
  (`qrShare.js`/`RecipeQRCode.vue`) — both are out of scope and unrelated.
- No shareable link/QR delivery for this feature — download-a-file only.

## Decisions

### Format stays version `"1"`, gains three optional elements
New, all-optional elements inside the existing `cm-recipe` article:
- `<img class="cm-image" src="data:<mime>;base64,...">` — the photo.
- `<meta class="cm-ingredient-columns" content="1">` — one of
  `templates.js`'s `INGREDIENT_COLUMN_OPTIONS`.
- `<meta class="cm-ingredient-qty-align" content="right">` — one of
  `INGREDIENT_QTY_ALIGN_OPTIONS`.
- `<meta class="cm-image-aspect-ratio" content="auto">` — one of
  `IMAGE_ASPECT_RATIOS`, travels with the image since it's only meaningful
  when a photo is present.

**Alternative considered:** bump to `data-cm-version="2"`. Rejected — nothing
about the new elements is incompatible with existing `version="1"` parsing;
they're purely additive, and a version bump would force `recipeImportPrompt.js`
and every already-transcribed pasted HTML to be treated as a different format
for no behavioral reason.

### Manual base64 encode/decode, not `FileReader`/`fetch`
`blobToDataUri` (export) reads `blob.arrayBuffer()` and base64-encodes it in
chunks; `dataUriToBlob` (import) base64-decodes the payload and parses the
mime type out of the `data:<mime>;base64,` header. Neither uses `FileReader`
or `fetch()` of a `data:` URI.

**Why:** `FileReader` and `fetch("data:...")` behavior is inconsistent across
the happy-dom test environment used by `vitest.config.js` and real browsers.
Plain `ArrayBuffer`/`Uint8Array` + `btoa`/`atob` work identically in both, so
`recipeExport.test.js` and `recipeImport.test.js` can round-trip a real `Blob`
without a browser.

### Export lives in `RecipeEditor.vue`, gated like Delete/Print
The "Export recipe" button sits in the existing `isEditing`-gated action row,
so it's only offered for already-saved recipes — exporting an in-progress,
unsaved draft isn't a supported entry point (the user can save first).

### `recipe-import`'s "image always null" requirement changes
`recipe-import`'s current spec explicitly guarantees imported recipes never
carry an image. This change replaces that guarantee with "image is null
unless the source has `.cm-image`" — see the `recipe-import` delta spec. This
is a behavior change for anyone relying on the old guarantee, but not a
data-loss risk: old-format sources (no `.cm-image`) are unaffected.

## Risks / Trade-offs

- **[Risk]** Embedding an unresized photo can make the exported `.html` file
  several MB. → **Mitigation**: none needed for this change (explicitly
  accepted); a future change could add optional resizing if this proves
  painful in practice.
- **[Risk]** A hand-edited or malformed `data:` URI in `.cm-image` (bad mime
  type, invalid base64) could throw during import. → **Mitigation**:
  `dataUriToBlob` failures are treated as "no image" for that recipe (same
  fallback-to-default posture as the existing `.cm-layout` validation),
  not a whole-recipe parse failure — a bad photo shouldn't block importing
  the rest of the recipe's fields.
- **[Trade-off]** Loosening the "image always null" import guarantee is a
  spec-level behavior change for `recipe-import`, not just an addition. Flagged
  as **BREAKING** in the proposal even though no existing data is affected.

## Open Questions

None outstanding — all resolved during brainstorming (delivery mechanism,
image handling, and settings scope were each explicitly decided with the
user).
