import { describe, expect, it, beforeEach } from 'vitest'
import 'fake-indexeddb/auto'
import { createPinia, setActivePinia } from 'pinia'
import { useProjectsStore } from './projects.js'
import {
  db as rawDb,
  getChaptersForProject,
  getProjectRecipes,
  RecordNotFoundError,
} from '../js/db.js'

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

  it('matches the DB ordering when a deleted chapter\'s recipes were not added in id order', async () => {
    // db.js reassigns orphaned rows in primary-key order. The store used to
    // recompute the same assignment while walking its own array in insertion
    // order, so seeding rows out of id order made the two disagree.
    const store = useProjectsStore()
    await store.load()
    const projectId = await store.createProject({ title: 'Out of order' })
    const chapterId = await store.createChapter(projectId, 'Breakfast')

    const older = await rawDb.project_recipes.add({
      projectId,
      recipeId: 300,
      chapterId,
      sequence: 0,
    })
    const newer = await rawDb.project_recipes.add({
      projectId,
      recipeId: 301,
      chapterId,
      sequence: 1,
    })
    // Put the higher-id row first in the store's array, opposite to key order.
    await store.load()
    store.projectRecipes.sort((a, b) => b.id - a.id)

    await store.removeChapter(chapterId)

    const inMemory = store.projectRecipes
      .filter((pr) => pr.projectId === projectId)
      .map((pr) => ({ id: pr.id, chapterId: pr.chapterId, sequence: pr.sequence }))
      .sort((a, b) => a.id - b.id)

    setActivePinia(createPinia())
    const fresh = useProjectsStore()
    await fresh.load()
    const fromDb = fresh.projectRecipes
      .filter((pr) => pr.projectId === projectId)
      .map((pr) => ({ id: pr.id, chapterId: pr.chapterId, sequence: pr.sequence }))
      .sort((a, b) => a.id - b.id)

    expect(inMemory).toEqual(fromDb)
    expect(inMemory.find((pr) => pr.id === older).sequence).toBe(0)
    expect(inMemory.find((pr) => pr.id === newer).sequence).toBe(1)
  })

  it('keeps createChapter sequences equal to what the DB assigned', async () => {
    const store = useProjectsStore()
    await store.load()
    const projectId = await store.createProject({ title: 'Chapter sequences' })

    const first = await store.createChapter(projectId, 'One')
    const second = await store.createChapter(projectId, 'Two')

    const inMemory = store.chaptersForProject(projectId).map((c) => ({
      id: c.id,
      sequence: c.sequence,
    }))
    const fromDb = (await getChaptersForProject(projectId))
      .map((c) => ({ id: c.id, sequence: c.sequence }))
      .sort((a, b) => a.sequence - b.sequence)

    expect(inMemory).toEqual(fromDb)
    expect(inMemory.find((c) => c.id === first).sequence).toBe(1)
    expect(inMemory.find((c) => c.id === second).sequence).toBe(2)
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

  it('adding a recipe already in the cookbook reconciles instead of duplicating', async () => {
    const store = useProjectsStore()
    await store.load()
    const id = await store.createProject({ title: 'Duplicate Guard' })

    const firstPrId = await store.addRecipeToProject(id, 900)
    // Simulate a stale UI list offering the recipe a second time.
    const secondPrId = await store.addRecipeToProject(id, 900)

    expect(secondPrId).toBe(firstPrId)
    expect(store.projectRecipesForProject(id)).toHaveLength(1)
    expect(await getProjectRecipes(id)).toHaveLength(1)
  })

  it('editChapter surfaces a RecordNotFoundError rather than reporting a phantom save', async () => {
    const store = useProjectsStore()
    await store.load()

    await expect(store.editChapter(999999, { name: 'ghost' })).rejects.toBeInstanceOf(
      RecordNotFoundError,
    )
  })

  it('removeChapter surfaces a RecordNotFoundError for a chapter another tab deleted', async () => {
    const store = useProjectsStore()
    await store.load()

    await expect(store.removeChapter(999999)).rejects.toBeInstanceOf(RecordNotFoundError)
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

// The batch actions replace `Promise.all` fan-outs in ProjectView. Each is one
// db.js transaction, so the invariant to hold is the same as everywhere else:
// the store applies what db.js persisted, and a rejected batch mutates neither.
describe('projects store batch actions', () => {
  /** In-memory placements for a project, in a shape comparable to a fresh load. */
  function snapshot(store, projectId) {
    return store
      .projectRecipesForProject(projectId)
      .map((pr) => ({ id: pr.id, chapterId: pr.chapterId, sequence: pr.sequence }))
      .sort((a, b) => a.id - b.id)
  }

  async function fromDb(projectId) {
    setActivePinia(createPinia())
    const fresh = useProjectsStore()
    await fresh.load()
    return snapshot(fresh, projectId)
  }

  it('resequenceProjectRecipes applies the persisted order in memory and in the DB', async () => {
    const store = useProjectsStore()
    await store.load()
    const projectId = await store.createProject({ title: 'Resequence' })
    const a = await store.addRecipeToProject(projectId, 1)
    const b = await store.addRecipeToProject(projectId, 2)
    const c = await store.addRecipeToProject(projectId, 3)

    await store.resequenceProjectRecipes([c, b, a])

    const seq = (id) => store.projectRecipes.find((pr) => pr.id === id).sequence
    expect([seq(c), seq(b), seq(a)]).toEqual([0, 1, 2])
    expect(snapshot(store, projectId)).toEqual(await fromDb(projectId))
  })

  it('moveProjectRecipesToChapter applies the sequences db.js assigned', async () => {
    const store = useProjectsStore()
    await store.load()
    const projectId = await store.createProject({ title: 'Batch Move' })
    const miscId = store.chaptersForProject(projectId).find((c) => c.isDefault).id
    await store.addRecipeToProject(projectId, 1, miscId)
    const chapterId = await store.createChapter(projectId, 'Breakfast')
    const a = await store.addRecipeToProject(projectId, 2, chapterId)
    const b = await store.addRecipeToProject(projectId, 3, chapterId)

    await store.moveProjectRecipesToChapter([a, b], miscId)

    expect(store.projectRecipesForChapter(miscId).map((pr) => pr.sequence)).toEqual([0, 1, 2])
    expect(store.projectRecipesForChapter(chapterId)).toHaveLength(0)
    expect(snapshot(store, projectId)).toEqual(await fromDb(projectId))
  })

  it('moveProjectRecipesToChapter leaves the store untouched when the batch rejects', async () => {
    const store = useProjectsStore()
    await store.load()
    const projectId = await store.createProject({ title: 'Batch Move Fail' })
    const miscId = store.chaptersForProject(projectId).find((c) => c.isDefault).id
    const chapterId = await store.createChapter(projectId, 'Breakfast')
    const prId = await store.addRecipeToProject(projectId, 1, chapterId)
    const before = snapshot(store, projectId)

    await expect(
      store.moveProjectRecipesToChapter([prId, 999999], miscId),
    ).rejects.toBeInstanceOf(RecordNotFoundError)

    expect(snapshot(store, projectId)).toEqual(before)
    expect(snapshot(store, projectId)).toEqual(await fromDb(projectId))
  })

  it('addRecipesToProject pushes the added rows and reconciles the duplicates', async () => {
    const store = useProjectsStore()
    await store.load()
    const projectId = await store.createProject({ title: 'Batch Add' })
    const chapterId = await store.createChapter(projectId, 'Breakfast')
    await store.addRecipeToProject(projectId, 1, chapterId)

    const { added, duplicates } = await store.addRecipesToProject(
      projectId,
      [1, 2, 3],
      chapterId,
    )

    expect(added).toHaveLength(2)
    expect(duplicates.map((d) => d.recipeId)).toEqual([1])
    expect(store.projectRecipesForChapter(chapterId).map((pr) => pr.recipeId)).toEqual([1, 2, 3])
    expect(snapshot(store, projectId)).toEqual(await fromDb(projectId))
  })

  it('removeProjectRecipes drops exactly the given placements', async () => {
    const store = useProjectsStore()
    await store.load()
    const projectId = await store.createProject({ title: 'Batch Remove' })
    const a = await store.addRecipeToProject(projectId, 1)
    const b = await store.addRecipeToProject(projectId, 2)
    const c = await store.addRecipeToProject(projectId, 3)

    await store.removeProjectRecipes([a, c])

    expect(store.projectRecipesForProject(projectId).map((pr) => pr.id)).toEqual([b])
    expect(snapshot(store, projectId)).toEqual(await fromDb(projectId))
  })
})
