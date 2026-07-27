<script setup>
import { ref } from 'vue'
import { exportDatabase, restoreDatabase } from '../js/backup'
import { useRecipesStore } from '../stores/recipes'
import { useProjectsStore } from '../stores/projects'

const recipesStore = useRecipesStore()
const projectsStore = useProjectsStore()

const progress = ref(null)
const error = ref(null)
const fileInput = ref(null)

function onProgress(prog) {
  progress.value = prog
  return true
}

async function handleExport() {
  error.value = null
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
  progress.value = { done: 0, total: 0 }
  try {
    await restoreDatabase(file, onProgress)
    await Promise.all([recipesStore.load(), projectsStore.load()])
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
  <div class="view">
    <h1>Settings</h1>

    <section class="backup">
      <h2>Backup &amp; Restore</h2>
      <div class="actions">
        <button type="button" class="primary" :disabled="!!progress" @click="handleExport">Export Backup</button>
        <button type="button" class="primary" :disabled="!!progress" @click="handleImportClick">Import Backup</button>
        <input
          ref="fileInput"
          type="file"
          accept="application/json"
          class="hidden-input"
          @change="handleFileChange"
        />
      </div>

      <p v-if="progress">Working... {{ progress.done }}/{{ progress.total || '?' }}</p>
      <p v-if="error" class="error">{{ error }}</p>
    </section>
  </div>
</template>

<style scoped>
.hidden-input {
  display: none;
}

.actions {
  display: flex;
  gap: var(--space-sm);
}

button.primary {
  background: var(--accent-color);
  color: white;
  border: none;
  padding: var(--space-sm) var(--space-md);
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
}

button.primary:hover {
  background: var(--accent-color-hover);
}

button.primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error {
  color: var(--color-danger);
}
</style>
