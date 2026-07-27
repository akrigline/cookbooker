## 1. Shared processing refactor

- [x] 1.1 In `src/views/RecipeImport.vue`, extract a `processImportSource(text, sourceLabel)`
      helper from `handleFileChange`'s per-file body (call `parseRecipeImportHtml`, push
      into `candidates`/`failures`/`rejectedFiles`), and a `resetResults()` helper for the
      state-clearing lines currently duplicated at the top of `handleFileChange`.
- [x] 1.2 Update `handleFileChange` to call `resetResults()` once, then
      `processImportSource(text, file.name)` per selected file.

## 2. Paste entry point

- [x] 2.1 Add a `mode` ref (`'file' | 'paste'`, default `'file'`) and a two-button toggle
      ("Upload file" / "Paste HTML") that switches which input is shown.
- [x] 2.2 Add a `pastedHtml` ref and a textarea bound to it, shown when `mode === 'paste'`,
      plus a trigger button that calls a new `handlePasteImport()`.
- [x] 2.3 Implement `handlePasteImport()`: guard on empty/whitespace-only `pastedHtml`
      (set `error` and return without calling the parser), otherwise call `resetResults()`
      then `processImportSource(pastedHtml.value.trim(), 'Pasted HTML')`.
- [x] 2.4 Generalize the "Files not recognized" section copy so it reads naturally for
      both file names and the `"Pasted HTML"` label (e.g. "doesn't look like a
      cookbook-maker recipe import").
- [x] 2.5 Update the empty-state hint text to mention both the file and paste options.

## 3. Tests

- [x] 3.1 Add unit tests in `src/js/recipeImport.test.js` covering paste-relevant inputs
      to `parseRecipeImportHtml`: a bare HTML fragment with no `<html>/<body>` wrapper
      (as pasted text commonly looks), and confirm it parses identically to the wrapped
      version.
- [x] 3.2 Run `npm test` and confirm all tests pass.

## 4. Manual/browser verification

- [x] 4.1 Using chrome-devtools-axi, run the app (`npm run dev`), open Import Recipes,
      switch to Paste HTML, paste a single-recipe `recipe/1` HTML snippet, submit, and
      confirm the staged review screen shows it, then complete the import into the
      library.
- [x] 4.2 Repeat with a batch paste containing multiple `data-cm-format="recipe"`
      elements and confirm all recipes are staged for review.
- [x] 4.3 Paste invalid (non-`recipe/1`) text and confirm the same "not recognized"
      error styling/messaging as the file path, with no crash.
- [x] 4.4 Confirm the existing file-picker path still works unchanged (regression check).

## 5. OpenSpec finalization

- [x] 5.1 Run `npm run build` to confirm the production build still succeeds.
- [x] 5.2 Archive the change with `openspec-archive-change` once implemented and verified.
