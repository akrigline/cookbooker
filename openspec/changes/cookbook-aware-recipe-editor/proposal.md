## Why

When a user clicks "Edit Recipe" from a cookbook recipe preview, the editor loses all knowledge of the originating cookbook context — the back button reads "Back to Recipe Library" and saving also returns to the library, leaving the user stranded away from the cookbook they were working in. Users who entered the editor via a cookbook expect to be returned to that cookbook when they are done, with the recipe preview for the recipe they just edited reopened automatically.

## What Changes

- The **"Back to Recipe Library"** button in the recipe editor is replaced by **"Back to Cookbook"** when the editor was opened from within a cookbook recipe preview.
- **Saving the recipe** from within this cookbook-entry path navigates back to the cookbook project view (not the recipe library).
- **On returning to the cookbook**, the preview for the edited recipe reopens automatically, restoring the in-context browsing flow.
- The editor route accepts optional return-context parameters (cookbook/project ID + recipe ID) that encode this origination intent.

## Capabilities

### New Capabilities

*(none — this change extends existing capabilities)*

### Modified Capabilities

- `recipe-editor`: Adds a new requirement for context-aware back navigation and post-save routing when the editor is entered from a cookbook recipe preview.
- `recipe-preview`: Adds a new requirement that the cookbook project view automatically reopens the recipe preview after returning from the editor with a cookbook context.

## Impact

- **`src/router/index.js`** — the recipe editor route gains optional query params (e.g. `?returnToProject=<id>&returnToRecipe=<id>`) to encode return context.
- **`src/views/RecipeEditor.vue`** (or equivalent editor view) — reads the return-context params to adapt the back-button label and post-save navigation target.
- **`src/views/ProjectView.vue`** (or equivalent cookbook project view) — on mount/activate, checks for a `returnToRecipe` signal and reopens the preview for that recipe.
- **`src/components/RecipePreviewDialog.vue`** (or equivalent preview component) — passes the return-context params when navigating to the editor via "Edit Recipe".
- The implementation shape for reopening the preview is dependent on the UI shape chosen by the `cookbook-recipe-preview-navigation` change (dialog, slide-out panel, or route). This proposal notes that dependency explicitly; the tasks will mark that design decision as a prerequisite.
