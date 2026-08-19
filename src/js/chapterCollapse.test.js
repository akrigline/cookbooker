import { beforeEach, describe, expect, it } from 'vitest'
import { loadCollapsedChapterIds, saveCollapsedChapterIds } from './chapterCollapse.js'

// happy-dom's `window` doesn't come with a localStorage implementation in
// this environment, so stub a minimal one - matches the real Storage
// interface for what this module uses (getItem/setItem/clear).
function installLocalStorageStub() {
  const store = new Map()
  window.localStorage = {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, String(value)),
    clear: () => store.clear(),
  }
}

describe('chapterCollapse', () => {
  beforeEach(() => {
    installLocalStorageStub()
  })

  it('returns an empty set when nothing has been saved', () => {
    expect(loadCollapsedChapterIds()).toEqual(new Set())
  })

  it('round-trips a saved set of ids', () => {
    saveCollapsedChapterIds(new Set([3, 7]))
    expect(loadCollapsedChapterIds()).toEqual(new Set([3, 7]))
  })

  it('overwrites the previously saved set rather than merging', () => {
    saveCollapsedChapterIds(new Set([1, 2]))
    saveCollapsedChapterIds(new Set([9]))
    expect(loadCollapsedChapterIds()).toEqual(new Set([9]))
  })

  it('falls back to an empty set for corrupted storage', () => {
    window.localStorage.setItem('cm-collapsed-chapter-ids', 'not json')
    expect(loadCollapsedChapterIds()).toEqual(new Set())
  })

  it('falls back to an empty set when storage holds a non-array value', () => {
    window.localStorage.setItem('cm-collapsed-chapter-ids', JSON.stringify({ not: 'an array' }))
    expect(loadCollapsedChapterIds()).toEqual(new Set())
  })
})
