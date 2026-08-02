import { describe, expect, it, beforeEach } from 'vitest'
import 'fake-indexeddb/auto'
import { createPinia, setActivePinia } from 'pinia'
import { useProjectsStore } from './projects.js'
import { db as rawDb, getChaptersForProject, getProjectRecipes } from '../js/db.js'

beforeEach(() => {
  setActivePinia(createPinia())
})

function makeRecipeRow(overrides = {}) {
  return {
    title: 'Seed Recipe',
    instructions: '',
    ingredients: [],
    image: null,
    notes: '',
    layoutTemplate: 'hero-split-balanced',
    ...overrides,
  }
}

// Regression coverage for a prior bug: store actions mutated in-memory state
// with values that diverged from what db.js actually persisted (hardcoded
// `sequence: 0` on add, no resequencing on chapter delete). Each test compares
// the store's in-memory state against a fresh `load()` from the same
// fake-indexeddb database to confirm they never drift apart.
describe('projects store / db sequence sync', () => {
  it('assigns the real DB sequence when adding recipes to the same chapter', async () => {
    const store = useProjectsStore()
    await store.load()
    const projectId = await store.createProject({ title: 'Test' })

    await store.addRecipeToProject(projectId, 1)
    await store.addRecipeToProject(projectId, 2)

    const inMemory = store.projectRecipesForProject(projectId).map((pr) => pr.sequence)

    // simulate a fresh reload from IndexedDB: a brand new Pinia instance
    // yields a genuinely separate store, not the same singleton
    setActivePinia(createPinia())
    const fresh = useProjectsStore()
    await fresh.load()
    const fromDb = fresh.projectRecipesForProject(projectId).map((pr) => pr.sequence)

    expect(inMemory).toEqual([0, 1])
    expect(inMemory).toEqual(fromDb)
  })

  it('resequences recipes moved to Miscellaneous when their chapter is deleted', async () => {
    const store = useProjectsStore()
    await store.load()
    const projectId = await store.createProject({ title: 'Test' })
    const miscChapterId = store.chaptersForProject(projectId).find((c) => c.isDefault).id
    // pre-existing recipe already in Miscellaneous
    await store.addRecipeToProject(projectId, 100, miscChapterId)

    const breakfastId = await store.createChapter(projectId, 'Breakfast')
    await store.addRecipeToProject(projectId, 200, breakfastId)
    await store.addRecipeToProject(projectId, 201, breakfastId)

    await store.removeChapter(breakfastId)

    const inMemory = store
      .projectRecipesForChapter(miscChapterId)
      .map((pr) => ({ recipeId: pr.recipeId, sequence: pr.sequence }))

    const fresh = useProjectsStore()
    await fresh.load()
    const fromDb = fresh
      .projectRecipesForChapter(miscChapterId)
      .map((pr) => ({ recipeId: pr.recipeId, sequence: pr.sequence }))

    expect(inMemory).toEqual(fromDb)
    expect(inMemory.map((pr) => pr.sequence).sort()).toEqual([0, 1, 2])
  })
})

