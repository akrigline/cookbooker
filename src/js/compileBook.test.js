import { describe, expect, it } from 'vitest'
import { buildChapterPlan } from './compileBook'

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
