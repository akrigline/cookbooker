import { describe, expect, it } from 'vitest'
import { applyRange } from './rangeSelect.js'

describe('applyRange', () => {
  const ids = ['a', 'b', 'c', 'd', 'e']

  it('selects every id between the anchor and target, inclusive', () => {
    const result = applyRange(new Set(), ids, 'b', 'd', true)
    expect(result).toEqual(new Set(['b', 'c', 'd']))
  })

  it('works in either click order - target before anchor', () => {
    const result = applyRange(new Set(), ids, 'd', 'b', true)
    expect(result).toEqual(new Set(['b', 'c', 'd']))
  })

  it('deselects the range when targetChecked is false', () => {
    const result = applyRange(new Set(ids), ids, 'b', 'd', false)
    expect(result).toEqual(new Set(['a', 'e']))
  })

  it('handles a range of one when anchor and target are the same id', () => {
    const result = applyRange(new Set(), ids, 'c', 'c', true)
    expect(result).toEqual(new Set(['c']))
  })

  it('returns null when the anchor id is no longer in the list', () => {
    expect(applyRange(new Set(), ids, 'gone', 'd', true)).toBeNull()
  })

  it('returns null when the target id is not in the list', () => {
    expect(applyRange(new Set(), ids, 'b', 'gone', true)).toBeNull()
  })

  it('does not mutate the set passed in', () => {
    const original = new Set(['a'])
    applyRange(original, ids, 'b', 'd', true)
    expect(original).toEqual(new Set(['a']))
  })

  it('preserves selections outside the range', () => {
    const result = applyRange(new Set(['a', 'e']), ids, 'b', 'c', true)
    expect(result).toEqual(new Set(['a', 'e', 'b', 'c']))
  })
})
