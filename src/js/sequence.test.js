import { describe, expect, it } from 'vitest'
import { nextSequence, sequenceForInsertAfter } from './sequence.js'

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

// `sequenceForInsertAfter` backs both chapter and recipe drag-and-drop
// reordering (ProjectView.vue's onChapterDrop/onRecipeDrop): it turns a drop
// position - "after this id" or "before everything" - into a single midpoint
// sequence value, without shifting every sibling's sequence.
describe('sequenceForInsertAfter', () => {
  const items = [
    { id: 1, sequence: 0 },
    { id: 2, sequence: 5 },
    { id: 3, sequence: 10 },
  ]

  it('places before everything when afterId is null', () => {
    expect(sequenceForInsertAfter(items, null)).toBeLessThan(0)
  })

  it('places between two existing items when afterId names one with a successor', () => {
    const seq = sequenceForInsertAfter(items, 1)
    expect(seq).toBeGreaterThan(0)
    expect(seq).toBeLessThan(5)
  })

  it('places after the last item when afterId names it', () => {
    expect(sequenceForInsertAfter(items, 3)).toBe(11)
  })

  it('falls back to nextSequence when afterId is not found (e.g. a filtered-out dragged item)', () => {
    expect(sequenceForInsertAfter(items, 999)).toBe(nextSequence(items))
  })

  it('treats an empty list as a valid "insert at top" target', () => {
    expect(sequenceForInsertAfter([], null)).toBe(-1)
  })
})
