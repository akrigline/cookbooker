## 1. Cookbook Toolbar — Import Action

- [x] 1.1 Add an "Import Recipes" toolbar button to `ProjectView.vue` (alongside the existing toolbar actions)
- [x] 1.2 Implement the click handler: push to `{ name: 'recipe-import', state: { returnTo: 'project', projectId: <current> } }`
- [x] 1.3 Verify the button is visible and navigates to the import view with the correct route state

## 2. RecipeImport — Return-to-Cookbook Context

- [x] 2.1 In `RecipeImport.vue`, read `history.state.returnTo` and `history.state.projectId` on setup
- [x] 2.2 Modify `confirmImport()` to collect the IDs of successfully-created recipes (from the resolved `createRecipe` return values)
- [x] 2.3 After confirm, if `returnTo === 'project'`: push to `{ name: 'project', params: { projectId }, state: { autoSelectIds: [...] } }`; otherwise keep existing behavior (stay on import view after success)
- [x] 2.4 Verify that importing from the library toolbar (no `returnTo` state) still behaves exactly as before

## 3. ProjectView — Post-Import Pre-Selection

- [x] 3.1 In `ProjectView.vue`, on mount and on route enter, read `history.state.autoSelectIds`
- [x] 3.2 If `autoSelectIds` is present and non-empty: initialize `libSelectedIds` from those IDs (intersecting with recipes that actually exist in the library)
- [x] 3.3 Open the "Add Recipes" sidebar panel automatically (set the open-state flag) after populating the selection
- [x] 3.4 Clear / consume the route state after reading it so a back-navigation doesn't re-trigger the pre-selection
- [x] 3.5 Verify the "Add Recipes" sidebar opens with the imported recipes pre-checked after the import round-trip

## 4. Add Recipes Picker — Pre-Check UX

- [x] 4.1 Confirm `LibrarySidebarPanel.vue` correctly reflects the `libSelectedIds` set when it opens (no additional prop needed if set is populated before open)
- [x] 4.2 Verify the user can uncheck any pre-selected recipe before confirming
- [x] 4.3 Verify no recipes are added to the cookbook until the user explicitly confirms the selection

## 5. Spec Updates

- [x] 5.1 Run `openspec sync --change cookbook-import-shortcut` (or equivalent) to merge delta specs into main specs, or manually apply delta content to `openspec/specs/cookbook-management/spec.md` and `openspec/specs/recipe-import/spec.md`
- [x] 5.2 Create `openspec/specs/cookbook-import-shortcut/spec.md` with the new capability spec content

## 6. Tests & Verification

- [x] 6.1 Add unit tests in `src/js/` (or relevant plain-JS module) covering the ID-collection logic in the import confirm path if it is extracted to a testable function
- [x] 6.2 Run `npm test` and confirm all tests pass
- [x] 6.3 Run `npm run build` and confirm the production build succeeds
- [ ] 6.4 Manual smoke test: use "Import Recipes" from a cookbook page, confirm import, verify pre-selection in the "Add Recipes" picker, confirm adding, and verify the recipes appear in the cookbook — not completed: `chrome-devtools-axi` failed to attach to a browser in this worktree environment (`Protocol error (Target.setDiscoverTargets): Target closed` on every `open` attempt, tried against both a fresh and restarted dev server). Verified instead via full code read-through, `npm test`, and `npm run build`.
