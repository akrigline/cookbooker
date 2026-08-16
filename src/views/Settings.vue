<script setup>
import { ref } from 'vue'
import {
  exportDatabase,
  restoreDatabase,
  inspectBackupFile,
  currentDatabaseCounts,
} from '../js/backup'
import { useRecipesStore } from '../stores/recipes'
import { useProjectsStore } from '../stores/projects'
import { useSettingsStore } from '../stores/settings'
import { INGREDIENT_QTY_ALIGN_OPTIONS } from '../js/templates'
import Modal from '../components/Modal.vue'

const recipesStore = useRecipesStore()
const projectsStore = useProjectsStore()
const settingsStore = useSettingsStore()

const progress = ref(null)
const error = ref(null)
const success = ref(null)
const fileInput = ref(null)

// Unawaited: this view doesn't gate its render on settings being loaded (the
// toggle just shows the in-flight default until this resolves), but a
// rejection still needs a home or it only reaches the console.
settingsStore.load().catch((err) => {
  error.value = `Could not load settings: ${err.message}`
})

// Restore wipes every table before writing, so it is gated behind an explicit
// confirmation that names what is at stake - the file's contents are already
// parsed for validation, so the counts cost nothing extra.
const pendingRestore = ref(null)

const TABLE_LABELS = {
  recipes: 'Recipes',
  projects: 'Cookbooks',
  chapters: 'Chapters',
  project_recipes: 'Recipe placements',
  settings: 'App settings',
}
const labelFor = (name) => TABLE_LABELS[name] ?? name

// Per CLAUDE.md: an un-caught store write only reaches the console, leaving
// the toggle looking like it worked. Routed into the same `error` banner the
// backup/restore actions below use.
async function setIngredientQtyAlign(value) {
  error.value = null
  try {
    await settingsStore.setIngredientQtyAlign(value)
  } catch (err) {
    error.value = `Could not save this setting: ${err.message}`
  }
}

// A restore runs two passes over the data - the pre-restore snapshot, then the
// import - so the row counter climbs, resets, and climbs again. backup.js tags
// each report with its phase; without the label the reset looks like a fault.
const PHASE_LABELS = {
  export: 'Exporting your data…',
  backup: 'Backing up current data…',
  restore: 'Restoring…',
}

function onProgress(prog) {
  // dexie-export-import reports `completedRows`/`totalRows`; `done` is a
  // boolean flag, not a count.
  progress.value = {
    done: prog.completedRows ?? 0,
    total: prog.totalRows ?? 0,
    label: PHASE_LABELS[prog.phase] ?? 'Working…',
  }
  return true
}

async function handleExport() {
  error.value = null
  success.value = null
  progress.value = { done: 0, total: 0, label: PHASE_LABELS.export }
  try {
    const blob = await exportDatabase(onProgress)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const date = new Date().toISOString().slice(0, 10)
    a.href = url
    a.download = `cookbook-backup-${date}.json`
    a.click()
    URL.revokeObjectURL(url)
    success.value = 'Backup downloaded.'
  } catch (err) {
    error.value = `Export failed: ${err.message}`
  } finally {
    progress.value = null
  }
}

function handleImportClick() {
  fileInput.value?.click()
}

async function handleFileChange(event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) return

  error.value = null
  success.value = null
  try {
    const [incoming, current] = await Promise.all([
      inspectBackupFile(file),
      currentDatabaseCounts(),
    ])
    const currentByName = new Map(current.tables.map((t) => [t.name, t.rowCount]))
    const incomingByName = new Map(incoming.tables.map((t) => [t.name, t.rowCount]))
    const names = [...new Set([...currentByName.keys(), ...incomingByName.keys()])]
    pendingRestore.value = {
      file,
      fileName: file.name,
      rows: names.map((name) => ({
        name,
        label: labelFor(name),
        current: currentByName.get(name) ?? 0,
        incoming: incomingByName.get(name) ?? 0,
      })),
      currentTotal: current.totalRows,
      incomingTotal: incoming.totalRows,
    }
  } catch (err) {
    error.value = `That file could not be read as a backup: ${err.message}. Your existing data was left untouched.`
  }
}

function cancelRestore() {
  pendingRestore.value = null
}

async function confirmRestore() {
  const file = pendingRestore.value?.file
  if (!file) return
  pendingRestore.value = null

  error.value = null
  success.value = null
  progress.value = { done: 0, total: 0, label: PHASE_LABELS.backup }
  try {
    await restoreDatabase(file, onProgress)
    await Promise.all([recipesStore.load(), projectsStore.load(), settingsStore.reload()])
    success.value = 'Backup restored.'
  } catch (err) {
    if (err.preRestoreSnapshot) {
      // The restore got far enough to clear existing tables before failing,
      // so download the pre-restore snapshot as a safety net.
      const url = URL.createObjectURL(err.preRestoreSnapshot)
      const a = document.createElement('a')
      const date = new Date().toISOString().slice(0, 10)
      a.href = url
      a.download = `cookbook-recovery-${date}.json`
      a.click()
      URL.revokeObjectURL(url)
      error.value = `Import failed: ${err.message}. The restore was interrupted partway through, so your previous data may have been partially cleared. A recovery backup from just before this restore was automatically downloaded (cookbook-recovery-${date}.json) - re-import it to get your previous data back.`
    } else {
      error.value = `Import failed: ${err.message}. The restore never started, so your existing data was left untouched.`
    }
  } finally {
    progress.value = null
  }
}
</script>

