## Why

Transcribing recipes from messy source material (Drive docs, PDFs, bookmarked pages,
screenshots) into cookbook-maker is entirely manual today — the user must retype every
title, ingredient, and step through the recipe editor by hand. LLMs are already good at
transcribing such material into a well-specified text format; giving the user a
paste-ready prompt plus a small, reliable importer removes that manual-entry bottleneck
without building fragile PDF/OCR/webpage scraping into the app itself.

## What Changes

- Add a strict, structured-HTML recipe import format (`recipe/1`): one
  `<article class="cm-recipe" data-cm-format="recipe" data-cm-version="1">` block per
  recipe, optionally multiple per file (batch import). Files missing the exact
  `data-cm-format`/`data-cm-version` markers are rejected outright — no heuristic
  best-effort parsing of arbitrary recipe-shaped HTML.
- Add a client-side parser (`src/js/recipeImport.js`) using `DOMParser` that extracts
  `title`, ingredient lines (fed through the existing `parseIngredientsText()`),
  instruction steps, optional notes, and optional layout template from each matched
  `<article>`, validating exactly what the manual recipe editor validates (non-empty
  title, non-empty instructions). A recipe failing validation is skipped with a
  per-recipe reason rather than failing the whole batch. Imported recipes always get
  `image: null` — no image support in v1.
- Add a staged-review flow: selected file(s) are parsed entirely client-side with no
  database writes; each successfully parsed recipe is rendered via the existing
  `RecipeSheet.vue` component with an include/exclude checkbox (default checked); parse
  failures are listed separately with their reason. Only checked recipes are committed,
  via the existing `recipesStore.createRecipe()`, on user confirmation.
- Add an "Import Recipes" entry point next to "+ New Recipe" in `RecipeLibrary.vue`'s
  toolbar, opening the staged-review flow (a new route/view, not Settings — Settings
  stays reserved for whole-database backup/restore).
- Ship a paste-ready LLM prompt (in-app help text / docs) instructing an LLM to
  transcribe source material into the `recipe/1` format.

## Capabilities

### New Capabilities
- `recipe-import`: Parsing/validation contract for the `recipe/1` structured-HTML
  import format, the staged-review UX (preview, include/exclude, per-recipe failure
  reporting), and the commit-into-library behavior.

### Modified Capabilities
- `recipe-library`: Adds an "Import Recipes" action to the Global Recipe Library
  toolbar as a new entry point alongside "+ New Recipe".

## Impact

- New files: `src/js/recipeImport.js` (parser), a new staged-review view/component,
  a new route in `src/router/index.js`, unit tests under
  `src/js/recipeImport.test.js`.
- Modified files: `src/views/RecipeLibrary.vue` (toolbar entry point).
- Reused, unmodified: `parseIngredientsText()` (`src/js/conversions.js`),
  `recipesStore.createRecipe()` (`src/stores/recipes.js`), `RecipeSheet.vue`.
- No changes to the Dexie schema, `db.js`, or the recipe data model.
- No new runtime dependencies (`DOMParser` is native and already exercised under the
  project's `happy-dom` vitest setup).