// Covers createProject, load, reorderChapter, and reorderProjectRecipe.
// addRecipeToProject/removeChapter are covered above; fixtures here seed
// project_recipes rows directly via the raw Dexie table instead of going
// through those store actions, to stay independent of them.
describe('projects store', () => {
  it('createProject persists a project and its Miscellaneous chapter, in memory and in the DB', async () => {
    const store = useProjectsStore()

    const id = await store.createProject({ title: 'My Cookbook' })

    const project = store.projects.find((p) => p.id === id)
    expect(project).toMatchObject({ title: 'My Cookbook' })

    const misc = store.chapters.find((c) => c.projectId === id && c.isDefault)
    expect(misc).toBeDefined()
    expect(misc.name).toBe('Miscellaneous')
    expect(misc.sequence).toBe(0)

    const dbChapters = await getChaptersForProject(id)
    expect(dbChapters).toHaveLength(1)
    expect(dbChapters[0]).toMatchObject({ id: misc.id, isDefault: true })
  })

  it('load populates projects, chapters, and project_recipes from the DB', async () => {
    const setupStore = useProjectsStore()
    const id = await setupStore.createProject({ title: 'Loaded Cookbook' })
    const misc = setupStore.chapters.find((c) => c.projectId === id && c.isDefault)

    const recipeId = await rawDb.recipes.add(makeRecipeRow())
    await rawDb.project_recipes.add({ projectId: id, recipeId, chapterId: misc.id, sequence: 0 })

    setActivePinia(createPinia())
    const store = useProjectsStore()
    expect(store.loaded).toBe(false)

    await store.load()

    expect(store.loaded).toBe(true)
    expect(store.projects.find((p) => p.id === id)).toBeDefined()
    expect(store.chapters.find((c) => c.id === misc.id)).toBeDefined()
    expect(store.projectRecipes.find((pr) => pr.projectId === id)).toMatchObject({
      recipeId,
      chapterId: misc.id,
      sequence: 0,
    })
  })

  it('reorderChapter swaps sequence with the adjacent custom chapter', async () => {
    const store = useProjectsStore()
    const id = await store.createProject({ title: 'Reorder Test' })
    const chapterAId = await store.createChapter(id, 'Breakfast')
    const chapterBId = await store.createChapter(id, 'Dinner')
    const chapterA = () => store.chapters.find((c) => c.id === chapterAId)
    const chapterB = () => store.chapters.find((c) => c.id === chapterBId)
    // The Miscellaneous chapter (sequence 0) counts toward nextSequence, so
    // the first two custom chapters land on 1 and 2, not 0 and 1.
    expect(chapterA().sequence).toBe(1)
    expect(chapterB().sequence).toBe(2)

    await store.reorderChapter(chapterAId, 1)

    expect(chapterA().sequence).toBe(2)
    expect(chapterB().sequence).toBe(1)

    const dbChapters = await getChaptersForProject(id)
    expect(dbChapters.find((c) => c.id === chapterAId).sequence).toBe(2)
    expect(dbChapters.find((c) => c.id === chapterBId).sequence).toBe(1)
  })

  it('reorderChapter is a no-op for the default Miscellaneous chapter', async () => {
    const store = useProjectsStore()
    const id = await store.createProject({ title: 'No-op Test' })
    const misc = store.chapters.find((c) => c.projectId === id && c.isDefault)

    await store.reorderChapter(misc.id, 1)

    expect(store.chapters.find((c) => c.id === misc.id).sequence).toBe(0)
  })

  it('reorderChapter is a no-op when moving past the first or last position', async () => {
    const store = useProjectsStore()
    const id = await store.createProject({ title: 'Boundary Test' })
    const onlyChapterId = await store.createChapter(id, 'Only Chapter')
    const initialSequence = store.chapters.find((c) => c.id === onlyChapterId).sequence

    await store.reorderChapter(onlyChapterId, -1)
    expect(store.chapters.find((c) => c.id === onlyChapterId).sequence).toBe(initialSequence)

    await store.reorderChapter(onlyChapterId, 1)
    expect(store.chapters.find((c) => c.id === onlyChapterId).sequence).toBe(initialSequence)
  })

  it('reorderProjectRecipe swaps sequence with the adjacent recipe in the same chapter', async () => {
    const store = useProjectsStore()
    const id = await store.createProject({ title: 'Recipe Reorder Test' })
    const misc = store.chapters.find((c) => c.projectId === id && c.isDefault)
    const recipeAId = await rawDb.recipes.add(makeRecipeRow({ title: 'A' }))
    const recipeBId = await rawDb.recipes.add(makeRecipeRow({ title: 'B' }))
    const prAId = await rawDb.project_recipes.add({
      projectId: id,
      recipeId: recipeAId,
      chapterId: misc.id,
      sequence: 0,
    })
    const prBId = await rawDb.project_recipes.add({
      projectId: id,
      recipeId: recipeBId,
      chapterId: misc.id,
      sequence: 1,
    })
    await store.load()

    await store.reorderProjectRecipe(prAId, 1)

    expect(store.projectRecipes.find((pr) => pr.id === prAId).sequence).toBe(1)
    expect(store.projectRecipes.find((pr) => pr.id === prBId).sequence).toBe(0)

    const dbRows = await getProjectRecipes(id)
    expect(dbRows.find((pr) => pr.id === prAId).sequence).toBe(1)
    expect(dbRows.find((pr) => pr.id === prBId).sequence).toBe(0)
  })

  it('reorderProjectRecipe is a no-op at the chapter boundary', async () => {
    const store = useProjectsStore()
    const id = await store.createProject({ title: 'Recipe Boundary Test' })
    const misc = store.chapters.find((c) => c.projectId === id && c.isDefault)
    const recipeId = await rawDb.recipes.add(makeRecipeRow({ title: 'Solo' }))
    const prId = await rawDb.project_recipes.add({
      projectId: id,
      recipeId,
      chapterId: misc.id,
      sequence: 0,
    })
    await store.load()

    await store.reorderProjectRecipe(prId, -1)

    expect(store.projectRecipes.find((pr) => pr.id === prId).sequence).toBe(0)
  })
})
