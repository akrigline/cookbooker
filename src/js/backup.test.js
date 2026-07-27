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
const { restoreDatabase, exportDatabase } = await import('./backup.js')
const { db } = await import('./db.js')

describe('restoreDatabase', () => {
  beforeEach(() => {
    importInto.mockReset()
  })

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
})
