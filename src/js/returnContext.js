// Computes the recipe editor's cookbook return-context from route query
// params (see openspec/changes/cookbook-aware-recipe-editor). Both
// `returnToProject` and `returnToRecipe` must be present; either one missing
// means "entered from the library," which is the existing/default behavior.
export function computeReturnContext(query) {
  const { returnToProject, returnToRecipe } = query ?? {}
  if (returnToProject && returnToRecipe) {
    return { projectId: returnToProject, recipeId: returnToRecipe }
  }
  return null
}

export function returnContextBackTo(returnContext) {
  return returnContext
    ? `/projects/${returnContext.projectId}?reopenRecipe=${returnContext.recipeId}`
    : '/library'
}

// Same idea for the cookbook page's "Import Recipes" shortcut (see
// openspec/changes/archive/.../cookbook-import-shortcut): a `?returnToProject`
// query param, not history.state, so the return path survives a page refresh
// and the "Back to Cookbook" link is a real, bookmarkable URL.
export function computeImportReturnContext(query) {
  const { returnToProject } = query ?? {}
  return returnToProject ? { projectId: returnToProject } : null
}
