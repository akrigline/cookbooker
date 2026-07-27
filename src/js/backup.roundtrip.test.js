import { describe, expect, it } from 'vitest'
import 'fake-indexeddb/auto'
import { exportDatabase, restoreDatabase } from './backup.js'
import { addRecipe, getAllRecipes } from './db.js'

// Follows the same fake-indexeddb-per-file precedent as db.test.js: each test
// file gets its own isolated module registry, so the shared `db` singleton
// starts fresh here too.
//
// Kept separate from backup.test.js, which mocks `dexie-export-import`'s
// `importInto` at module scope to test the pre-restore-snapshot regression -
// these tests need the real import/export implementation to actually round-trip.

describe('backup.js', () => {
  it('exportDatabase returns a Blob containing the current data', async () => {
    await addRecipe({
      title: 'Export Test',
      instructions: '',
      ingredients: [],
      image: null,
      notes: '',
      layoutTemplate: 'standard',
    })

    const blob = await exportDatabase()
    expect(blob).toBeInstanceOf(Blob)
    const text = await blob.text()
    expect(text).toContain('Export Test')
  })

  it('restoreDatabase replaces existing data with the imported backup', async () => {
    await addRecipe({
      title: 'Original',
      instructions: '',
      ingredients: [],
      image: null,
      notes: '',
      layoutTemplate: 'standard',
    })
    const blob = await exportDatabase()

    await addRecipe({
      title: 'Added after export',
      instructions: '',
      ingredients: [],
      image: null,
      notes: '',
      layoutTemplate: 'standard',
    })

    const file = new File([blob], 'backup.json', { type: 'application/json' })
    await restoreDatabase(file)

    const titles = (await getAllRecipes()).map((r) => r.title)
    expect(titles).toContain('Original')
    expect(titles).not.toContain('Added after export')
  })

  it('restoreDatabase reports progress via the given callback', async () => {
    await addRecipe({
      title: 'Progress Test',
      instructions: '',
      ingredients: [],
      image: null,
      notes: '',
      layoutTemplate: 'standard',
    })
    const blob = await exportDatabase()
    const file = new File([blob], 'backup.json', { type: 'application/json' })

    let called = false
    await restoreDatabase(file, () => {
      called = true
      return true
    })

    expect(called).toBe(true)
  })
})
