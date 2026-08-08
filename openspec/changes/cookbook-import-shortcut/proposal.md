## Why

Importing recipes into a specific cookbook currently requires multiple disconnected steps: navigate to the recipe library, import, navigate back to the cookbook, open "Add Recipes", locate the newly-imported recipes, select them, and confirm. Users who regularly batch-import recipes experience this as unnecessary friction — the system knows which recipes were just created, yet forces them to find and re-select them manually. Adding an "Import Recipes" shortcut directly on the cookbook page and automatically pre-checking the freshly-imported recipes in the "Add Recipes" picker collapses this multi-step round-trip into a single, linear flow.

## What Changes

- Add an **"Import Recipes"** toolbar action to the cookbook page (`ProjectView`) alongside the existing "Add Recipes" action.
- The import flow (file picker / paste input → staged review → confirm) is launched from the cookbook page using the **same components and logic** as the library-based import — no duplicate import logic.
- After the user confirms the import from this shortcut, the system collects the **IDs of the newly-created recipes** and opens the "Add Recipes" picker automatically with those recipes **pre-checked**.
- The user reviews the pre-selection (can uncheck any), optionally picks a chapter, and explicitly confirms to add them to the cookbook — auto-select never bypasses the user's final confirmation.
- The existing "Import Recipes" entry point in the recipe library toolbar is **unchanged**.

## Capabilities

### New Capabilities
- `cookbook-import-shortcut`: An import entry point on the cookbook page that, after a successful import, automatically opens the "Add Recipes" picker with the newly-imported recipes pre-checked, enabling users to import and add recipes to a cookbook in one continuous flow.

### Modified Capabilities
- `cookbook-management`: The cookbook page toolbar gains an "Import Recipes" action; the "Add Recipes" picker gains support for a pre-checked initial selection passed by the caller.
- `recipe-import`: The import review flow gains an optional caller context (`returnTo: 'cookbook'`, `autoSelectIds`) that, after confirming, redirects back to the cookbook with pre-selection state instead of staying in the library view.

## Impact

- **`src/views/ProjectView.vue`** — new toolbar button; new handler to launch import with cookbook-return context; handler for post-import route state to open picker with pre-selection.
- **`src/views/RecipeImportReview.vue`** (or equivalent import review component) — reads optional `returnTo` / caller context from route state; after confirming, navigates to the cookbook route with `autoSelectIds` state instead of the default post-import destination.
- **`src/components/AddRecipesDialog.vue`** (or equivalent picker component) — accepts an optional `initialCheckedIds` prop/state to pre-check a set of recipes on open.
- **Router (`src/router/index.js`)** — route state shape for carrying `autoSelectIds` from import back to the cookbook view.
- No new dependencies; no database schema changes; no breaking changes to existing import or cookbook flows.
