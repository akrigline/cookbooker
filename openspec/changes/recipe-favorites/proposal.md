## Why

Users want to flag certain recipes as favorites and have that status stand out when a cookbook is assembled — for example, marking the proven-best recipes in a treasured cookbook as "Sacred" with a distinctive icon. Today there is no way to mark a recipe as special or to have that status rendered anywhere in the app or the printed output.

## What Changes

- Add a global `favorite` boolean to the recipe schema (marking a recipe as a favorite is not tied to any one cookbook).
- Add per-cookbook favorites display configuration: an icon choice (sock, star, or heart) and an optional terminology string used as a title prefix (e.g. "Sacred: Grandma's Pie Crust"); a blank terminology means icon-only, no prefix.
- Add a favorite-toggle control to the recipe editor and to recipe rows in the Global Recipe Library — both contexts are outside any specific cookbook, so the toggle there always renders as a heart, positioned with the row/editor's existing action controls (not before the title).
- Add a favorite-toggle control to recipe rows within a cookbook's chapter view, using that cookbook's configured icon.
- Render a read-only favorite badge (using the active cookbook's configured icon) next to the recipe title in the Table of Contents and on the printed/previewed recipe page, and apply the configured title prefix there when terminology is set.

## Capabilities

### New Capabilities
- `recipe-favorites`: Defines the favorite flag on recipes, per-cookbook favorites display configuration (icon + optional title-prefix terminology), and the icon-only-outside-cookbook-context / cookbook-configured-icon-inside-context display rule.

### Modified Capabilities
- `recipe-editor`: The Structured Recipe Schema requirement gains a `favorite` boolean field, and the editor exposes a toggle control for it.
- `cookbook-management`: Cookbook project configuration gains a Favorites section (icon choice, optional title-prefix terminology).
- `recipe-library`: Recipe rows gain a favorite-toggle control (heart icon, since the library is outside any cookbook context).
- `print-and-export`: Table of Contents rows and printed/previewed recipe pages render the favorite badge and, when configured, the title prefix.

## Impact

- `src/js/db.js`: new `recipe.favorite` field default, new `project.favoriteIcon` / `project.favoriteTerminology` field defaults.
- `src/js/templates.js` (or a new `src/js/favorites.js`): favorite icon options and defaults.
- `src/stores/recipes.js`, `src/stores/projects.js`: toggle/update actions for the new fields.
- `src/views/RecipeEditor.vue`, `src/views/RecipeLibrary.vue`, `src/components/ChapterCard.vue`: toggle controls.
- `src/components/EditCookbookModal.vue`: new Favorites settings section.
- `src/components/RecipeTitle.vue`, the 9 recipe layout components, `src/components/TocRecipeRow.vue`, `src/components/TableOfContentsPage.vue`: badge/prefix rendering.
- New `src/components/FavoriteBadge.vue` (inline SVG icon component, following `RecipeFitWarningBadge.vue`'s pattern).
