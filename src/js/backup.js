import { exportDB, importInto, peakImportFile } from 'dexie-export-import'
import { db } from './db'

export async function exportDatabase(progressCallback) {
  return exportDB(db, { progressCallback })
}

export async function restoreDatabase(file, progressCallback) {
  // Validate the file before any destructive write - throws on invalid/corrupt input.
  await peakImportFile(file)

  // `clearTablesBeforeImport` wipes every table before writing the new data,
  // so a failure partway through the import can leave the DB neither in the
  // old nor the new state. Snapshot the pre-restore data first so a failed
  // restore is still recoverable instead of silently losing it - attached to
  // the thrown error so the caller can offer it to the user.
  const preRestoreSnapshot = await exportDB(db)

  try {
    await importInto(db, file, {
      clearTablesBeforeImport: true,
      overwriteValues: true,
      progressCallback,
    })
  } catch (err) {
    err.preRestoreSnapshot = preRestoreSnapshot
    throw err
  }
}
