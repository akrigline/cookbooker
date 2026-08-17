import { describe, expect, it } from 'vitest'
import { buildChapterPlan, layoutBookPages, maxPageNumberDigits } from './compileBook'

const recipesById = new Map([
  [1, { id: 1, title: 'Pancakes' }],
  [2, { id: 2, title: 'Waffles' }],
  [3, { id: 3, title: 'Soup' }],
])

describe('buildChapterPlan', () => {
  it('orders custom chapters by sequence and appends non-empty Miscellaneous last', () => {
    const chapters = [
      { id: 10, projectId: 1, name: 'Miscellaneous', isDefault: true, sequence: 0 },
      { id: 11, projectId: 1, name: 'Breakfast', isDefault: false, sequence: 1 },
      { id: 12, projectId: 1, name: 'Appetizers', isDefault: false, sequence: 0 },
    ]
    const projectRecipes = [
      { id: 100, projectId: 1, chapterId: 11, recipeId: 1, sequence: 0 },
      { id: 101, projectId: 1, chapterId: 12, recipeId: 2, sequence: 0 },
      { id: 102, projectId: 1, chapterId: 10, recipeId: 3, sequence: 0 },
    ]

    const plan = buildChapterPlan({ chapters, projectRecipes, recipesById, projectId: 1 })

    expect(plan.map((e) => e.chapter.name)).toEqual(['Appetizers', 'Breakfast', 'Miscellaneous'])
    expect(plan[2].recipes.map((r) => r.title)).toEqual(['Soup'])
  })

  it('omits an empty Miscellaneous chapter entirely', () => {
    const chapters = [
      { id: 10, projectId: 1, name: 'Miscellaneous', isDefault: true, sequence: 0 },
      { id: 11, projectId: 1, name: 'Breakfast', isDefault: false, sequence: 0 },
    ]
    const projectRecipes = [{ id: 100, projectId: 1, chapterId: 11, recipeId: 1, sequence: 0 }]

    const plan = buildChapterPlan({ chapters, projectRecipes, recipesById, projectId: 1 })

    expect(plan.map((e) => e.chapter.name)).toEqual(['Breakfast'])
  })
})

