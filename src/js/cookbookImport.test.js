import { describe, expect, it } from 'vitest'
import { parseCookbookImportHtml } from './cookbookImport'
import { exportCookbookToHtml } from './cookbookExport'

const project = {
  title: 'Family Favorites',
  subtitle: 'A collection',
  accentColor: '#ff8800',
  coverTemplate: 'modern',
  pageNumbersEnabled: true,
  doubleSidedEnabled: true,
}

describe('parseCookbookImportHtml', () => {
  it('falls back to an empty favoriteIcon for an unrecognized icon value, as a hand-edited file might carry', () => {
    const html = `<!DOCTYPE html><html><body>
      <section data-cm-format="cookbook" data-cm-version="1">
        <meta class="cm-cookbook-favorite-icon" content="rainbow">
      </section>
    </body></html>`
    const { cookbook } = parseCookbookImportHtml(html)
    expect(cookbook.favoriteIcon).toBe('')
  })

  it('accepts a known favoriteIcon value', () => {
    const html = `<!DOCTYPE html><html><body>
      <section data-cm-format="cookbook" data-cm-version="1">
        <meta class="cm-cookbook-favorite-icon" content="sock">
      </section>
    </body></html>`
    const { cookbook } = parseCookbookImportHtml(html)
    expect(cookbook.favoriteIcon).toBe('sock')
  })

  it('rejects a file with no cookbook/1 root', () => {
    const result = parseCookbookImportHtml('<html><body><p>Not a cookbook</p></body></html>')
    expect(result.rejected).toBe(true)
    expect(result.cookbook).toBeNull()
    expect(result.failures).toEqual([])
  })

  it('round-trips a full cookbook through export then import', async () => {
    const chapters = [
      { id: 1, name: 'Desserts', sequence: 0 },
      { id: 2, name: 'Mains', sequence: 1 },
    ]
    const recipesByChapter = new Map([
      [1, [{ title: 'Cake', instructions: 'Bake it.', ingredients: [{ raw: '1 cup sugar' }] }]],
      [2, []],
    ])
    const html = await exportCookbookToHtml(project, chapters, recipesByChapter)

    const { cookbook, failures, rejected } = parseCookbookImportHtml(html)

    expect(rejected).toBe(false)
    expect(failures).toEqual([])
    expect(cookbook.title).toBe(project.title)
    expect(cookbook.doubleSidedEnabled).toBe(true)
    expect(cookbook.chapters).toHaveLength(2)
    expect(cookbook.chapters[0].name).toBe('Desserts')
    expect(cookbook.chapters[0].recipes).toHaveLength(1)
    expect(cookbook.chapters[0].recipes[0].title).toBe('Cake')
    expect(cookbook.chapters[1].name).toBe('Mains')
    expect(cookbook.chapters[1].recipes).toEqual([])
  })

  it('skips one bad recipe in a chapter while the rest of the file still imports', async () => {
    const html = `<!DOCTYPE html>
<html><body>
  <section data-cm-format="cookbook" data-cm-version="1">
    <meta class="cm-cookbook-title" content="Test Cookbook">
    <section class="cm-chapter" data-cm-chapter-name="Desserts" data-cm-chapter-sequence="0">
      <article data-cm-format="recipe" data-cm-version="1">
        <h1 class="cm-title">Good Recipe</h1>
        <ul class="cm-ingredients"><li>1 cup flour</li></ul>
        <ol class="cm-instructions"><li>Mix it.</li></ol>
      </article>
      <article data-cm-format="recipe" data-cm-version="1">
        <ul class="cm-ingredients"><li>1 cup flour</li></ul>
        <ol class="cm-instructions"><li>Missing a title.</li></ol>
      </article>
    </section>
  </body></html>`

    const { cookbook, failures, rejected } = parseCookbookImportHtml(html)

    expect(rejected).toBe(false)
    expect(cookbook.chapters).toHaveLength(1)
    expect(cookbook.chapters[0].recipes).toHaveLength(1)
    expect(cookbook.chapters[0].recipes[0].title).toBe('Good Recipe')
    expect(failures).toHaveLength(1)
    expect(failures[0].chapterName).toBe('Desserts')
    expect(failures[0].reason).toMatch(/title/i)
  })

  it('still produces an empty chapter when every recipe in it fails to parse', () => {
    const html = `<!DOCTYPE html>
<html><body>
  <section data-cm-format="cookbook" data-cm-version="1">
    <meta class="cm-cookbook-title" content="Test Cookbook">
    <section class="cm-chapter" data-cm-chapter-name="All Broken" data-cm-chapter-sequence="0">
      <article data-cm-format="recipe" data-cm-version="1">
        <ul class="cm-ingredients"></ul>
        <ol class="cm-instructions"></ol>
      </article>
    </section>
  </body></html>`

    const { cookbook, failures } = parseCookbookImportHtml(html)

    expect(cookbook.chapters).toHaveLength(1)
    expect(cookbook.chapters[0].name).toBe('All Broken')
    expect(cookbook.chapters[0].recipes).toEqual([])
    expect(failures).toHaveLength(1)
  })

  it('falls back to document order when data-cm-chapter-sequence is missing or malformed', () => {
    const html = `<!DOCTYPE html>
<html><body>
  <section data-cm-format="cookbook" data-cm-version="1">
    <meta class="cm-cookbook-title" content="Test Cookbook">
    <section class="cm-chapter" data-cm-chapter-name="First"></section>
    <section class="cm-chapter" data-cm-chapter-name="Second" data-cm-chapter-sequence="not-a-number"></section>
    <section class="cm-chapter" data-cm-chapter-name="Third" data-cm-chapter-sequence="2"></section>
  </body></html>`

    const { cookbook } = parseCookbookImportHtml(html)

    expect(cookbook.chapters.map((c) => c.name)).toEqual(['First', 'Second', 'Third'])
  })

  it('returns a cookbook with an empty chapter list when the section has zero chapters', () => {
    const html = `<!DOCTYPE html>
<html><body>
  <section data-cm-format="cookbook" data-cm-version="1">
    <meta class="cm-cookbook-title" content="Empty Cookbook">
  </section>
  </body></html>`

    const { cookbook, rejected } = parseCookbookImportHtml(html)

    expect(rejected).toBe(false)
    expect(cookbook.chapters).toEqual([])
  })
})
