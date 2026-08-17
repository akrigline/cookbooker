import { describe, expect, it } from 'vitest'
import 'fake-indexeddb/auto'
import {
  importCookbook,
  createProject,
  getMiscChapter,
  getChaptersForProject,
  getProjectRecipes,
  deleteChapter,
  getAllProjects,
  getAllRecipes,
  db,
} from './db.js'
import { DEFAULT_PLACEMENT } from './templates.js'

describe('db.js importCookbook', () => {
  it('creates a project, chapters, recipes, and placements in order', async () => {
    const data = {
      title: 'Imported Cookbook',
      subtitle: 'From a file',
      accentColor: '#123456',
      coverTemplate: 'modern',
      pageNumbersEnabled: false,
      doubleSidedEnabled: true,
      chapters: [
        {
          name: 'Desserts',
          sequence: 0,
          recipes: [
            { title: 'Cake', instructions: 'Bake it.', ingredients: [] },
            { title: 'Pie', instructions: 'Bake it too.', ingredients: [] },
          ],
        },
        { name: 'Mains', sequence: 1, recipes: [] },
      ],
    }

    const { project, chapters, recipes, placements } = await importCookbook(data)

    expect(project.title).toBe('Imported Cookbook')
    expect(project.doubleSidedEnabled).toBe(true)
    expect(chapters).toHaveLength(2)
    expect(chapters[0].name).toBe('Desserts')
    expect(chapters[0].isDefault).toBe(true)
    expect(chapters[1].name).toBe('Mains')
    expect(chapters[1].isDefault).toBe(false)

    expect(recipes).toHaveLength(2)
    expect(recipes.every((r) => r.fitsOnPage === null)).toBe(true)
    expect(recipes.every((r) => r.imagePlacement === DEFAULT_PLACEMENT)).toBe(true)

    expect(placements).toHaveLength(2)
    expect(placements[0].chapterId).toBe(chapters[0].id)
    expect(placements[0].sequence).toBe(0)
    expect(placements[1].sequence).toBe(1)

    // Persisted, not just returned.
    const persistedChapters = await getChaptersForProject(project.id)
    expect(persistedChapters).toHaveLength(2)
    const persistedRecipes = await getProjectRecipes(project.id)
    expect(persistedRecipes).toHaveLength(2)
  })

  it('ignores any fitsOnPage value implied by the import', async () => {
    const data = {
      title: 'Test',
      chapters: [{ name: 'Ch', recipes: [{ title: 'R', instructions: 'x', fitsOnPage: true }] }],
    }
    const { recipes } = await importCookbook(data)
    expect(recipes[0].fitsOnPage).toBeNull()
  })

  it('creates one auto Miscellaneous chapter for a cookbook with zero chapters', async () => {
    const { chapters } = await importCookbook({ title: 'No Chapters', chapters: [] })
    expect(chapters).toHaveLength(1)
    expect(chapters[0].isDefault).toBe(true)
  })

  it('keeps the single-default-chapter invariant: getMiscChapter/deleteChapter still work', async () => {
    const data = {
      title: 'Invariant Check',
      chapters: [
        { name: 'Desserts', sequence: 0, recipes: [] },
        { name: 'Mains', sequence: 1, recipes: [] },
      ],
    }
    const { project, chapters } = await importCookbook(data)

    const misc = await getMiscChapter(project.id)
    expect(misc.id).toBe(chapters[0].id)
    expect(misc.name).toBe('Desserts')

    // The default chapter cannot be deleted.
    await expect(deleteChapter(chapters[0].id)).rejects.toThrow()

    // A non-default chapter can be deleted.
    await expect(deleteChapter(chapters[1].id)).resolves.toBeDefined()
  })

  it('does not touch existing cookbooks or recipes', async () => {
    const existing = await createProject({ title: 'Existing Cookbook' })
    const beforeProjects = await getAllProjects()
    const beforeRecipes = await getAllRecipes()

    await importCookbook({
      title: 'New Import',
      chapters: [{ name: 'Ch', recipes: [{ title: 'New Recipe', instructions: 'x' }] }],
    })

    const afterProjects = await getAllProjects()
    expect(afterProjects.length).toBe(beforeProjects.length + 1)
    const existingProjectStillThere = await db.projects.get(existing.projectId)
    expect(existingProjectStillThere.title).toBe('Existing Cookbook')

    const afterRecipes = await getAllRecipes()
    expect(afterRecipes.length).toBe(beforeRecipes.length + 1)
  })
})
