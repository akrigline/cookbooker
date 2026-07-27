/**
 * Computes the next `sequence` value for an ordered list of items, each
 * having a numeric `sequence` field. Returns 0 for an empty list.
 */
export function nextSequence(items) {
  return items.length ? Math.max(...items.map((item) => item.sequence ?? 0)) + 1 : 0
}
