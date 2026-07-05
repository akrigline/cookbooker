import { exportDB, importInto, peakImportFile } from 'dexie-export-import'
import { db } from './db'

export async function exportDatabase(progressCallback) {
  return exportDB(db, { progressCallback })
}

export async function restoreDatabase(file, progressCallback) {
  // Validate the file before any destructive write - throws on invalid/corrupt input.
  await peakImportFile(file)
  await importInto(db, file, {
    clearTablesBeforeImport: true,
    overwriteValues: true,
    progressCallback,
  })
}
