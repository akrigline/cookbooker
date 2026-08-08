import { describe, expect, it } from 'vitest'
import { intersectExistingRecipeIds } from './cookbookImportShortcut.js'

describe('intersectExistingRecipeIds', () => {
  const existingRecipes = [{ id: 1 }, { id: 2 }, { id: 3 }]

  it('keeps only ids that exist in the recipe list', () => {
    expect(intersectExistingRecipeIds([1, 2, 4], existingRecipes)).toEqual([1, 2])
  })

  it('preserves input order', () => {
    expect(intersectExistingRecipeIds([3, 1], existingRecipes)).toEqual([3, 1])
  })

  it('returns an empty array when nothing matches', () => {
    expect(intersectExistingRecipeIds([9, 10], existingRecipes)).toEqual([])
  })

  it('returns an empty array for an empty input', () => {
    expect(intersectExistingRecipeIds([], existingRecipes)).toEqual([])
  })
})
