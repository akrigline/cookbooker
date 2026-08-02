import Dexie from 'dexie'
import { nextSequence } from './sequence'

export const MISC_CHAPTER_NAME = 'Miscellaneous'

export const db = new Dexie('cookbook_maker_db')

db.version(1).stores({
  recipes: '++id',
  projects: '++id',
  chapters: '++id, projectId',
  project_recipes: '++id, projectId, recipeId, chapterId',
})

db.on('populate', async () => {
  const projectId = await db.projects.add({
    title: 'My First Cookbook',
    subtitle: '',
    accentColor: '#d97742',
    coverTemplate: 'classic',
    pageNumbersEnabled: true,
  })
  const chapterId = await db.chapters.add({
    projectId,
    name: MISC_CHAPTER_NAME,
    sequence: 0,
    isDefault: true,
  })
  const recipeId = await db.recipes.add({
    title: 'Classic Pancake Recipe',
    instructions: '',
    ingredients: [],
    image: null,
    notes: '',
    layoutTemplate: 'hero-split-balanced',
    ingredientColumns: 1,
    ingredientQtyAlign: 'right',
    imageAspectRatio: 'auto',
  })
  await db.project_recipes.add({ projectId, chapterId, recipeId, sequence: 0 })
})

// ---------------------------------------------------------------------------
// Recipes
// ---------------------------------------------------------------------------
export const getAllRecipes = () => db.recipes.toArray()
export const getRecipe = (id) => db.recipes.get(id)
export const addRecipe = (recipe) => db.recipes.add(recipe)
export const updateRecipe = (id, changes) => db.recipes.update(id, changes)

export const deleteRecipe = (id) =>
  db.transaction('rw', db.recipes, db.project_recipes, async () => {
    await db.project_recipes.where('recipeId').equals(id).delete()
    await db.recipes.delete(id)
  })

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------
export const getAllProjects = () => db.projects.toArray()
export const getProject = (id) => db.projects.get(id)

export const createProject = (project) =>
  db.transaction('rw', db.projects, db.chapters, async () => {
    const projectId = await db.projects.add({
      title: '',
      subtitle: '',
      accentColor: '#d97742',
      coverTemplate: 'classic',
      pageNumbersEnabled: true,
      ...project,
    })
    const chapterId = await db.chapters.add({
      projectId,
      name: MISC_CHAPTER_NAME,
      sequence: 0,
      isDefault: true,
    })
    return { projectId, miscChapterId: chapterId }
  })

export const updateProject = (id, changes) => db.projects.update(id, changes)

export const deleteProject = (id) =>
  db.transaction('rw', db.projects, db.chapters, db.project_recipes, async () => {
    await db.chapters.where('projectId').equals(id).delete()
    await db.project_recipes.where('projectId').equals(id).delete()
    await db.projects.delete(id)
  })

// ---------------------------------------------------------------------------
// Chapters
// ---------------------------------------------------------------------------
export const getChaptersForProject = (projectId) =>
  db.chapters.where('projectId').equals(projectId).toArray()

export const getChapter = (id) => db.chapters.get(id)

// `isDefault` isn't an indexed field (and is stored as a real boolean), so a
// Dexie compound where({...}) shorthand on it silently matches nothing -
// filter in JS instead, using the indexed `projectId` lookup.
export const getMiscChapter = async (projectId) => {
  const chapters = await getChaptersForProject(projectId)
  return chapters.find((c) => c.isDefault)
}

export const addChapter = async (projectId, name) => {
  const existing = await getChaptersForProject(projectId)
  const sequence = nextSequence(existing)
  return db.chapters.add({ projectId, name, sequence, isDefault: false })
}

export const updateChapter = (id, changes) => db.chapters.update(id, changes)

export const deleteChapter = (id) =>
  db.transaction('rw', db.chapters, db.project_recipes, async () => {
    const chapter = await db.chapters.get(id)
    if (!chapter) return
    if (chapter.isDefault) {
      throw new Error('The Miscellaneous chapter cannot be deleted.')
    }

    const misc = await getMiscChapter(chapter.projectId)

    const orphaned = await db.project_recipes
      .where('chapterId')
      .equals(id)
      .toArray()

    if (misc && orphaned.length) {
      const existingMisc = await db.project_recipes
        .where('chapterId')
        .equals(misc.id)
        .toArray()
      let sequence = nextSequence(existingMisc)

      for (const pr of orphaned) {
        await db.project_recipes.update(pr.id, {
          chapterId: misc.id,
          sequence: sequence++,
        })
      }
    }

    await db.chapters.delete(id)
  })

// ---------------------------------------------------------------------------
// project_recipes (recipe <-> chapter associations)
// ---------------------------------------------------------------------------
export const getProjectRecipes = (projectId) =>
  db.project_recipes.where('projectId').equals(projectId).toArray()

export const addRecipeToProject = (projectId, recipeId, chapterId = null) =>
  db.transaction('rw', db.chapters, db.project_recipes, async () => {
    let targetChapterId = chapterId
    if (!targetChapterId) {
      const misc = await getMiscChapter(projectId)
      targetChapterId = misc?.id
    }
    if (!targetChapterId) {
      throw new Error(
        `Cannot add recipe to project ${projectId}: no chapter was given and the project has no Miscellaneous chapter.`,
      )
    }

    const siblings = await db.project_recipes
      .where('chapterId')
      .equals(targetChapterId)
      .toArray()
    const sequence = nextSequence(siblings)

    const id = await db.project_recipes.add({
      projectId,
      recipeId,
      chapterId: targetChapterId,
      sequence,
    })
    return { id, sequence, chapterId: targetChapterId }
  })

export const moveProjectRecipe = (id, changes) => db.project_recipes.update(id, changes)
export const removeProjectRecipe = (id) => db.project_recipes.delete(id)
