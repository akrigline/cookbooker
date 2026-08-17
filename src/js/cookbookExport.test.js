import { describe, expect, it } from 'vitest'
import { exportCookbookToHtml, cookbookExportFilename } from './cookbookExport'
import { parseCookbookImportHtml } from './cookbookImport'

const project = {
  title: 'Family Favorites',
  subtitle: 'A collection',
  accentColor: '#ff8800',
  coverTemplate: 'modern',
  pageNumbersEnabled: true,
  doubleSidedEnabled: false,
}

describe('exportCookbookToHtml', () => {
  it('round-trips cookbook settings into meta elements', async () => {
    const chapters = [{ id: 1, name: 'Desserts', sequence: 0 }]
    const recipesByChapter = new Map([[1, []]])

    const html = await exportCookbookToHtml(project, chapters, recipesByChapter)
    const { cookbook, rejected } = parseCookbookImportHtml(html)

    expect(rejected).toBe(false)
    expect(cookbook.title).toBe(project.title)
    expect(cookbook.subtitle).toBe(project.subtitle)
    expect(cookbook.accentColor).toBe(project.accentColor)
    expect(cookbook.coverTemplate).toBe(project.coverTemplate)
    expect(cookbook.pageNumbersEnabled).toBe(true)
    expect(cookbook.doubleSidedEnabled).toBe(false)
  })

  it('emits chapters in sequence order regardless of input order', async () => {
    const chapters = [
      { id: 2, name: 'Mains', sequence: 1 },
      { id: 1, name: 'Desserts', sequence: 0 },
    ]
    const recipesByChapter = new Map([
      [1, []],
      [2, []],
    ])

    const html = await exportCookbookToHtml(project, chapters, recipesByChapter)
    const { cookbook } = parseCookbookImportHtml(html)

    expect(cookbook.chapters.map((c) => c.name)).toEqual(['Desserts', 'Mains'])
  })

  it('emits recipes within a chapter in the given order', async () => {
    const chapters = [{ id: 1, name: 'Desserts', sequence: 0 }]
    const recipesByChapter = new Map([
      [
        1,
        [
          { title: 'Cake', instructions: 'Bake it.', ingredients: [] },
          { title: 'Pie', instructions: 'Bake it too.', ingredients: [] },
        ],
      ],
    ])

    const html = await exportCookbookToHtml(project, chapters, recipesByChapter)
    const { cookbook } = parseCookbookImportHtml(html)

    expect(cookbook.chapters[0].recipes.map((r) => r.title)).toEqual(['Cake', 'Pie'])
  })

  it('exports a chapter with no recipes as an empty chapter', async () => {
    const chapters = [{ id: 1, name: 'Empty Chapter', sequence: 0 }]
    const recipesByChapter = new Map([[1, []]])

    const html = await exportCookbookToHtml(project, chapters, recipesByChapter)
    const { cookbook } = parseCookbookImportHtml(html)

    expect(cookbook.chapters).toHaveLength(1)
    expect(cookbook.chapters[0].recipes).toEqual([])
  })

  it('exports a recipe with a photo and display settings identically to single-recipe export', async () => {
    const imageBlob = new Blob(['fake-image-bytes'], { type: 'image/png' })
    const recipe = {
      title: 'Photo Recipe',
      instructions: 'Do the thing.',
      ingredients: [{ raw: '1 cup flour' }],
      layoutTemplate: 'column-optimized',
      ingredientColumns: 2,
      imageAspectRatio: '1:1',
      image: imageBlob,
    }
    const chapters = [{ id: 1, name: 'Desserts', sequence: 0 }]
    const recipesByChapter = new Map([[1, [recipe]]])

    const html = await exportCookbookToHtml(project, chapters, recipesByChapter)
    const { cookbook } = parseCookbookImportHtml(html)
    const parsed = cookbook.chapters[0].recipes[0]

    expect(parsed.title).toBe(recipe.title)
    expect(parsed.layoutTemplate).toBe(recipe.layoutTemplate)
    expect(parsed.ingredientColumns).toBe(recipe.ingredientColumns)
    expect(parsed.imageAspectRatio).toBe(recipe.imageAspectRatio)
    expect(parsed.image).not.toBeNull()
    expect(await parsed.image.text()).toBe('fake-image-bytes')
  })
})

describe('cookbookExportFilename', () => {
  it('sanitizes an unsafe title into a filename', () => {
    expect(cookbookExportFilename('Mom\'s Recipes / 2024')).toBe("Mom's Recipes - 2024.html")
  })

  it('falls back to cookbook.html for an empty title', () => {
    expect(cookbookExportFilename('')).toBe('cookbook.html')
    expect(cookbookExportFilename(undefined)).toBe('cookbook.html')
    expect(cookbookExportFilename('   ')).toBe('cookbook.html')
  })
})
