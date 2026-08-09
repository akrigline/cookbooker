## Context

The app has a full recipe-import flow living at `/library/import` (`RecipeImport.vue`). That view handles file-pick and paste-HTML entry, staged review, and confirmation — all purely client-side. The cookbook page (`ProjectView.vue`) already has a sidebar panel (`LibrarySidebarPanel.vue`) that is the "Add Recipes" picker: it shows available library recipes, lets the user check them, pick a chapter, and add them to the cookbook. These two flows are today entirely decoupled: importing lands the new recipes in the library, and adding them to a cookbook is a separate round-trip.

The router uses `createWebHistory()` with named routes; Vue Router's `router.push` supports a `state` object for transient in-page state that does not appear in the URL.

## Goals / Non-Goals

**Goals:**
- Add an "Import Recipes" toolbar action on the cookbook page (`ProjectView`) that initiates the same import flow as the library version.
- After the user confirms import from that shortcut, collect the IDs of the newly-created recipes and navigate back to the cookbook automatically.
- Open the "Add Recipes" sidebar panel on return with those recipe IDs pre-checked so the user can confirm adding them with one action.
- The user always sees and can modify the pre-checked selection before recipes are added; no auto-add without explicit confirmation.

**Non-Goals:**
- Changing the existing library import entry point or its behavior in any way.
- Adding a new route for a cookbook-specific import page (reuse the existing `/library/import` route with caller context passed via route state).
- Bypassing the staged review step — the import review is identical regardless of entry point.
- Auto-adding the imported recipes to the cookbook without user confirmation.
- Multi-cookbook import (the shortcut is always scoped to the one cookbook the user is currently viewing).

## Decisions

### Decision 1: Split the caller context — `?returnToProject` query param for the navigable location, `history.state` for the one-shot payload

**Superseded** (see below) — originally chosen as: `router.push({ name: 'recipe-import', state: { returnTo: 'project', projectId: ..., autoSelectOnReturn: true } })`, i.e. everything via route state. Revised after initial ship: the "where do I go back to" half of this context is not actually one-shot/transient the way `autoSelectIds` is — it needs to survive a page refresh and be a real, bookmarkable URL, exactly like `RecipeEditor.vue`'s existing `?returnToProject`/`?returnToRecipe` return-context (`src/js/returnContext.js`). Splitting the two halves onto the mechanism that actually fits each one:

- **`?returnToProject=<id>` query param** (`computeImportReturnContext` in `src/js/returnContext.js`) carries the originating cookbook's identity on the way *into* `recipe-import`. `RecipeImport.vue` derives `returnContext` from `route.query` and uses it for both the "Back to Cookbook" link and the post-confirm redirect target. This survives a hard refresh and matches the recipe editor's established pattern instead of introducing a second, divergent mechanism for conceptually the same problem.
- **`state: { autoSelectIds: [...] }`** (route state) still carries the *result* of the import — the array of newly-created recipe IDs — on the way back to `project`. This payload genuinely can't be known until after import confirms, so it can't live in a URL constructed ahead of time, and it truly is one-shot (consumed and cleared on `ProjectView` mount).

**Rationale**: The round-trip is now: ProjectView → push to `recipe-import` with `?returnToProject=<id>` → user imports → `RecipeImport.confirmImport()` reads `returnContext` from `route.query`, collects new recipe IDs, and pushes back to `project` with `state.autoSelectIds`. Only the part of the payload that is genuinely one-shot uses `history.state`; the part that is a real caller/return location uses a query param, consistent with `RecipeEditor.vue`.

**Alternative considered**: A shared Pinia store "handoff" state. Rejected: it requires clearing on every mount/unmount, leaks across navigations if cleanup fails, and couples two otherwise-independent views via store shape.

**Alternative considered (original)**: Query params for everything, including `autoSelectIds`. Rejected: an array of IDs would be ugly in the URL, and that half of the payload is genuinely one-shot/derived-after-the-fact, so query params don't fit it the way they fit `returnToProject`.

### Decision 2: Reuse the existing `/library/import` route and `RecipeImport.vue` component

**Chosen**: Add an optional `returnTo` branch inside `RecipeImport.vue`'s `confirmImport()` function; all other import logic is unchanged.

**Rationale**: The import flow is identical. Creating a parallel route or component would duplicate 250+ lines for a one-line behavioral fork (where to navigate after confirm). The `state.returnTo` guard is only entered when the cookbook shortcut was used; the default path (navigate to library after confirm) is completely untouched.

### Decision 3: Pre-check via route state on ProjectView mount / route entry

**Chosen**: `ProjectView.vue` reads `history.state.autoSelectIds` (an array of recipe IDs) on `onMounted` and when the route is entered (using `onBeforeRouteEnter` / watching the route). It passes the IDs to `LibrarySidebarPanel` as a reactive `initialCheckedIds` prop; the panel opens and populates `libSelectedIds` from this set.

**Rationale**: `ProjectView` already controls both the sidebar open/close state and the `libSelectedIds` set. Reading route state there keeps the pre-selection logic co-located with all other "Add Recipes" logic. No new Pinia state needed.

**Key consideration**: `history.state.autoSelectIds` must be consumed and cleared after being read (or treated as one-shot), so a back-navigation from the cookbook doesn't re-open the picker with stale data.

### Decision 4: `recipesStore.createRecipe` return value provides the new IDs

The existing `createRecipe` store action (called in `confirmImport`) resolves with the created recipe object including its `id`. `RecipeImport.vue` already awaits each call in a loop. The only change is collecting these resolved IDs into an array when `state.returnTo === 'project'`.

## Risks / Trade-offs

- **`autoSelectIds` route state cleared on hard refresh**: `history.state` survives within a SPA session but is lost on a hard page reload. If the user reloads between import-confirm and arriving at the cookbook, the pre-selection is silently skipped — the recipes were still imported, they just won't be pre-checked. This is acceptable given the transient nature of that specific payload. (This risk no longer applies to the "which cookbook to return to" half of the context, now a `?returnToProject` query param — see revised Decision 1 — which does survive a hard refresh.)

- **`confirmImport` error path**: If some recipes fail to import, only the successfully-created IDs are included in `autoSelectIds`. The error message already lists failures; the user returns to the cookbook with partial pre-selection, which is correct behavior.

- **`libSelectedIds` currently a `Set` in ProjectView**: Initializing from an array of IDs is a one-liner (`new Set(ids)`). The sidebar panel already accepts this as a prop. No structural change to the picker needed beyond adding the initial-population logic on open.

- **"Add Recipes" sidebar open state**: `ProjectView` uses a reactive flag (`libSidebarOpen` or similar) to show/hide the sidebar. When returning with `autoSelectIds`, the view must set this flag to `true` *and* populate the selection. Order matters: populate first, then open, to avoid a flash of empty state.
