## 1. Parser module

- [ ] 1.1 Create `src/js/recipeImport.js` exporting a pure function (e.g.
      `parseRecipeImportHtml(text)`) that: parses `text` with `DOMParser`, finds all
      `[data-cm-format="recipe"]` elements, and returns `{ recipes, failures }` where
      `recipes` is the list of successfully extracted+validated candidate recipe
      objects and `failures` is a list of `{ reason }` (or similar) for each rejected
      element.
- [ ] 1.2 If zero `[data-cm-format="recipe"]` elements are found anywhere in the
      document, treat this as a whole-file rejection (return a top-level error /
      empty result with a clear reason), per the strict-parsing decision.
- [ ] 1.3 For each matched element, gate on `data-cm-version="1"`; treat a
      missing/mismatched version as a per-recipe failure, not a guess-parse.
- [ ] 1.4 Extract `title` from `.cm-title` textContent (trimmed).
- [ ] 1.5 Extract ingredient lines from `.cm-ingredients li` textContent (trimmed,
      filtered non-empty), join with `\n`, and pass through the existing
      `parseIngredientsText()` from `src/js/conversions.js` — do not hand-roll
      ingredient parsing.
- [ ] 1.6 Extract instruction steps from `.cm-instructions li` textContent, falling
      back to `.cm-instructions p` when no `li` is present; join into a
      newline-separated string.
- [ ] 1.7 Extract optional `notes` from `.cm-notes` textContent, and optional
      `layoutTemplate` from `.cm-layout[content]`, validating it against the known
      template ids (`src/js/templates.js`'s `LAYOUT_TEMPLATES`) and defaulting to
      `'standard'` otherwise.
- [ ] 1.8 Always set `image: null` on every extracted candidate recipe.
- [ ] 1.9 Apply the same required-field validation as `RecipeEditor.vue` (non-empty
      title, non-empty instructions) to each candidate; on failure, push a
      per-recipe failure with a human-readable reason instead of including it in
      `recipes`, and continue processing the rest of the file.

## 2. Unit tests

- [ ] 2.1 Add `src/js/recipeImport.test.js` following the `describe`/`it` pattern of
      `src/js/conversions.test.js`.
- [ ] 2.2 Test: a well-formed single-recipe file parses to one recipe with correct
      title/ingredients/instructions and `image: null`.
- [ ] 2.3 Test: a well-formed batch file with multiple `<article class="cm-recipe">`
      blocks parses to multiple recipes.
- [ ] 2.4 Test: a file missing the `data-cm-format="recipe"` marker entirely is
      rejected (empty `recipes`, populated top-level/failure reason).
- [ ] 2.5 Test: a recipe missing a required field (e.g. empty title, or no
      instruction steps) is skipped with a reason in `failures`, while other valid
      recipes in the same batch still import successfully.
- [ ] 2.6 Test: instructions extraction falls back to `<p>` elements when no `<li>`
      is present in `.cm-instructions`.
- [ ] 2.7 Test: an unrecognized/missing `data-cm-version` is treated as a per-recipe
      failure, not a hard parse of the content.
- [ ] 2.8 Run `npm test` and confirm the full suite (existing + new) passes.

## 3. Staged review view

- [ ] 3.1 Create a new `src/views/RecipeImport.vue` view: a hidden
      `<input type="file">` (following the `Settings.vue` trigger-button pattern),
      accepting one or more `.html` files.
- [ ] 3.2 On file selection, read each file's text (`File.text()`), run it through
      the parser module, and merge results across files with zero DB writes.
- [ ] 3.3 Render each successfully parsed recipe using the existing `RecipeSheet.vue`
      component, paired with an include/exclude checkbox defaulting to checked.
- [ ] 3.4 Render parse failures in a separate list, each with its reason string.
- [ ] 3.5 Add an "Import N recipes" confirm action that calls
      `recipesStore.createRecipe()` once per checked recipe, then routes to the
      Recipe Library (mirroring `RecipeEditor.vue`'s post-save navigation).
- [ ] 3.6 Handle the whole-file-rejected case (no valid markers found) by showing an
      error message and no importable recipes, without crashing.

## 4. Entry point wiring

- [ ] 4.1 Register a new route (e.g. `/library/import`, name `recipe-import`) for
      `RecipeImport.vue` in `src/router/index.js`, alongside the other `/library/*`
      routes.
- [ ] 4.2 Add an "Import Recipes" action/link to `RecipeLibrary.vue`'s toolbar, next
      to the existing "+ New Recipe" link.

## 5. LLM prompt

- [ ] 5.1 Add the paste-ready LLM prompt text (from the design report §3) somewhere
      the user can copy it from within the import flow (e.g. a "Copy prompt" button
      or a static help block on `RecipeImport.vue`).

## 6. Verification

- [ ] 6.1 Run `npm run build` and confirm it succeeds.
- [ ] 6.2 Run `npm run dev` and use chrome-devtools-axi to walk through: importing a
      single-recipe HTML file end to end (select file → review screen renders the
      recipe via `RecipeSheet` → confirm → recipe appears in the Library).
- [ ] 6.3 Walk through importing a batch HTML file with multiple recipes end to end,
      including excluding one recipe via its checkbox and confirming only the
      checked ones are created.
- [ ] 6.4 Walk through selecting an invalid file (missing the required markers) and
      confirm the review screen shows a clear error rather than crashing.
- [ ] 6.5 Confirm existing recipe library/editor functionality is unaffected
      (spot-check search, manual "+ New Recipe", editing an existing recipe).