describe('layoutBookPages', () => {
  const twoChapterPlan = [
    {
      chapter: { id: 11, name: 'Breakfast' },
      recipes: [
        { id: 1, title: 'Pancakes' },
        { id: 2, title: 'Waffles' },
      ],
    },
    {
      chapter: { id: 12, name: 'Dinner' },
      recipes: [{ id: 3, title: 'Soup' }],
    },
  ]

  it('numbers divider and recipe pages sequentially starting at 1 when single-sided', () => {
    const { dividerPages, recipePages, pages } = layoutBookPages(twoChapterPlan, {
      doubleSided: false,
      tocPageCount: 0,
    })

    expect(dividerPages.get(11)).toBe(1)
    expect(recipePages.get('11:1')).toBe(2)
    expect(recipePages.get('11:2')).toBe(3)
    expect(dividerPages.get(12)).toBe(4)
    expect(recipePages.get('12:3')).toBe(5)
    expect(pages.some((p) => p.type === 'blank')).toBe(false)
  })

  it('returns empty maps and no pages for an empty plan', () => {
    const { dividerPages, recipePages, pages } = layoutBookPages([], {
      doubleSided: false,
      tocPageCount: 0,
    })
    expect(dividerPages.size).toBe(0)
    expect(recipePages.size).toBe(0)
    expect(pages).toEqual([])
  })

  it('places an unnumbered TOC page directly after the Title Page when single-sided', () => {
    const { pages, dividerPages } = layoutBookPages(twoChapterPlan, {
      doubleSided: false,
      tocPageCount: 1,
    })

    expect(pages[0]).toMatchObject({ type: 'toc', printedNumber: null })
    // Numbering still starts at 1 on the first divider - the TOC page itself
    // (physical page 2, right after the Title Page) doesn't consume a slot.
    expect(dividerPages.get(11)).toBe(1)
  })

  it('inserts a blank page before the TOC and again before a chapter landing on a verso page, silently consuming number slots', () => {
    const { pages, dividerPages, recipePages } = layoutBookPages(twoChapterPlan, {
      doubleSided: true,
      tocPageCount: 1,
    })

    expect(pages.map((p) => p.type)).toEqual([
      'blank', // page 2, before the TOC
      'toc', // page 3
      'blank', // page 4, before the first chapter (would otherwise land on page 4)
      'divider', // page 5
      'recipe', // page 6
      'recipe', // page 7
      'blank', // page 8, before the second chapter (would otherwise land on page 8)
      'divider', // page 9
      'recipe', // page 10
    ])
    expect(pages.every((p) => p.type !== 'blank' || p.printedNumber === null)).toBe(true)

    expect(dividerPages.get(11)).toBe(1)
    expect(recipePages.get('11:1')).toBe(2)
    expect(recipePages.get('11:2')).toBe(3)
    // Slot 4 was silently consumed by the blank page before chapter 12 -
    // the visible number jumps from 3 straight to 5.
    expect(dividerPages.get(12)).toBe(5)
    expect(recipePages.get('12:3')).toBe(6)
  })

  it('still forces a recto start for the first chapter when double-sided and page numbers are off (no TOC)', () => {
    const { pages, dividerPages } = layoutBookPages(twoChapterPlan, {
      doubleSided: true,
      tocPageCount: 0,
    })

    expect(pages[0]).toMatchObject({ type: 'blank' })
    expect(pages[1]).toMatchObject({ type: 'divider', chapterId: 11 })
    expect(dividerPages.get(11)).toBe(1)
  })

  it('never inserts a blank page when double-sided is off, regardless of chapter/recipe counts', () => {
    const oddChapterPlan = [
      { chapter: { id: 20, name: 'One' }, recipes: [] },
      { chapter: { id: 21, name: 'Two' }, recipes: [{ id: 1, title: 'X' }] },
    ]
    const { pages } = layoutBookPages(oddChapterPlan, { doubleSided: false, tocPageCount: 1 })
    expect(pages.every((p) => p.type !== 'blank')).toBe(true)
  })

  it('shifts divider/recipe numbering by however many TOC pages were actually needed', () => {
    const { pages, dividerPages, recipePages } = layoutBookPages(twoChapterPlan, {
      doubleSided: false,
      tocPageCount: 3,
    })

    expect(pages.slice(0, 3).map((p) => p.type)).toEqual(['toc', 'toc', 'toc'])
    expect(pages.slice(0, 3).map((p) => p.tocPageIndex)).toEqual([0, 1, 2])
    expect(dividerPages.get(11)).toBe(1)
    expect(recipePages.get('11:1')).toBe(2)
    expect(recipePages.get('11:2')).toBe(3)
    expect(dividerPages.get(12)).toBe(4)
    expect(recipePages.get('12:3')).toBe(5)
    // Physical pages: Title(1), toc(2,3,4), divider(5), recipe(6,7), divider(8), recipe(9).
    expect(pages.find((p) => p.chapterId === 11 && p.type === 'divider').page).toBe(5)
  })
})

// The number column TocRecipeRow/TocChapterRow reserve is sized from this. It
// must be an upper bound and never an underestimate: too wide costs a few px of
// title space, too narrow lets a rendered number outgrow the width the TOC was
// measured with, which silently over-fills pages (see tocLayout.js).
describe('maxPageNumberDigits', () => {
  const planOf = (chapters) =>
    chapters.map((count, i) => ({
      chapter: { id: i + 1, name: `Chapter ${i + 1}` },
      recipes: Array.from({ length: count }, (_, r) => ({ id: `${i}-${r}`, title: 'r' })),
    }))

  it('never underestimates the largest number layoutBookPages can print', () => {
    for (const chapters of [[0], [1, 1], [5, 5, 5], [40, 40, 40], [3, 0, 7, 12]]) {
      const plan = planOf(chapters)
      for (const doubleSided of [false, true]) {
        const { dividerPages, recipePages } = layoutBookPages(plan, {
          doubleSided,
          tocPageCount: 2,
        })
        const largest = Math.max(0, ...dividerPages.values(), ...recipePages.values())
        expect(maxPageNumberDigits(plan)).toBeGreaterThanOrEqual(String(largest).length)
      }
    }
  })

  it('does not depend on how many pages the table of contents takes', () => {
    // This is what breaks the circular dependency: the number column has to be
    // sized before the TOC is measured, so it cannot be a function of the
    // TOC's own length.
    const plan = planOf([10, 10])
    expect(maxPageNumberDigits(plan)).toBe(maxPageNumberDigits(plan))
    const { dividerPages: a } = layoutBookPages(plan, { tocPageCount: 1 })
    const { dividerPages: b } = layoutBookPages(plan, { tocPageCount: 9 })
    expect(a.get(1)).toBe(b.get(1))
  })

  it('returns at least one digit for an empty plan', () => {
    expect(maxPageNumberDigits([])).toBe(1)
  })

  it('grows with the book', () => {
    expect(maxPageNumberDigits(planOf([2]))).toBe(1)
    expect(maxPageNumberDigits(planOf([200, 200]))).toBe(3)
  })
})
