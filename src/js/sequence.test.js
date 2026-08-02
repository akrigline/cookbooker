import { describe, expect, it } from 'vitest'
import { nextSequence } from './sequence.js'

// `nextSequence` backs a cross-file invariant (db.js derives every `sequence`
// with it, and the stores mirror those derived values rather than recomputing
// them), so its edge cases are pinned here rather than only exercised
// indirectly through db.test.js.
describe('nextSequence', () => {
  it('starts at 0 for an empty list', () => {
    expect(nextSequence([])).toBe(0)
  })

  it('returns one past the highest sequence, not the item count', () => {
    expect(nextSequence([{ sequence: 0 }, { sequence: 5 }, { sequence: 2 }])).toBe(6)
  })

  it('treats a missing sequence as 0', () => {
    expect(nextSequence([{}])).toBe(1)
    expect(nextSequence([{ sequence: undefined }, { sequence: 3 }])).toBe(4)
  })

  it('does not go backwards when sequences are negative', () => {
    // ProjectView assigns `firstSequence - 1` when dropping a recipe at the top
    // of a chapter, so negative sequences are reachable in real data.
    expect(nextSequence([{ sequence: -3 }, { sequence: -1 }])).toBe(0)
  })

  it('is computed over every row it is given, including the default chapter', () => {
    // Chapter sequences are derived over all chapters for a project, and the
    // default Miscellaneous chapter is always sequence 0 - so the first custom
    // chapter gets 1, not 0. Code that assumes a fresh chapter starts at 0 is
    // wrong.
    const miscOnly = [{ sequence: 0, isDefault: true }]
    expect(nextSequence(miscOnly)).toBe(1)
  })
})
