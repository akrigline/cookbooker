## 1. Refactor shared recipe-article builder/parser for reuse

- [ ] 1.1 In `src/js/recipeExport.js`, extract `buildRecipeArticleHtml(recipe)`
      (returns just the `<article data-cm-format="recipe" data-cm-version="1">
      ...</article>` string) out of `exportRecipeToHtml`, and export it.
      `exportRecipeToHtml` keeps its current signature/behavior, now wrapping
      `buildRecipeArticleHtml`'s output in the single-recipe document shell.
- [ ] 1.2 In `src/js/recipeImport.js`, export `parseRecipeElement` (currently
      module-private) so `cookbookImport.js` can call it directly per recipe
      article.
- [ ] 1.3 Add/update unit tests for both files confirming `exportRecipeToHtml`'s
      output is byte-identical to before the refactor.

## 2. Cookbook export

- [ ] 2.1 Create `src/js/cookbookExport.js` with `exportCookbookToHtml(project,
      chapters, recipesByChapter)` — builds the `cookbook/1` document: cookbook
      settings meta elements, one `.cm-chapter` section per chapter (in
      sequence order, carrying `data-cm-chapter-name`/`data-cm-chapter-sequence`),
      each containing that chapter's recipes (in sequence order) via
      `buildRecipeArticleHtml`.
- [ ] 2.2 Add a filename helper (sanitize the cookbook title into a safe
      `.html` filename; fall back to `cookbook.html` when the title is empty)
      per design.md's Open Questions resolution.
- [ ] 2.3 Add unit tests: settings round-trip into meta elements, chapter/recipe
      ordering, an empty chapter producing a section with no `recipe/1`
      elements, a recipe with a photo carrying the same fields
      single-recipe export would produce.
- [ ] 2.4 Add an "Export Cookbook" button to `ProjectView.vue`'s header action
      row (next to "Import Recipes"/"Print Preview"): gathers the project,
      its chapters, and their recipes from the stores, calls
      `exportCookbookToHtml`, and downloads the result via the same
      `URL.createObjectURL` + synthetic `<a>` pattern `Settings.vue` uses for
      whole-database export.

## 3. Cookbook import parsing

- [ ] 3.1 Create `src/js/cookbookImport.js` with `parseCookbookImportHtml(text)`
      — finds the `[data-cm-format="cookbook"]` root (returns `{ rejected: true
      }` if absent, matching `parseRecipeImportHtml`'s contract), extracts
      cookbook settings from its meta elements, then for each `.cm-chapter`
      section extracts its name/sequence and parses each nested
      `[data-cm-format="recipe"]` via `parseRecipeElement`, collecting
      `{ chapterName, label, reason }` failures instead of throwing.
- [ ] 3.2 Handle malformed/missing `data-cm-chapter-sequence` by falling back to
      document order (per design.md Risk mitigation), and a cookbook section
      with zero chapters by still returning a cookbook with an empty chapter
      list.
- [ ] 3.3 Add unit tests: valid file round-trips through export→import, missing
      cookbook root is rejected, one bad recipe is skipped and reported while
      the rest of the file still imports, a chapter where every recipe fails
      still produces an (empty) chapter.

## 4. Cookbook import persistence

- [ ] 4.1 Add `importCookbook(data)` to `src/js/db.js`: one
      `db.transaction('rw', db.projects, db.chapters, db.recipes,
      db.project_recipes, ...)` that inserts the project row, one chapter per
      parsed chapter (the lowest-sequence chapter reuses the required
      `isDefault: true` slot instead of adding a second default chapter — see
      design.md Decision 3), each chapter's recipes (via the same defaulting
      `addRecipe` applies, `fitsOnPage: null` regardless of any imported
      value), and their `project_recipes` placements in order. Returns
      `{ project, chapters, recipes, placements }` (the actual persisted rows).
- [ ] 4.2 Add store-level wiring (`projectsStore`/`recipesStore`) that calls
      `db.importCookbook`, then mirrors the returned rows into in-memory state
      per `CLAUDE.md`'s store/db.js invariant (no separate recompute), and
      fires `triggerFitMeasurement` for the newly created recipes.
- [ ] 4.3 Add tests: a project + chapters + recipes + placements are created
      correctly and in order; the single default-chapter invariant holds
      (`getMiscChapter`/`deleteChapter` still work on the imported project);
      existing cookbooks/recipes are untouched by the import.

## 5. Cookbook import UI

- [ ] 5.1 Add an "Import Cookbook" action to `Dashboard.vue` (the cookbooks
      list) alongside existing cookbook actions: file picker → read file text
      → `parseCookbookImportHtml` → on `rejected`, show an error and stop.
- [ ] 5.2 On successful parse, call the store's import action, then navigate to
      `/projects/:id` for the new cookbook, passing any parse failures via a
      one-shot `history.state` payload (matching the pattern
      `cookbookImportShortcut`'s `autoSelectIds` already uses).
- [ ] 5.3 In `ProjectView.vue`, read that one-shot `history.state` payload on
      mount (if present) and show a summary banner listing skipped recipes by
      chapter, then clear it via `history.replaceState` so back-navigation
      doesn't re-trigger it.
- [ ] 5.4 Add a router entry only if the import flow needs a dedicated route
      (e.g. `/import-cookbook`) rather than being fully modal/inline on
      `Dashboard.vue` — decide during implementation based on how
      `/library/import` is structured.

## 6. Verification

- [ ] 6.1 `npm test` and `npm run build` both green.
- [ ] 6.2 Manual pass: export a multi-chapter cookbook with a photo recipe,
      re-import it, confirm chapters/recipes/order/settings match and the
      original cookbook is untouched.
- [ ] 6.3 Manual pass: import a hand-edited file with one broken recipe and
      confirm the summary banner reports it while the rest imports cleanly.
