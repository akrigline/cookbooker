import { describe, expect, it } from 'vitest'
import { assignPageNumbers, buildChapterPlan } from './compileBook'

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

describe('assignPageNumbers', () => {
  it('numbers divider and recipe pages sequentially starting at 1', () => {
    const plan = [
      {
        chapter: { id: 12, name: 'Appetizers' },
        recipes: [{ id: 2, title: 'Waffles' }],
      },
      {
        chapter: { id: 11, name: 'Breakfast' },
        recipes: [
          { id: 1, title: 'Pancakes' },
          { id: 3, title: 'Soup' },
        ],
      },
    ]

    const { dividerPages, recipePages } = assignPageNumbers(plan)

    expect(dividerPages.get(12)).toBe(1)
    expect(recipePages.get('12:2')).toBe(2)
    expect(dividerPages.get(11)).toBe(3)
    expect(recipePages.get('11:1')).toBe(4)
    expect(recipePages.get('11:3')).toBe(5)
  })

  it('returns empty maps for an empty plan', () => {
    const { dividerPages, recipePages } = assignPageNumbers([])
    expect(dividerPages.size).toBe(0)
    expect(recipePages.size).toBe(0)
  })
})
