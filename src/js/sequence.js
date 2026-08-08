/**
 * Computes the next `sequence` value for an ordered list of items, each
 * having a numeric `sequence` field. Returns 0 for an empty list.
 */
export function nextSequence(items) {
  return items.length ? Math.max(...items.map((item) => item.sequence ?? 0)) + 1 : 0
}

/**
 * Computes a `sequence` value that places an item immediately after
 * `afterId` in `orderedItems` (already sorted by sequence, and excluding the
 * item being moved). `afterId === null` means "before everything" (top of
 * the list). Used to turn a drag-and-drop insertion point into a single
 * midpoint sequence value, rather than shifting every sibling's sequence.
 */
export function sequenceForInsertAfter(orderedItems, afterId) {
  if (afterId == null) {
    return (orderedItems[0]?.sequence ?? 0) - 1
  }
  const idx = orderedItems.findIndex((item) => item.id === afterId)
  if (idx === -1) return nextSequence(orderedItems)
  const anchor = orderedItems[idx]
  const next = orderedItems[idx + 1]
  return next ? (anchor.sequence + next.sequence) / 2 : anchor.sequence + 1
}
