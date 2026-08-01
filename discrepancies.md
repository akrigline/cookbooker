# Design Discrepancies

## RecipeDetail.vue vs Recipe Detail.dc.html
In `Recipe Detail.dc.html`, the design shows an inline editor with a live preview side-by-side. However, the current Vue logic separates viewing (`RecipeDetail.vue`) from editing (`RecipeEditor.vue`). I preserved the viewing logic in `RecipeDetail.vue` and ignored the inline editing fields from the design, just updating the surrounding layout and action bar.

## RecipeImport.vue vs Import Recipes.dc.html
In `Import Recipes.dc.html`, the review stage shows inline editing inputs for each imported recipe (Title, Notes, Layout Template). However, the current Vue logic just uses the `RecipeSheet.vue` inside `PagePreview.vue` to show a static preview. I preserved this current behavior rather than building a complex inline editing form for the import review stage.
