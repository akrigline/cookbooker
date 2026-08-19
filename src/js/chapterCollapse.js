// Persists which chapter cards a user has collapsed in the cookbook view.
// Pure UI/display state, not cookbook data - deliberately localStorage
// rather than IndexedDB, so it doesn't need to travel through
// backup/export/import. Chapter IDs are globally unique (Dexie
// autoincrement), so a single unscoped set is enough.
const STORAGE_KEY = 'cm-collapsed-chapter-ids'

export function loadCollapsedChapterIds() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? new Set(parsed) : new Set()
  } catch {
    return new Set()
  }
}

export function saveCollapsedChapterIds(ids) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]))
  } catch {
    // localStorage unavailable (private mode, quota) - collapse state just won't persist
  }
}
