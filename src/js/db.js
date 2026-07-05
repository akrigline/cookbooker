import Dexie from 'dexie'

export const db = new Dexie('cookbook_maker_db')

db.version(1).stores({
  recipes: '++id',
  projects: '++id',
  chapters: '++id, projectId',
  project_recipes: '++id, projectId, recipeId, chapterId',
})

db.on('populate', async () => {
  const projectId = await db.projects.add({ name: 'My First Cookbook' })
  const chapterId = await db.chapters.add({
    projectId,
    name: 'Miscellaneous',
    order: 0,
    isDefault: true,
  })
  const recipeId = await db.recipes.add({ title: 'Classic Pancake Recipe' })
  await db.project_recipes.add({ projectId, chapterId, recipeId, order: 0 })
})

// Recipes
export const getAllRecipes = () => db.recipes.toArray()
export const getRecipe = (id) => db.recipes.get(id)
export const addRecipe = (recipe) => db.recipes.add(recipe)
export const updateRecipe = (id, changes) => db.recipes.update(id, changes)

export const deleteRecipe = (id) =>
  db.transaction('rw', db.recipes, db.project_recipes, async () => {
    await db.project_recipes.where('recipeId').equals(id).delete()
    await db.recipes.delete(id)
  })

// Projects
export const getAllProjects = () => db.projects.toArray()
export const getProject = (id) => db.projects.get(id)
export const addProject = (project) => db.projects.add(project)
export const updateProject = (id, changes) => db.projects.update(id, changes)

export const deleteProject = (id) =>
  db.transaction('rw', db.projects, db.chapters, db.project_recipes, async () => {
    await db.chapters.where('projectId').equals(id).delete()
    await db.project_recipes.where('projectId').equals(id).delete()
    await db.projects.delete(id)
  })

// Chapters
export const getChaptersForProject = (projectId) =>
  db.chapters.where('projectId').equals(projectId).toArray()
export const addChapter = (chapter) => db.chapters.add(chapter)
export const updateChapter = (id, changes) => db.chapters.update(id, changes)

// project_recipes (recipe <-> chapter associations)
export const getProjectRecipes = (projectId) =>
  db.project_recipes.where('projectId').equals(projectId).toArray()
export const addProjectRecipe = (association) => db.project_recipes.add(association)
export const updateProjectRecipe = (id, changes) => db.project_recipes.update(id, changes)
export const removeProjectRecipe = (id) => db.project_recipes.delete(id)
