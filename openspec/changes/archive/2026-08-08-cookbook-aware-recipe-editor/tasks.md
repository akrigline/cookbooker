## 1. Prerequisite: Review cookbook-recipe-preview-navigation UI shape decision

- [x] 1.1 Read `openspec/changes/cookbook-recipe-preview-navigation/design.md` Decision 1 and determine the chosen UI shape (dialog, slide-out panel, or route) before beginning implementation tasks that depend on it

## 2. Route and Return-Context Parameter

- [x] 2.1 Confirm the existing recipe editor route in `src/router/index.js` and verify it supports query parameters without breaking existing navigation
- [x] 2.2 Document (or annotate in code) the two new optional query params: `returnToProject` and `returnToRecipe`, with their expected types and semantics

## 3. Preview Component: Pass Return Context on "Edit Recipe"

- [x] 3.1 Update `RecipePreviewDialog.vue` (or equivalent preview component) to receive a `projectId` prop from its parent view
- [x] 3.2 Update `ProjectView.vue` to pass its current `projectId` into the preview component when opening a preview
- [x] 3.3 Update the "Edit Recipe" navigation call in the preview component to append `returnToProject` and `returnToRecipe` query params when `projectId` is present

## 4. Editor View: Context-Aware Back Navigation Label

- [x] 4.1 In `RecipeEditor.vue` (or equivalent), compute a `returnContext` derived from `$route.query.returnToProject` and `$route.query.returnToRecipe`
- [x] 4.2 Update the back-navigation button label to render "Back to Cookbook" when `returnContext` is set, and "Back to Recipe Library" otherwise
- [x] 4.3 Update the back-navigation click handler to route to `/project/:projectId?reopenRecipe=:recipeId` when `returnContext` is set, and to the library route otherwise

## 5. Editor View: Context-Aware Post-Save Navigation

- [x] 5.1 Update the save handler in `RecipeEditor.vue` to navigate to the cookbook project view (`/project/:projectId?reopenRecipe=:recipeId`) after a successful save when `returnContext` is set
- [x] 5.2 Verify that saving without a `returnContext` still navigates to the recipe library (existing behavior unchanged)
- [x] 5.3 Confirm the discard/cancel path (if distinct from back) matches the same routing logic as the back button when `returnContext` is set

## 6. Project View: Reopen Preview on Return

- [x] 6.1 In `ProjectView.vue`, add a watcher (or `onMounted`/route guard) that reads the `reopenRecipe` query param on route entry
- [x] 6.2 When `reopenRecipe` is present and the recipe exists in the in-memory chapter lists, trigger the preview open for that recipe using the same mechanism as a user click (coordinate with the UI shape resolved in task 1.1)
- [x] 6.3 Immediately call `router.replace` to remove the `reopenRecipe` query param from the URL after processing, preventing re-trigger on subsequent navigations
- [x] 6.4 Handle the not-found case: if `reopenRecipe` references a recipe not in the current project, silently skip the reopen and remove the param

## 7. Testing

- [x] 7.1 Write a unit test in `src/js/` (or an appropriate plain-JS module) verifying the `returnContext` computation logic (present vs. absent query params) — note: no component tests are available per project constraints
- [x] 7.2 Manually verify the full round-trip flow: cookbook view → click recipe → preview opens → click "Edit Recipe" → editor shows "Back to Cookbook" → save → returns to cookbook with preview reopened
- [x] 7.3 Manually verify the library path is unaffected: recipe library → click recipe → editor shows "Back to Recipe Library" → save → returns to library
- [x] 7.4 Run `npm test` and `npm run build` and confirm both pass with no new failures
