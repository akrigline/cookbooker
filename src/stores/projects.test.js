import { describe, expect, it, beforeEach } from 'vitest'
import 'fake-indexeddb/auto'
import { createPinia, setActivePinia } from 'pinia'
import { useProjectsStore } from './projects.js'

// Regression coverage for a prior bug: store actions mutated in-memory state
// with values that diverged from what db.js actually persisted (hardcoded
// `sequence: 0` on add, no resequencing on chapter delete). Each test compares
// the store's in-memory state against a fresh `load()` from the same
// fake-indexeddb database to confirm they never drift apart.

describe('projects store / db sequence sync', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

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
