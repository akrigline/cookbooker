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

  // Regression: normalizeSettings previously spread DEFAULT_SETTINGS
  // unconditionally, so a patch that never mentioned ingredientQtyAlign still
  // wrote the default into storage - erasing "never set" vs. "explicitly set
  // to the default" the moment a second setting existed.
  it('updateSettings does not materialize a default for a key the patch never mentioned', async () => {
    await db.settings.clear()
    await updateSettings({ someFutureSetting: 7 })
    const stored = await db.settings.get('app')
    expect(stored).not.toHaveProperty('ingredientQtyAlign')
    expect(stored.someFutureSetting).toBe(7)
  })

  it('getSettings returns the same shape whether or not a row exists (no leaked `key`)', async () => {
    await db.settings.clear()
    const withoutRow = await getSettings()
    expect(withoutRow).not.toHaveProperty('key')

    await updateSettings({ ingredientQtyAlign: 'left' })
    const withRow = await getSettings()
    expect(withRow).not.toHaveProperty('key')
    expect(Object.keys(withRow)).toEqual(Object.keys(withoutRow))
  })
})
