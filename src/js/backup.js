import { exportDB, importInto, peakImportFile } from 'dexie-export-import'
import { db } from './db'

/**
 * Tags each progress report with the phase producing it. A restore makes two
 * passes over the data with one callback between them, so without this the
 * caller's row counter climbs to N, resets to 0, and climbs to M with nothing
 * to explain the reset. The callback's own return value is passed straight
 * through - dexie-export-import uses it to decide whether to keep going.
 */
const taggedProgress = (progressCallback, phase) =>
  progressCallback ? (progress) => progressCallback({ ...progress, phase }) : undefined

export async function exportDatabase(progressCallback) {
  return exportDB(db, { progressCallback: taggedProgress(progressCallback, 'export') })
}

/**
 * Parses a backup file's header without importing anything, so a caller can
 * show what a restore would replace before the destructive write happens.
 * Throws on invalid/corrupt input, exactly as `restoreDatabase` would.
 */
export async function inspectBackupFile(file) {
  const meta = await peakImportFile(file)
  // peakImportFile resolves for any parseable JSON - it returns whatever it
  // found rather than rejecting on a file that isn't a Dexie export - so the
  // header is checked here, while nothing destructive has happened yet.
  if (meta?.formatName !== 'dexie' || !Array.isArray(meta?.data?.tables)) {
    throw new Error('this is not a Dexie database backup file')
  }
  // A backup from a NEWER app version can carry tables this build has no
  // schema for. dexie-export-import's `acceptMissingTables` does NOT cover
  // that: db.table() throws InvalidTableError first, and it throws AFTER
  // clearTablesBeforeImport has already wiped the live tables. Reject here,
  // before restoreDatabase takes its pre-restore snapshot, while nothing
  // destructive has happened.
  if (meta.data.databaseVersion > db.verno) {
    throw new Error(
      `this backup was made by a newer version of Cookbooker (database v${meta.data.databaseVersion}, ` +
        `this app uses v${db.verno}). Reload to get the latest version, then try again`,
    )
  }
  const known = new Set(db.tables.map((t) => t.name))
  const unknown = meta.data.tables.filter((t) => !known.has(t.name)).map((t) => t.name)
  if (unknown.length) {
    throw new Error(`this backup contains data this version doesn't understand (${unknown.join(', ')})`)
  }
  const tables = meta.data.tables.map((t) => ({
    name: t.name,
    rowCount: t.rowCount ?? 0,
  }))
  return {
    databaseName: meta.data.databaseName,
    tables,
    totalRows: tables.reduce((sum, t) => sum + t.rowCount, 0),
  }
}

/** Row counts for the live database, in the same shape as `inspectBackupFile`. */
export async function currentDatabaseCounts() {
  const tables = await Promise.all(
    db.tables.map(async (table) => ({ name: table.name, rowCount: await table.count() })),
  )
  return { tables, totalRows: tables.reduce((sum, t) => sum + t.rowCount, 0) }
}

export async function restoreDatabase(file, progressCallback) {
  // Validate the file before any destructive write - throws on invalid/corrupt
  // input, including JSON that parses but isn't a Dexie export.
  await inspectBackupFile(file)

  // `clearTablesBeforeImport` wipes every table before writing the new data,
  // so a failure partway through the import can leave the DB neither in the
  // old nor the new state. Snapshot the pre-restore data first so a failed
  // restore is still recoverable instead of silently losing it - attached to
  // the thrown error so the caller can offer it to the user.
  // The snapshot reports progress too: on a large DB it is the slower of the
  // two phases, and without this the caller's progress indicator sits frozen
  // through all of it. Each phase is tagged so the caller can label which one
  // the counter belongs to.
  const preRestoreSnapshot = await exportDB(db, {
    progressCallback: taggedProgress(progressCallback, 'backup'),
  })

  try {
    await importInto(db, file, {
      clearTablesBeforeImport: true,
      overwriteValues: true,
      // Needed so an older-shaped backup (e.g. pre-settings-table) restores
      // instead of throwing on "Database version differs". Deliberately NOT
      // paired with `acceptMissingTables`: that flag guards the wrong
      // direction (an export table absent from the live db, not the
      // reverse), is unreachable dead code in dexie-export-import, and its
      // failure path runs after clearTablesBeforeImport has already
      // committed. The forward-incompatible case it would have covered is
      // instead rejected up front by inspectBackupFile's gate above.
      acceptVersionDiff: true,
      progressCallback: taggedProgress(progressCallback, 'restore'),
    })
  } catch (err) {
    err.preRestoreSnapshot = preRestoreSnapshot
    throw err
  }
}
