import { describe, expect, it } from 'vitest'
import 'fake-indexeddb/auto'
import {
  MISC_CHAPTER_NAME,
  createProject,
  getMiscChapter,
  addRecipeToProject,
  deleteChapter,
  addChapter,
  getProjectRecipes,
  db,
} from './db.js'

// Each test creates its own project, so records stay scoped by projectId
// even though they share one fake-indexeddb database across the file.
//
// Regression coverage for a prior bug: `where({ projectId, isDefault: 1 })`
// silently matched nothing because `isDefault` isn't an indexed field and is
// stored as a real boolean, not the number 1.

describe('db.js chapter/recipe association', () => {
  it('finds the Miscellaneous chapter after project creation', async () => {
    const { projectId, miscChapterId } = await createProject({ title: 'Test' })
    const misc = await getMiscChapter(projectId)
    expect(misc).toBeDefined()
    expect(misc.id).toBe(miscChapterId)
    expect(misc.name).toBe(MISC_CHAPTER_NAME)
  })

  it('adding a recipe to a project without a chapter assigns it to Miscellaneous', async () => {
    const { projectId, miscChapterId } = await createProject({ title: 'Test' })
    const { id: prId, sequence } = await addRecipeToProject(projectId, 42)
    const rows = await getProjectRecipes(projectId)
    expect(rows).toHaveLength(1)
    expect(rows[0].id).toBe(prId)
    expect(rows[0].chapterId).toBe(miscChapterId)
    expect(sequence).toBe(0)
  })

  it('assigns an incrementing sequence for each recipe added to the same chapter', async () => {
    const { projectId } = await createProject({ title: 'Test' })
    const first = await addRecipeToProject(projectId, 1)
    const second = await addRecipeToProject(projectId, 2)
    expect(first.sequence).toBe(0)
    expect(second.sequence).toBe(1)
  })

  it('throws a clear error instead of an opaque Dexie crash when the project has no chapter', async () => {
    const projectId = await db.projects.add({ title: 'Chapterless' })
    await expect(addRecipeToProject(projectId, 1)).rejects.toThrow(/no chapter/i)
  })

  it('deleting a custom chapter reassigns its recipes to Miscellaneous', async () => {
    const { projectId, miscChapterId } = await createProject({ title: 'Test' })
    const breakfastId = await addChapter(projectId, 'Breakfast')
    await addRecipeToProject(projectId, 7, breakfastId)

    await deleteChapter(breakfastId)

    const rows = await getProjectRecipes(projectId)
    expect(rows).toHaveLength(1)
    expect(rows[0].chapterId).toBe(miscChapterId)
  })

  it('refuses to delete the Miscellaneous chapter', async () => {
    const { miscChapterId } = await createProject({ title: 'Test' })
    await expect(deleteChapter(miscChapterId)).rejects.toThrow()
  })
})