<template>
  <main id="cm-main" class="cm-page-main">
    <div style="margin-bottom:28px;">
      <h1 class="text-page-title">Settings</h1>
      <p style="margin:0; font-size:15px; color:var(--ink-46);">Manage your data, exports, and database backups.</p>
    </div>

    <section class="card-section" style="margin-bottom:24px;">
      <h2>Recipe defaults</h2>
      <p class="section-desc">
        Applies to every recipe across the app - the editor, print, and cookbook print. There is
        no per-recipe override.
      </p>

      <div role="group" aria-label="Ingredient quantity alignment" class="actions">
        <button
          v-for="opt in INGREDIENT_QTY_ALIGN_OPTIONS"
          :key="opt.id"
          type="button"
          class="btn-secondary"
          :aria-pressed="settingsStore.ingredientQtyAlign === opt.id"
          :style="settingsStore.ingredientQtyAlign === opt.id ? 'background:oklch(93% 0.02 250); border:1.5px solid var(--color-focus); color:var(--ink-20);' : ''"
          @click="setIngredientQtyAlign(opt.id)"
        >
          Ingredient quantities: {{ opt.label }}
        </button>
      </div>
    </section>

    <section class="card-section">
      <h2>Backup &amp; Restore</h2>
      <p class="section-desc">
        Export your complete library and cookbooks to a JSON file, or restore from a previous backup.
      </p>

      <div class="actions">
        <button type="button" class="btn-primary" :disabled="!!progress" @click="handleExport">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Export Backup
        </button>
        <button type="button" class="btn-secondary" :disabled="!!progress" @click="handleImportClick">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          Import Backup
        </button>
        <input
          ref="fileInput"
          type="file"
          accept="application/json"
          class="hidden-input"
          @change="handleFileChange"
        />
      </div>

      <p v-if="progress" class="status-msg" aria-live="polite">{{ progress.label }} {{ progress.done }}/{{ progress.total || '?' }}</p>
      <p v-if="success" class="status-msg success" aria-live="polite">{{ success }}</p>
      <p v-if="error" class="status-msg error" aria-live="assertive">{{ error }}</p>
    </section>

    <Modal
      v-if="pendingRestore"
      role="alertdialog"
      title-id="restore-confirm-title"
      @close="cancelRestore"
    >
      <h2 id="restore-confirm-title" class="modal-title">Replace all your data?</h2>
      <p class="modal-body">
        Restoring <strong>{{ pendingRestore.fileName }}</strong> erases everything currently
        in this library and replaces it with the contents of the backup. This cannot be undone.
      </p>

      <table class="restore-table">
        <thead>
          <tr>
            <th scope="col">Data</th>
            <th scope="col">Now</th>
            <th scope="col">After restore</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in pendingRestore.rows" :key="row.name">
            <th scope="row">{{ row.label }}</th>
            <td>{{ row.current }}</td>
            <td>{{ row.incoming }}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <th scope="row">Total records</th>
            <td>{{ pendingRestore.currentTotal }}</td>
            <td>{{ pendingRestore.incomingTotal }}</td>
          </tr>
        </tfoot>
      </table>

      <div class="modal-actions">
        <button type="button" class="btn-secondary" @click="cancelRestore">Cancel</button>
        <button type="button" class="btn-danger" @click="confirmRestore">
          Erase and restore
        </button>
      </div>
    </Modal>
  </main>
</template>

<style scoped>
.hidden-input {
  display: none;
}

.card-section {
  background: var(--ink-99);
  border: 1px solid var(--ink-88);
  border-radius: 14px;
  padding: 28px 32px;
  max-width: 680px;
}

.card-section h2 {
  font-family: 'Newsreader', Georgia, serif;
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 8px;
  color: var(--ink-20);
}

.section-desc {
  margin: 0 0 20px;
  font-size: 14px;
  color: var(--ink-46);
  line-height: 1.5;
}

.actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: var(--ink-20);
  color: var(--ink-99);
  border: none;
  border-radius: 8px;
  padding: 11px 20px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-primary:hover {
  background: var(--ink-30);
}

.btn-primary:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: none;
  color: var(--ink-20);
  border: 1px solid var(--ink-84);
  border-radius: 8px;
  padding: 11px 20px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-secondary:hover {
  background: var(--ink-93);
}

.btn-secondary:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}

.btn-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.status-msg {
  margin: 16px 0 0;
  font-size: 14px;
  color: var(--ink-46);
}

.error {
  color: var(--color-danger);
  font-weight: 600;
}

.success {
  color: var(--color-success);
  font-weight: 600;
}

.modal-title {
  font-family: 'Newsreader', Georgia, serif;
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 10px;
  color: var(--ink-20);
}

.modal-body {
  margin: 0 0 18px;
  font-size: 14px;
  line-height: 1.55;
  color: var(--ink-42);
}

.restore-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  margin-bottom: 22px;
}

.restore-table th,
.restore-table td {
  padding: 7px 10px;
  text-align: right;
  border-bottom: 1px solid var(--ink-93);
}

.restore-table thead th {
  font-size: 11px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--ink-52);
}

.restore-table th[scope='row'],
.restore-table thead th:first-child {
  text-align: left;
  font-weight: 600;
  color: var(--ink-30);
}

.restore-table tfoot th,
.restore-table tfoot td {
  border-bottom: none;
  border-top: 1px solid var(--ink-84);
  font-weight: 600;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.btn-danger {
  background: var(--color-danger);
  color: var(--ink-99);
  border: none;
  border-radius: 8px;
  padding: 11px 20px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-danger:hover {
  background: oklch(39% 0.14 25);
}

.btn-danger:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}
</style>
