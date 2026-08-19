## Context

Recipes live in a single global `recipes` Dexie table and are associated with zero or more cookbook `projects` via `project_recipes`. Cookbook-level display config (accent color, cover template, page-number/double-sided toggles) already lives on the `projects` row and is edited through `EditCookbookModal.vue`, wired up by `ProjectView.vue`'s `updateField`/`persist` helpers. Recipe titles are rendered from a single per-recipe-layout `RecipeTitle.vue` component (used by all 9 layout components) and from `TocRecipeRow.vue` (used by `TableOfContentsPage.vue`). No icon font/library exists in the app; icons are hand-authored inline SVG components following `RecipeFitWarningBadge.vue`'s pattern (`currentColor` stroke/fill, `1em` sizing, sr-only text, wrapped in a `title`-attributed `<span>`).

Per CLAUDE.md's invariant, `db.js` write functions own field defaults and the Pinia stores mirror exactly what was persisted rather than recomputing values.

## Goals / Non-Goals

**Goals:**
- A recipe can be marked as a favorite once, globally, independent of which cookbook(s) it appears in.
- Each cookbook independently chooses how favorites are displayed: an icon (sock/star/heart) and an optional title-prefix terminology string.
- The favorite badge and title prefix appear in the Table of Contents and on the printed/previewed recipe page, using the active cookbook's configuration.
- Toggling favorite status is possible from the recipe editor, the Global Recipe Library, and a cookbook's chapter view.
- Outside any cookbook context (recipe editor, Global Recipe Library), the toggle/badge always uses a heart — there is no cookbook to source icon/terminology config from.

**Non-Goals:**
- No per-cookbook "favorites enabled/disabled" flag — a blank terminology already yields icon-only display, and there's no requirement to hide the badge entirely.
- No multiple/tagged favorite categories — a single boolean flag.
- No icon upload/custom icon support — a fixed 3-icon set (sock, star, heart).

## Decisions

**Recipe field: `favorite: boolean`, default `false`.** Follows the existing pattern of simple recipe flags. No Dexie schema/version bump needed — `favorite` isn't indexed, and `addRecipe`'s default-merge (`{ ...defaults, ...recipe }`) plus `undefined` reading as falsy means existing rows behave correctly with zero migration.

**Project fields: `favoriteIcon: 'sock' | 'star' | 'heart'` (default `'star'`) and `favoriteTerminology: string` (default `''`).** Set via `createProject`'s default-merge, same pattern as `accentColor`/`coverTemplate`. A blank/whitespace-only `favoriteTerminology` means "icon only, no title prefix" — this is the single source of truth for whether a prefix renders, avoiding a redundant boolean that could drift out of sync with the text field (per the user's explicit simplification request during brainstorming).

**A `getFavoriteSettings(project)` helper (new `src/js/favorites.js`) is the single place that resolves display settings, including the outside-cookbook-context default.** Returns `{ icon: 'heart', prefix: '' }` when called with no project (or `null`), and `{ icon: project.favoriteIcon || 'star', prefix: (project.favoriteTerminology || '').trim() }` when given a project. Every render site (badge components, `RecipeTitle.vue`, `TocRecipeRow.vue` call sites) calls this rather than reading `project.favoriteIcon`/`favoriteTerminology` directly, so the "heart outside context, cookbook's choice inside context" rule lives in one tested function instead of being re-implemented at each call site. Also exports `FAVORITE_ICONS` (the 3-icon option list, alongside `templates.js`'s existing `ACCENT_COLORS`/`COVER_TEMPLATES` pattern) for the settings picker.

**Single `FavoriteBadge.vue` component takes an `icon` prop (`'sock' | 'star' | 'heart'`) and renders the right inline SVG**, rather than three separate icon components — mirrors `RecipeFitWarningBadge.vue`'s self-contained pattern (own `<svg>`, `currentColor`, `1em`, sr-only text) but parameterized by icon choice since the same badge appears with different icons depending on context.

**Toggle vs. badge are separate components.** `FavoriteBadge.vue` is read-only display (TOC, printed page). A new `FavoriteToggle.vue` wraps it in a `<button>` for the three interactive contexts (RecipeEditor, RecipeLibrary row, ChapterCard row) — clicking flips `recipe.favorite`. `FavoriteToggle.vue` takes an `icon` prop (default `'heart'`) rather than hardcoding heart, because the icon rule is scoped by cookbook context, not by interactive-vs-readonly: RecipeEditor and RecipeLibrary are outside any cookbook, so they omit the prop and get heart via `getFavoriteSettings(null)`; ChapterCard is inside a cookbook, so it passes `getFavoriteSettings(project).icon`, matching the badge shown elsewhere in that same cookbook. `favorite: boolean` controls filled/outlined state.

**`RecipeTitle.vue` takes the whole `favoriteSettings` object (`{ icon, prefix }`) plus `favorite: boolean`, not raw project fields**, so the 9 layout call sites just pass through `recipe.favorite` and a `favoriteSettings` computed once per render (from `getFavoriteSettings(project)`) rather than each layout re-deriving it. Renders `{{ prefix ? prefix + ': ' + title : title }}` and the badge together when `favorite` is true; unchanged when false.

**`TocRecipeRow.vue` gets the same two props**, threaded from `TableOfContentsPage.vue`'s existing per-row loop (which already has both `row.recipe` and can receive the project's `favoriteSettings` as a single prop from its own parent, computed once).

**Store actions: reuse `editRecipe`/`editProject` for the settings-panel/editor-save paths; add a dedicated `toggleFavorite(id)` action to `recipes.js`** for the two quick-toggle contexts (Library row, ChapterCard row) that shouldn't require opening the full editor. Shape matches `editRecipe`: `db.updateRecipe(id, { favorite: !current })` then `Object.assign` mirror — no derived/server-computed value involved, so no special return-value threading is needed per CLAUDE.md's invariant.

## Risks / Trade-offs

- **Nine layout components each need a one-line prop change** (`RecipeTitle.vue` call sites) → mitigated by keeping the change mechanical and identical across all nine; no per-layout logic branches.
- **A recipe's favorite badge in the printed page/TOC depends on which cookbook is rendering it**, so the same recipe can show as a sock in one printed cookbook and a star in another — this is the intended design (per-cookbook treatment), not a bug, but worth calling out since it could surprise a user comparing two printed books side by side.
- **Blank terminology as the "no prefix" signal** means a user who types only whitespace gets no prefix (trimmed) — acceptable, matches the "blank means icon-only" model with no separate validation needed.

## Open Questions

None outstanding — all resolved during brainstorming (icon set: sock/star/heart; settings live in `EditCookbookModal.vue`; toggle controls sit with row/editor action buttons, not before the title; outside-cookbook-context is always heart; terminology text presence, not a separate boolean, decides whether the prefix renders).
