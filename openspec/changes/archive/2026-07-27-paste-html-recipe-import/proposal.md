## Why

The recipe-import feature only accepts recipes via a saved `.html` file, requiring the
user to save the LLM's chat output to disk before they can import it. Most LLM chat UIs
make copy-paste the path of least resistance, so requiring a file round-trip is
needless friction for the common case.

## What Changes

- Add a "Paste HTML" entry point to `RecipeImport.vue`, alongside the existing file
  picker, via a mode toggle (Upload file / Paste HTML). The paste mode shows a textarea
  and a trigger button.
- Both entry points funnel into the same shared processing step: the raw HTML string
  (from `file.text()` or the textarea) is passed to the existing
  `parseRecipeImportHtml()` unchanged, and the result is staged into the same
  candidates/failures/rejected review state and rendered through the same
  `RecipeSheet.vue` staged-review screen. No forked parsing or review logic.
- Pasting text with no `data-cm-format="recipe"` marker produces the same
  "not recognized" rejection messaging the file path already shows for a bad file.
- Pasting empty/whitespace-only text is guarded in the UI (clear inline error) before
  it ever reaches the parser, since there is no analog to "the user picked zero files."

## Capabilities

### Modified Capabilities
- `recipe-import`: Adds a second, additive entry point (paste) that reaches the same
  strict-format parsing, per-recipe validation, and staged-review requirements the file
  entry point already satisfies. Adds a new requirement describing the paste UI entry
  point itself (textarea, trigger, empty-paste guard).

## Impact

- Modified files: `src/views/RecipeImport.vue` (mode toggle, textarea, shared
  processing helper), `src/js/recipeImport.test.js` (new paste-oriented parsing
  scenarios: HTML fragment without a wrapping document, whitespace-only input).
- Reused, unmodified: `src/js/recipeImport.js`'s `parseRecipeImportHtml()`,
  `recipesStore.createRecipe()`, `RecipeSheet.vue`.
- No changes to the Dexie schema, `db.js`, or the recipe data model.
- No new runtime dependencies.
