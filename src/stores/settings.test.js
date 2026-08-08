import { beforeEach, describe, expect, it, vi } from 'vitest'
import 'fake-indexeddb/auto'
import { createPinia, setActivePinia } from 'pinia'
import { useSettingsStore } from './settings.js'
import * as db_ from '../js/db.js'
import { getSettings, db } from '../js/db.js'

beforeEach(async () => {
  setActivePinia(createPinia())
  await db.settings.clear()
})

describe('settings store', () => {
  it('load populates state from the database', async () => {
    await db.settings.put({ key: 'app', ingredientQtyAlign: 'left' })
    const store = useSettingsStore()
    expect(store.loaded).toBe(false)

    await store.load()

    expect(store.loaded).toBe(true)
    expect(store.ingredientQtyAlign).toBe('left')
  })

  it('load is memoized: concurrent callers share one read', async () => {
    // Asserting on promise identity (`store.load() === store.load()`) can't
    // fail here regardless of memoization: Pinia's action wrapper returns a
    // fresh promise from every call, and load() itself resolves to
    // `undefined` both times either way. What memoization actually buys is
    // read deduplication - one db.getSettings() call for N concurrent
    // load()s - so assert that directly via call count.
    const spy = vi.spyOn(db_, 'getSettings')
    const store = useSettingsStore()
    await Promise.all([store.load(), store.load(), store.load()])
    expect(spy).toHaveBeenCalledTimes(1)
    spy.mockRestore()
  })

  it('setIngredientQtyAlign writes via db.updateSettings and mirrors the persisted return value', async () => {
    const store = useSettingsStore()

    await store.setIngredientQtyAlign('left')

    expect(store.ingredientQtyAlign).toBe('left')
    const settings = await getSettings()
    expect(settings.ingredientQtyAlign).toBe('left')
  })

  it('reload re-reads from the database, bypassing the load() memo', async () => {
    const store = useSettingsStore()
    await store.load()
    expect(store.ingredientQtyAlign).toBe('right')

    // Simulates data changing out from under the store, e.g. a restore.
    await db.settings.put({ key: 'app', ingredientQtyAlign: 'left' })
    await store.load()
    expect(store.ingredientQtyAlign).toBe('right')

    await store.reload()
    expect(store.ingredientQtyAlign).toBe('left')
  })
})
