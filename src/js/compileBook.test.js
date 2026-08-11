import { describe, expect, it } from 'vitest'
import { buildChapterPlan, layoutBookPages } from './compileBook'

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
      showToc: false,
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
      showToc: false,
    })
    expect(dividerPages.size).toBe(0)
    expect(recipePages.size).toBe(0)
    expect(pages).toEqual([])
  })

  it('places an unnumbered TOC page directly after the Title Page when single-sided', () => {
    const { pages, dividerPages } = layoutBookPages(twoChapterPlan, {
      doubleSided: false,
      showToc: true,
    })

    expect(pages[0]).toMatchObject({ type: 'toc', printedNumber: null })
    // Numbering still starts at 1 on the first divider - the TOC page itself
    // (physical page 2, right after the Title Page) doesn't consume a slot.
    expect(dividerPages.get(11)).toBe(1)
  })

  it('inserts a blank page before the TOC and again before a chapter landing on a verso page, silently consuming number slots', () => {
    const { pages, dividerPages, recipePages } = layoutBookPages(twoChapterPlan, {
      doubleSided: true,
      showToc: true,
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
      showToc: false,
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
    const { pages } = layoutBookPages(oddChapterPlan, { doubleSided: false, showToc: true })
    expect(pages.every((p) => p.type !== 'blank')).toBe(true)
  })
})
