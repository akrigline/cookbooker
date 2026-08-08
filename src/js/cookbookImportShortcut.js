// Pure helper for the cookbook-page "Import Recipes" shortcut
// (openspec: cookbook-import-shortcut). ProjectView.vue calls this when
// consuming `history.state.autoSelectIds` left behind by RecipeImport.vue's
// post-confirm redirect, to guard against pre-checking recipes that no
// longer exist (e.g. deleted between import and this page mounting).
export function intersectExistingRecipeIds(ids, existingRecipes) {
  const existingIds = new Set(existingRecipes.map((r) => r.id))
  return ids.filter((id) => existingIds.has(id))
}
