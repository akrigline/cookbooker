import { describe, expect, it, vi, beforeEach } from 'vitest'
import 'fake-indexeddb/auto'

// Regression coverage for a prior bug: `restoreDatabase` used
// `clearTablesBeforeImport: true`, so a mid-import failure could leave the DB
// with tables cleared and only partial data restored - yet the caller had no
// way to know that happened, since the thrown error carried no signal that a
// destructive clear had already occurred. The fix snapshots the pre-restore
// data and attaches it to the thrown error so a failed restore is still
// recoverable, and callers can give an accurate error message.
vi.mock('dexie-export-import', async (importOriginal) => {
  const actual = await importOriginal()
  return { ...actual, importInto: vi.fn() }
})

const { importInto } = await import('dexie-export-import')
const { restoreDatabase, exportDatabase, inspectBackupFile, currentDatabaseCounts } =
  await import('./backup.js')
const { db } = await import('./db.js')

beforeEach(() => {
  importInto.mockReset()
})

describe('restoreDatabase', () => {
  it('attaches a pre-restore snapshot to the error when the import fails mid-stream', async () => {
    await db.recipes.add({ title: 'Should not be lost' })
    const file = await exportDatabase()

    importInto.mockRejectedValueOnce(new Error('mid-stream failure'))

    let caught
    try {
      await restoreDatabase(file)
    } catch (err) {
      caught = err
    }

    expect(caught).toBeDefined()
    expect(caught.message).toBe('mid-stream failure')
    expect(caught.preRestoreSnapshot).toBeInstanceOf(Blob)
    const snapshotText = await caught.preRestoreSnapshot.text()
    expect(snapshotText).toContain('Should not be lost')
  })

  // A restore is two passes over the data - snapshot, then import - sharing one
  // progress callback, so the row counter climbs to N, resets, and climbs to M.
  // Each pass tags its reports so the caller can label which one is running.
  it('tags progress reports with the phase they belong to', async () => {
    await db.recipes.add({ title: 'Phase check' })
    const file = await exportDatabase()
    importInto.mockImplementation(async (_db, _file, { progressCallback }) => {
      progressCallback({ totalRows: 1, completedRows: 1, done: true })
    })

    const phases = []
    await restoreDatabase(file, (prog) => {
      phases.push(prog.phase)
      return true
    })

    expect(new Set(phases)).toEqual(new Set(['backup', 'restore']))
    expect(phases.indexOf('backup')).toBeLessThan(phases.indexOf('restore'))
  })

  it('tags an export with its own phase', async () => {
    const phases = []
    await exportDatabase((prog) => {
      phases.push(prog.phase)
      return true
    })

    expect(phases.length).toBeGreaterThan(0)
    expect(new Set(phases)).toEqual(new Set(['export']))
  })
})

// Restore clears every table before writing, so the UI confirms first. These
// two helpers supply what that confirmation shows.
describe('backup inspection', () => {
  it('reports per-table row counts for a backup file without importing it', async () => {
    await db.recipes.clear()
    await db.recipes.bulkAdd([{ title: 'One' }, { title: 'Two' }])
    const file = await exportDatabase()

    const incoming = await inspectBackupFile(file)

    expect(incoming.tables.find((t) => t.name === 'recipes').rowCount).toBe(2)
    expect(incoming.totalRows).toBeGreaterThanOrEqual(2)
    expect(importInto).not.toHaveBeenCalled()
  })

  it('rejects a file that is not a Dexie backup, before anything destructive runs', async () => {
    const bogus = new Blob(['{"not":"a backup"}'], { type: 'application/json' })

    await expect(inspectBackupFile(bogus)).rejects.toThrow()
    expect(importInto).not.toHaveBeenCalled()
  })

  it('reports the live row counts in the same shape', async () => {
    await db.recipes.clear()
    await db.recipes.add({ title: 'Only one' })

    const current = await currentDatabaseCounts()

    expect(current.tables.find((t) => t.name === 'recipes').rowCount).toBe(1)
    expect(current.tables.map((t) => t.name)).toEqual(
      expect.arrayContaining(['recipes', 'projects', 'chapters', 'project_recipes']),
    )
  })
})
