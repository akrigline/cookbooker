/**
 * Applies a shift+click range-select to a Set of selected ids: every id
 * between `fromId` and `toId` (inclusive, in `ids` order) is added to or
 * removed from the selection depending on `targetChecked`. Returns a new
 * Set, or null if either endpoint isn't present in `ids` (e.g. the anchor
 * was clicked before a filter changed what's currently visible) so the
 * caller can fall back to a plain single-item toggle.
 */
export function applyRange(currentSet, ids, fromId, toId, targetChecked) {
  const fromIdx = ids.indexOf(fromId)
  const toIdx = ids.indexOf(toId)
  if (fromIdx === -1 || toIdx === -1) return null
  const [start, end] = fromIdx < toIdx ? [fromIdx, toIdx] : [toIdx, fromIdx]
  const next = new Set(currentSet)
  ids.slice(start, end + 1).forEach((id) => (targetChecked ? next.add(id) : next.delete(id)))
  return next
}
