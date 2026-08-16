<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { decompressPayload, parseRecipePayload } from '../js/qrShare'

const fragment = ref(window.location.hash.slice(1))
const copyLabel = ref('Copy to clipboard')
let copyResetTimer = null

function updateFragment() {
  fragment.value = window.location.hash.slice(1)
}

onMounted(() => window.addEventListener('hashchange', updateFragment))
onUnmounted(() => {
  window.removeEventListener('hashchange', updateFragment)
  clearTimeout(copyResetTimer)
})

const decoded = computed(() => (fragment.value ? decompressPayload(fragment.value) : null))

const state = computed(() => {
  if (!fragment.value) return 'empty'
  return decoded.value == null ? 'error' : 'result'
})

const parsed = computed(() => (decoded.value != null ? parseRecipePayload(decoded.value) : null))
const title = computed(() => parsed.value?.title || 'Untitled recipe')
const ingredients = computed(() => (parsed.value?.ingredients ?? []).filter((line) => line.length > 0))

async function copyToClipboard() {
  const text = [title.value, ...ingredients.value].join('\n')
  clearTimeout(copyResetTimer)
  try {
    await navigator.clipboard.writeText(text)
    copyLabel.value = 'Copied!'
    copyResetTimer = setTimeout(() => (copyLabel.value = 'Copy to clipboard'), 2000)
  } catch {
    copyLabel.value = "Couldn't copy — select the text manually"
    copyResetTimer = setTimeout(() => (copyLabel.value = 'Copy to clipboard'), 2500)
  }
}
</script>

<template>
  <main id="cm-main" class="cm-page-main cm-page-main--narrow">
    <div style="margin-bottom:28px;">
      <h1 class="text-page-title">Recipe QR Decoder</h1>
      <p style="margin:0; font-size:15px; color:var(--ink-46);">
        Decodes a recipe shared from Cookbooker — everything happens on this device; nothing is
        uploaded anywhere.
      </p>
    </div>

    <div v-if="state === 'empty'" class="cm-decode-notice">
      <p>No recipe code found.</p>
      <p>Scan a recipe QR code with your phone's camera to get started.</p>
    </div>

    <div v-else-if="state === 'error'" class="cm-decode-notice cm-decode-notice--error">
      <p>Invalid or corrupted recipe code.</p>
    </div>

    <section v-else class="card-section">
      <h2 class="text-h2">{{ title }}</h2>
      <ul v-if="ingredients.length" class="cm-decode-list">
        <li v-for="(line, i) in ingredients" :key="i">{{ line }}</li>
      </ul>
      <p v-else class="cm-decode-empty-ingredients">No ingredients were included in this code.</p>
      <button type="button" class="btn-secondary" @click="copyToClipboard">{{ copyLabel }}</button>
    </section>
  </main>
</template>

<style scoped>
.cm-decode-notice {
  border: 1px dashed var(--ink-78);
  border-radius: 14px;
  padding: 40px 32px;
  text-align: center;
  color: var(--ink-46);
}

.cm-decode-notice p {
  margin: 0 0 6px;
  font-size: 15px;
}

.cm-decode-notice p:last-child {
  margin-bottom: 0;
}

.cm-decode-notice--error {
  border-style: solid;
  border-color: var(--color-danger-border);
  background: var(--color-danger-bg);
  color: var(--color-danger);
}

.card-section {
  background: var(--ink-99);
  border: 1px solid var(--ink-88);
  border-radius: 14px;
  padding: 28px 32px;
}

.cm-decode-list {
  margin: 0 0 20px;
  padding-left: 20px;
}

.cm-decode-list li {
  margin-bottom: 8px;
  font-size: 15px;
  line-height: 1.5;
}

.cm-decode-empty-ingredients {
  margin: 0 0 20px;
  font-size: 14px;
  color: var(--ink-46);
}

.btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: var(--ink-93);
  color: var(--ink-20);
  border: 1px solid var(--ink-84);
  border-radius: 8px;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-secondary:hover {
  background: var(--ink-88);
}

.btn-secondary:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}
</style>
