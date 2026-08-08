import { describe, expect, it } from 'vitest'
import 'fake-indexeddb/auto'
import { exportDatabase, restoreDatabase, inspectBackupFile } from './backup.js'
import { addRecipe, getAllRecipes, db } from './db.js'

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
      layoutTemplate: 'hero-split-balanced',
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
      layoutTemplate: 'hero-split-balanced',
    })
    const blob = await exportDatabase()

    await addRecipe({
      title: 'Added after export',
      instructions: '',
      ingredients: [],
      image: null,
      notes: '',
      layoutTemplate: 'hero-split-balanced',
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
      layoutTemplate: 'hero-split-balanced',
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

  it('rejects a backup from a newer database version before clearing anything', async () => {
    await addRecipe({
      title: 'Should survive',
      instructions: '',
      ingredients: [],
      image: null,
      notes: '',
      layoutTemplate: 'hero-split-balanced',
    })
    const blob = await exportDatabase()
    const json = JSON.parse(await blob.text())
    json.data.databaseVersion = db.verno + 1
    const file = new File([JSON.stringify(json)], 'future-backup.json', { type: 'application/json' })

    await expect(inspectBackupFile(file)).rejects.toThrow(/newer version/)
    const titles = (await getAllRecipes()).map((r) => r.title)
    expect(titles).toContain('Should survive')
  })

  it('rejects a backup containing an unrecognized table before clearing anything', async () => {
    await addRecipe({
      title: 'Should also survive',
      instructions: '',
      ingredients: [],
      image: null,
      notes: '',
      layoutTemplate: 'hero-split-balanced',
    })
    const blob = await exportDatabase()
    const json = JSON.parse(await blob.text())
    json.data.tables.push({ name: 'a_table_from_the_future', schema: '++id', rowCount: 0 })
    const file = new File([JSON.stringify(json)], 'unknown-table-backup.json', { type: 'application/json' })

    await expect(inspectBackupFile(file)).rejects.toThrow(/doesn't understand/)
    const titles = (await getAllRecipes()).map((r) => r.title)
    expect(titles).toContain('Should also survive')
  })

  // Regression for the flag that actually does the work: without
  // `acceptVersionDiff: true` on the `importInto` call, dexie-export-import
  // throws "Database version differs" on a backup made by an older schema
  // (every backup exported before this table existed), and no other test in
  // this suite exercises that success path.
  it('restores a v1-shaped backup (older version, no settings table) via acceptVersionDiff', async () => {
    await addRecipe({
      title: 'From The Past',
      instructions: '',
      ingredients: [],
      image: null,
      notes: '',
      layoutTemplate: 'hero-split-balanced',
    })
    const blob = await exportDatabase()
    const json = JSON.parse(await blob.text())
    json.data.databaseVersion = 1
    json.data.tables = json.data.tables.filter((t) => t.name !== 'settings')
    json.data.data = json.data.data.filter((t) => t.tableName !== 'settings')
    const file = new File([JSON.stringify(json)], 'v1-backup.json', { type: 'application/json' })

    await addRecipe({
      title: 'Added after the "v1" export',
      instructions: '',
      ingredients: [],
      image: null,
      notes: '',
      layoutTemplate: 'hero-split-balanced',
    })

    await restoreDatabase(file)

    const titles = (await getAllRecipes()).map((r) => r.title)
    expect(titles).toContain('From The Past')
    expect(titles).not.toContain('Added after the "v1" export')
  })
})
