## 1. DB Schema Migration

- [ ] 1.1 Add `db.version(3)` in `src/js/db.js` with an `.upgrade()` callback that calls `tx.recipes.toCollection().modify({ fitsOnPage: null })` to backfill the field on all existing recipe rows.
- [ ] 1.2 Update every `db.addRecipe` call site (or the function body) to include `fitsOnPage: null` in the inserted object, so new rows always carry the field from creation.

## 2. Fit Measurement Utility

- [ ] 2.1 Create `src/js/recipeFitMeasure.js` — exports an async `measureRecipeFit(recipe)` function.
  - Mounts the existing `RecipeSheet` component (or equivalent print-render component) into a hidden off-screen container (`position: fixed; top: -9999px; left: -9999px; visibility: hidden`) sized to exact print dimensions.
  - Waits for `nextTick` + one `requestAnimationFrame` to let the component settle.
  - Returns `scrollHeight <= clientHeight` (i.e., `true` if fits, `false` if overflows).
  - Unmounts and removes the container on completion or error.
  - Returns `null` on any error so the caller can skip the persist without crashing.
- [ ] 2.2 Write unit tests for `measureRecipeFit` in `src/js/__tests__/recipeFitMeasure.test.js` (happy-dom environment — mount a stub component, verify fit/overflow detection logic).

## 3. Trigger Measurement on Write

- [ ] 3.1 In `src/stores/recipesStore.js` (or equivalent), after the `db.addRecipe` call in the `addRecipe` action resolves, fire `measureRecipeFit(newRecipe).then(fits => db.updateRecipe(id, { fitsOnPage: fits })).then(() => store.patchRecipe(id, { fitsOnPage: fits }))` (fire-and-forget from the action's caller — do not await or block the UI).
- [ ] 3.2 Apply the same post-write measurement in the `updateRecipe` store action after `db.updateRecipe` resolves.
- [ ] 3.3 In the import-confirm handler (wherever `RecipeImport.vue` or its controller calls the bulk create path), fire measurement for each newly created recipe ID after the batch write completes.

## 4. Warning Badge Component

- [ ] 4.1 Create `src/components/RecipeFitWarningBadge.vue` — a `<span>` wrapping a triangle-with-`!` SVG icon.
  - Include a `title` attribute (tooltip): `"This recipe may not fit on a single printed page"`.
  - Style with a warm amber/orange color (distinct from error red, non-alarming).
  - Keep it small (`1em` height, inline) so it sits naturally next to a recipe title in a list row.
- [ ] 4.2 Write a basic render test in `src/js/__tests__/recipeFitWarningBadge.test.js` if testable without component mounting; otherwise document that it is verified visually.

## 5. Apply Badge to Library List Items

- [ ] 5.1 In the Global Recipe Library list (the component rendering recipe rows in the library view), import `RecipeFitWarningBadge` and render it next to the recipe title when `recipe.fitsOnPage === false`.
- [ ] 5.2 Confirm the library list already reads from the reactive recipes store (so `fitsOnPage` updates propagate automatically without extra wiring).

## 6. Apply Badge to Cookbook Chapter Recipe Rows

- [ ] 6.1 In `ProjectView.vue` (cookbook detail screen), import `RecipeFitWarningBadge` and render it on each chapter recipe row when the recipe's `fitsOnPage === false`.
- [ ] 6.2 Confirm the cookbook view already joins recipe data from the store (or add a lookup to get `fitsOnPage` from the global recipes store by recipe ID for each row).

## 7. Spec Updates

- [ ] 7.1 Create `openspec/changes/recipe-fit-warning/specs/recipe-library.md` — delta spec adding a requirement for the overflow warning badge on library list items.
- [ ] 7.2 Create `openspec/changes/recipe-fit-warning/specs/cookbook-management.md` — delta spec adding a requirement for the overflow warning badge on cookbook chapter recipe rows.
- [ ] 7.3 Create `openspec/changes/recipe-fit-warning/specs/recipe-import.md` — delta spec noting that confirmed import triggers fit measurement for each imported recipe.
- [ ] 7.4 Create `openspec/changes/recipe-fit-warning/specs/print-and-export.md` — delta spec noting that the single-page constraint is now proactively surfaced as a `fitsOnPage` flag computed after every write.
