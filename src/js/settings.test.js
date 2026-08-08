import { describe, expect, it } from 'vitest'
import 'fake-indexeddb/auto'
import { getSettings, updateSettings, DEFAULT_SETTINGS, db } from './db.js'

// With the v2 upgrade seeding nothing, a missing settings row is the normal
// startup path for every existing user (fresh install, and every restore of a
// pre-v2 backup) - not a rare edge case, so it's covered directly here rather
// than only incidentally through other tests.

describe('settings', () => {
  it('getSettings returns defaults when no row exists', async () => {
    await db.settings.clear()
    const settings = await getSettings()
    expect(settings).toEqual(DEFAULT_SETTINGS)
  })

  it('getSettings normalizes an invalid stored value back to the default', async () => {
    await db.settings.put({ key: 'app', ingredientQtyAlign: 'centre' })
    const settings = await getSettings()
    expect(settings.ingredientQtyAlign).toBe(DEFAULT_SETTINGS.ingredientQtyAlign)
  })

  it('updateSettings succeeds when the row is absent, creating it', async () => {
    await db.settings.clear()
    const row = await updateSettings({ ingredientQtyAlign: 'left' })
    expect(row.ingredientQtyAlign).toBe('left')
    expect((await getSettings()).ingredientQtyAlign).toBe('left')
  })

  it('updateSettings returns exactly what it persisted', async () => {
    await db.settings.clear()
    const returned = await updateSettings({ ingredientQtyAlign: 'left' })
    const stored = await db.settings.get('app')
    expect(returned).toEqual(stored)
  })

  it('updateSettings preserves keys already on the row that the patch omits', async () => {
    await db.settings.clear()
    await updateSettings({ ingredientQtyAlign: 'left' })
    const row = await updateSettings({})
    expect(row.ingredientQtyAlign).toBe('left')
  })
})
