## Context

When a user opens the recipe editor from the cookbook project view (via the "Edit Recipe" button inside the recipe preview), the editor currently has no knowledge of how it was entered. Its back button always reads "Back to Recipe Library," and saving always routes to the library. This breaks the user's cookbook-oriented flow — they must manually navigate back to the cookbook and re-find the recipe they were just editing.

The recipe editor route lives in `src/router/index.js`, and the editor view (`src/views/RecipeEditor.vue` or equivalent) handles back navigation and post-save routing. The cookbook project view (`src/views/ProjectView.vue`) already manages which recipe preview is open.

This change depends on the **`cookbook-recipe-preview-navigation`** change, specifically its **Decision 1** (UI shape: dialog vs. slide-out panel vs. route). The mechanism for "reopening the preview on return" differs across shapes:
- **Dialog / panel shape**: the project view detects a route signal and imperatively opens the preview dialog/panel for the returned recipe.
- **Route shape**: the user lands directly on the preview route, so no additional reopening logic is needed — the route itself is the preview.

This design defers the concrete reopening implementation to align with whichever shape that change selects.

## Goals / Non-Goals

**Goals:**
- When the editor is entered from a cookbook recipe preview, the back button reads "Back to Cookbook" instead of "Back to Recipe Library."
- Saving the recipe (or discarding changes) navigates back to the cookbook project view.
- On returning to the cookbook project view, the preview for the just-edited recipe is automatically reopened.
- The return-context is encoded in the editor route, not in component state, so hard-refresh and browser history work correctly.

**Non-Goals:**
- Changing the editor's back/save behavior when entered from the recipe library (existing behavior preserved).
- Supporting return to an arbitrary third location (only library vs. cookbook).
- Handling the case where the cookbook or recipe no longer exists on return (treat as ordinary navigation back to the library).

## Decisions

### Decision 1: Encode return context as query parameters on the editor route

The editor route receives optional query parameters to carry the return context:

```
/recipe/:id/edit?returnToProject=<projectId>&returnToRecipe=<recipeId>
```

- `returnToProject`: the ID of the cookbook project to return to
- `returnToRecipe`: the ID of the recipe whose preview should be reopened on return (almost always the same as the route `:id`, but carried explicitly for clarity and extensibility)

**Alternatives considered:**
- **Vue router `meta` or `history.state`**: State survives neither a hard refresh nor a bookmarked link. Query params are durable.
- **Pinia/store flag**: Component state that disappears on refresh; also awkward to clean up after navigation.
- **Separate named route** (`/recipe/:id/edit-from-cookbook`): Avoids query params but duplicates route configuration and complicates guards.

Query params are the idiomatic Vue Router choice for optional, context-carrying navigation metadata.

### Decision 2: Editor view reads context from `$route.query` and adapts its UI

`RecipeEditor.vue` (or equivalent) computes a `returnContext` object from `$route.query`:

```js
const returnContext = computed(() => {
  const { returnToProject, returnToRecipe } = route.query
  if (returnToProject && returnToRecipe) {
    return { projectId: returnToProject, recipeId: returnToRecipe }
  }
  return null
})
```

When `returnContext` is non-null:
- The back-navigation button label changes to "Back to Cookbook."
- Back navigation routes to `/project/:projectId?reopenRecipe=:recipeId` instead of `/library`.
- Post-save navigation uses the same cookbook-return route.

When `returnContext` is null, all existing behavior is unchanged.

### Decision 3: Signal the project view to reopen the preview via a query param

On returning to the cookbook project view, a `reopenRecipe=<recipeId>` query param is appended to the route. `ProjectView.vue` watches this param on mount/update and, if present:

1. Finds the matching recipe in its in-memory chapter lists.
2. Triggers the preview open for that recipe (via the same mechanism used when a user clicks a recipe normally).
3. Removes the query param from the URL (using `router.replace`) to prevent the preview from re-triggering on subsequent navigations.

**Dependency note**: The exact "trigger preview open" call in step 2 depends on the UI shape chosen by `cookbook-recipe-preview-navigation` Decision 1 — the implementer should read that change's design before wiring this step.

### Decision 4: The preview component passes return context when navigating to the editor

`RecipePreviewDialog.vue` (or equivalent) already has an "Edit Recipe" button. That button's navigation call is updated to append the return-context query params:

```js
router.push({
  name: 'recipe-edit',
  params: { id: props.recipe.id },
  query: {
    returnToProject: props.projectId,    // injected by the parent view
    returnToRecipe: props.recipe.id
  }
})
```

`ProjectView.vue` passes its current `projectId` into the preview component as a prop. If the preview component is ever used outside of a cookbook project context (e.g., standalone recipe library preview), `projectId` is omitted and the query params are not set, preserving the existing library flow.

## Risks / Trade-offs

- **Stale project/recipe on return** → If the recipe was deleted or removed from the cookbook between entry and return, the `reopenRecipe` param will not find a match. Mitigation: silently skip the reopen (user lands on the project view normally).
- **Query param leakage** → The `reopenRecipe` param must be removed from the URL after the preview opens, or a user copying the URL could inadvertently trigger a preview reopen. Mitigation: `router.replace` immediately after processing the param (Decision 3, step 3).
- **Shape dependency** → The preview reopen mechanism in step 2 of Decision 3 is underspecified until `cookbook-recipe-preview-navigation` resolves Decision 1. Mitigation: tasks.md marks this as a prerequisite and defers the wiring task.

## Open Questions

1. **UI shape** (deferred): Which preview shape does `cookbook-recipe-preview-navigation` choose — dialog, panel, or route? The answer determines how `ProjectView` triggers the reopen.
2. **Discard / cancel path**: Should "Cancel" in the editor (if distinct from the back button) also use the cookbook-return route, or always return to the library? *Proposed default: same as back button when `returnContext` is set.*
