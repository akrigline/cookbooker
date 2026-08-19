## 1. Data model

- [x] 1.1 In `src/js/db.js`, add `favorite: false` to `addRecipe`'s default-merge object and to the `db.on('populate')` seed recipe.
- [x] 1.2 In `src/js/db.js`, add `favoriteIcon: DEFAULT_FAVORITE_ICON` and `favoriteTerminology: ''` to `createProject`'s default row, `db.on('populate')`'s seed project, and `importCookbook`'s `projectRow`.
- [x] 1.3 In `src/js/favorites.js` (new file), define `FAVORITE_ICONS` (`sock`/`star`/`heart` option list, matching `templates.js`'s `ACCENT_COLORS` shape), `DEFAULT_FAVORITE_ICON = 'star'`, `OUTSIDE_CONTEXT_ICON = 'heart'`, and `getFavoriteSettings(project)` returning `{ icon, prefix }` (heart/no-prefix when `project` is null/undefined; otherwise `project.favoriteIcon || DEFAULT_FAVORITE_ICON` and `(project.favoriteTerminology || '').trim()`).
- [x] 1.4 Unit test `getFavoriteSettings` in `src/js/favorites.test.js`: no project → heart/blank prefix; project with icon+terminology → both returned; project with blank/whitespace terminology → blank prefix; project with missing `favoriteIcon` → falls back to default icon.

## 2. Store actions

- [x] 2.1 In `src/stores/recipes.js`, add `toggleFavorite(id)`: `await db.updateRecipe(id, { favorite: !recipe.favorite })` then mirror via `Object.assign`, matching `editRecipe`'s shape.
- [x] 2.2 Unit test `toggleFavorite` in `src/stores/recipes.test.js`: flips `true`→`false` and `false`/`undefined`→`true`, persists via `db.updateRecipe`, and mirrors the in-memory `recipes` array.
- [x] 2.3 Confirm `editRecipe`/`editProject` need no changes (favorite fields pass through their existing generic `changes` merge) — no new store action needed for the editor-save or settings-modal paths.

## 3. FavoriteBadge and FavoriteToggle components

- [x] 3.1 Create `src/components/FavoriteBadge.vue`: takes `icon: 'sock' | 'star' | 'heart'` prop, renders the matching inline SVG (own `<path>` per icon), following `RecipeFitWarningBadge.vue`'s pattern (`currentColor`, `1em` sizing, sr-only text, `title` attribute).
- [x] 3.2 Create `src/components/FavoriteToggle.vue`: a `<button>` wrapping `FavoriteBadge`, with an `icon` prop defaulting to `'heart'` (used as-is by RecipeEditor/RecipeLibrary; overridden with the cookbook's icon by ChapterCard), `favorite: boolean` prop controls filled/outlined state, emits `toggle` on click.

## 4. Recipe editor toggle

- [x] 4.1 In `src/views/RecipeEditor.vue`, add a `favorite` ref initialized from the loaded recipe (default `false` for new recipes), include it in `previewRecipe`.
- [x] 4.2 Render `FavoriteToggle` next to the Save/Cancel controls (not near the title field), bound to the `favorite` ref.

## 5. Library and chapter row toggles

- [x] 5.1 In `src/views/RecipeLibrary.vue`, render `FavoriteToggle` in each recipe row next to the existing "Edit" action, wired to `recipesStore.toggleFavorite(recipe.id)`.
- [x] 5.2 In `src/components/ChapterCard.vue`, render `FavoriteToggle` in each recipe row next to the existing row action controls (after the fit-warning badge, before ≡/Edit), passing `:icon="getFavoriteSettings(project).icon"` (the cookbook's configured icon, per the `cookbook-management` delta spec's "Favorite Toggle on Chapter Recipe Rows" requirement — unlike 4.2/5.1, which omit the prop and get heart).
- [x] 5.3 Wire the ChapterCard toggle to `recipesStore.toggleFavorite(recipe.id)`.

## 6. Cookbook Favorites settings

- [x] 6.1 In `src/components/EditCookbookModal.vue`, add a "Favorites" section: a 3-way icon picker (sock/star/heart, styled like the existing accent-color swatch buttons) bound to `favoriteIcon`, and a text input for `favoriteTerminology` with placeholder text indicating blank means icon-only.
- [x] 6.2 In `src/views/ProjectView.vue`, pass `project?.favoriteIcon` / `project?.favoriteTerminology` into the modal as props and wire their `update-field` events through the existing `updateField`/`persist` helper.

## 7. Recipe title rendering (TOC and printed page)

- [x] 7.1 Update `src/components/RecipeTitle.vue` to accept `favorite: Boolean` and `favoriteSettings: { icon, prefix }` props; render the `FavoriteBadge` and the `"<prefix>: "` title prefix (when `prefix` is non-blank) when `favorite` is true; unchanged output when `favorite` is false.
- [x] 7.2 Update all 9 layout components (`RecipeLayoutDefault.vue` [both call sites], `RecipeLayoutTwoColumn.vue`, `RecipeLayoutHeroSplitBalanced.vue`, `RecipeLayoutHeroSplitAsymmetric.vue`, `RecipeLayoutAsymmetricSidebar.vue`, `RecipeLayoutColumnOptimized.vue`, `RecipeLayoutBalancedHeader.vue`, `RecipeLayoutDualColumnBottomSplit.vue`, `RecipeLayoutTextOnly.vue`) to pass `:favorite="recipe.favorite"` and `:favorite-settings="favoriteSettings"` to their `RecipeTitle` call(s).
- [x] 7.3 Update `src/components/RecipeSheet.vue` to compute `favoriteSettings` via `getFavoriteSettings(project)` (accepting an optional `project` prop, `null` when not in a cookbook context, e.g. the standalone editor preview) and pass it down to the active layout component alongside `recipe`.
- [x] 7.4 Update `src/components/TocRecipeRow.vue` to accept `favorite`/`favoriteSettings` props and render the badge + prefixed title the same way as `RecipeTitle.vue`.
- [x] 7.5 Update `src/components/TableOfContentsPage.vue`'s row loop to pass `:favorite="row.recipe?.favorite"` and a `favoriteSettings` prop (computed once from the project) into each `TocRecipeRow`.
- [x] 7.6 Update call sites that mount `RecipeSheet`/`TableOfContentsPage` for print/preview (`ProjectPrint.vue`, `RecipeEditor.vue`'s preview, `src/js/recipeFitMeasure.js`'s off-screen mount, `src/js/tocLayout.js`'s off-screen mount) to pass the real `project` (or `null` where no project exists) so measurement markup matches rendered markup, per the existing "measured and displayed markup must be identical" invariant.

## 8. Verification

- [x] 8.1 Run `npm test` (all unit tests, including the new `favorites.test.js` and `recipes.test.js` additions).
- [x] 8.2 Run `npm run build` to confirm the production build succeeds (tree-shaking is production-only, per the `@magrinj/parse-ingredients` sharp edge — no similar risk expected here, but build must stay green).
- [x] 8.3 Manually verify in the browser: toggle a favorite from the library (heart, row-end placement), toggle from a chapter row (cookbook's configured icon, row-end placement), configure a cookbook's icon/terminology in settings, and confirm the TOC and a printed recipe page both show the icon and, when configured, the "Terminology: Title" prefix.
