import { describe, it, expect } from 'vitest'
import { computeReturnContext, returnContextBackTo } from './returnContext'

describe('computeReturnContext', () => {
  it('returns null when both params are absent', () => {
    expect(computeReturnContext({})).toBeNull()
    expect(computeReturnContext(undefined)).toBeNull()
  })

  it('returns null when only one param is present', () => {
    expect(computeReturnContext({ returnToProject: '1' })).toBeNull()
    expect(computeReturnContext({ returnToRecipe: '2' })).toBeNull()
  })

  it('returns the projectId/recipeId pair when both params are present', () => {
    expect(computeReturnContext({ returnToProject: '1', returnToRecipe: '2' })).toEqual({
      projectId: '1',
      recipeId: '2',
    })
  })
})

describe('returnContextBackTo', () => {
  it('routes to the library when there is no return context', () => {
    expect(returnContextBackTo(null)).toBe('/library')
  })

  it('routes to the cookbook project with a reopenRecipe param when a return context is set', () => {
    expect(returnContextBackTo({ projectId: '1', recipeId: '2' })).toBe('/projects/1?reopenRecipe=2')
  })
})
