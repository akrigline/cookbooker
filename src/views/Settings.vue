<script setup>
import { ref } from 'vue'
import { exportDatabase, restoreDatabase } from '../js/backup'
import { useRecipesStore } from '../stores/recipes'
import { useProjectsStore } from '../stores/projects'

const recipesStore = useRecipesStore()
const projectsStore = useProjectsStore()

const progress = ref(null)
const error = ref(null)
const success = ref(null)
const fileInput = ref(null)

function onProgress(prog) {
  progress.value = prog
  return true
}

async function handleExport() {
  error.value = null
  success.value = null
  progress.value = { done: 0, total: 0 }
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
  progress.value = { done: 0, total: 0 }
  try {
    await restoreDatabase(file, onProgress)
    await Promise.all([recipesStore.load(), projectsStore.load()])
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
  <main id="cm-main" style="max-width:1280px; margin:0 auto; padding:40px 32px 80px;">
    <div style="margin-bottom:28px;">
      <h1 style="font-family:'Newsreader',Georgia,serif; font-size:34px; font-weight:600; margin:0 0 6px; letter-spacing:-0.01em;">Settings</h1>
      <p style="margin:0; font-size:15px; color:oklch(45% 0.01 75);">Manage your data, exports, and database backups.</p>
    </div>

    <section class="card-section">
      <h2>Backup &amp; Restore</h2>
      <p class="section-desc">
        Export your complete library and cookbooks to a JSON file, or restore from a previous backup.
      </p>

      <div class="actions">
        <button type="button" class="btn-primary" :disabled="!!progress" @click="handleExport">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y3="3"/></svg>
          Export Backup
        </button>
        <button type="button" class="btn-secondary" :disabled="!!progress" @click="handleImportClick">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y3="15"/></svg>
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

      <p v-if="progress" class="status-msg" aria-live="polite">Working... {{ progress.done }}/{{ progress.total || '?' }}</p>
      <p v-if="success" class="status-msg success" aria-live="polite">{{ success }}</p>
      <p v-if="error" class="status-msg error" aria-live="assertive">{{ error }}</p>
    </section>
  </main>
</template>

<style scoped>
.hidden-input {
  display: none;
}

.card-section {
  background: oklch(99.2% 0.002 75);
  border: 1px solid oklch(88% 0.008 75);
  border-radius: 14px;
  padding: 28px 32px;
  max-width: 680px;
}

.card-section h2 {
  font-family: 'Newsreader', Georgia, serif;
  font-size: 22px;
  font-weight: 600;
  margin: 0 0 8px;
  color: oklch(20% 0.015 75);
}

.section-desc {
  margin: 0 0 20px;
  font-size: 14px;
  color: oklch(45% 0.01 75);
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
  background: oklch(20% 0.015 75);
  color: oklch(98% 0.004 75);
  border: none;
  border-radius: 8px;
  padding: 11px 20px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-primary:hover {
  background: oklch(28% 0.02 75);
}

.btn-primary:focus-visible {
  outline: 2px solid oklch(52% 0.16 250);
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
  color: oklch(20% 0.015 75);
  border: 1px solid oklch(82% 0.008 75);
  border-radius: 8px;
  padding: 11px 20px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-secondary:hover {
  background: oklch(94% 0.006 75);
}

.btn-secondary:focus-visible {
  outline: 2px solid oklch(52% 0.16 250);
  outline-offset: 2px;
}

.btn-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.status-msg {
  margin: 16px 0 0;
  font-size: 14px;
  color: oklch(45% 0.01 75);
}

.error {
  color: oklch(45% 0.14 25);
  font-weight: 600;
}

.success {
  color: oklch(40% 0.12 145);
  font-weight: 600;
}
</style>
