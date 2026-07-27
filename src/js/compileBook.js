/**
 * Builds the ordered chapter/recipe compilation plan for a project's
 * printable book, per book-organization spec: custom chapters in their
 * defined sequence, followed by the Miscellaneous chapter last (and only
 * if it actually contains recipes).
 */
export function buildChapterPlan({ chapters, projectRecipes, recipesById, projectId }) {
  const projectChapters = chapters.filter((c) => c.projectId === projectId)
  const misc = projectChapters.find((c) => c.isDefault)
  const custom = [...projectChapters.filter((c) => !c.isDefault)].sort(
    (a, b) => a.sequence - b.sequence,
  )

  const recipesForChapter = (chapterId) =>
    [...projectRecipes]
      .filter((pr) => pr.chapterId === chapterId)
      .sort((a, b) => a.sequence - b.sequence)
      .map((pr) => recipesById.get(pr.recipeId))
      .filter(Boolean)

  const plan = custom.map((chapter) => ({ chapter, recipes: recipesForChapter(chapter.id) }))

  if (misc) {
    const miscRecipes = recipesForChapter(misc.id)
    if (miscRecipes.length) plan.push({ chapter: misc, recipes: miscRecipes })
  }

  return plan
}
