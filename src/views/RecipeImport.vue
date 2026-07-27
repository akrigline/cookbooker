<script setup>
import { computed, markRaw, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useRecipesStore } from '../stores/recipes'
import { parseRecipeImportHtml } from '../js/recipeImport'
import { RECIPE_IMPORT_PROMPT } from '../js/recipeImportPrompt'
import RecipeSheet from '../components/RecipeSheet.vue'
import PagePreview from '../components/PagePreview.vue'

const router = useRouter()
const recipesStore = useRecipesStore()

const fileInput = ref(null)
const mode = ref('file') // 'file' | 'paste'
const pastedHtml = ref('')
const candidates = ref([]) // [{ key, recipe, included }]
const failures = ref([]) // [{ key, label, reason }]
const rejectedSources = ref([]) // file names / "Pasted HTML" with no valid markers
const error = ref(null)
const importing = ref(false)
const promptCopied = ref(false)
const promptExpanded = ref(false)

let nextKey = 0

const includedCount = computed(() => candidates.value.filter((c) => c.included).length)
const hasResults = computed(
  () => candidates.value.length > 0 || failures.value.length > 0 || rejectedSources.value.length > 0,
)

function handleImportClick() {
  fileInput.value?.click()
}

function resetResults() {
  error.value = null
  candidates.value = []
  failures.value = []
  rejectedSources.value = []
}

// Shared by the file and paste entry points: both funnel a raw HTML string
// through this same parse/stage step so there is only one validation and
// review code path.
function processImportSource(text, sourceLabel) {
  const result = parseRecipeImportHtml(text)
  if (result.rejected) {
    rejectedSources.value.push(sourceLabel)
    return
  }

  for (const recipe of result.recipes) {
    // markRaw: the parsed recipe (including its ingredients array) must
    // reach Dexie's IndexedDB `add()` as plain objects - Vue's reactive
    // Proxy wrapper fails IndexedDB's structured-clone check.
    candidates.value.push({ key: nextKey++, recipe: markRaw(recipe), included: true })
  }
  for (const failure of result.failures) {
    failures.value.push({ key: nextKey++, label: `${sourceLabel}: ${failure.label}`, reason: failure.reason })
  }
}

async function handleFileChange(event) {
  const files = [...(event.target.files ?? [])]
  event.target.value = ''
  if (!files.length) return

  resetResults()

  for (const file of files) {
    let text
    try {
      text = await file.text()
    } catch (err) {
      error.value = `Could not read "${file.name}": ${err.message}`
      continue
    }

    processImportSource(text, file.name)
  }
}

function handlePasteImport() {
  const text = pastedHtml.value.trim()
  if (!text) {
    error.value = 'Paste some HTML text first.'
    return
  }

  resetResults()
  processImportSource(text, 'Pasted HTML')
}

async function copyPrompt() {
  try {
    await navigator.clipboard.writeText(RECIPE_IMPORT_PROMPT)
    promptCopied.value = true
    setTimeout(() => {
      promptCopied.value = false
    }, 2000)
  } catch {
    // Clipboard access can be denied by the browser; the prompt text is
    // still visible on screen for manual copy.
  }
}

async function confirmImport() {
  const toImport = candidates.value.filter((c) => c.included)
  if (!toImport.length) return

  importing.value = true
  try {
    for (const { recipe } of toImport) {
      await recipesStore.createRecipe(recipe)
    }
    router.push('/library')
  } finally {
    importing.value = false
  }
}
</script>

<template>
  <div class="view recipe-import">
    <div class="toolbar">
      <h1>Import Recipes</h1>
      <router-link to="/library">Back to Library</router-link>
    </div>

    <section class="prompt-help">
      <button type="button" class="link" @click="promptExpanded = !promptExpanded">
        {{ promptExpanded ? 'Hide' : 'Show' }} the LLM transcription prompt
      </button>
      <div v-if="promptExpanded" class="prompt-block">
        <p class="hint">
          Paste this into an LLM chat (ChatGPT, Claude, Gemini, etc.), then attach or
          paste your messy recipe source material. Then either save the model's HTML
          output as a <code>.html</code> file and select it below, or paste the HTML
          output directly.
        </p>
        <div class="prompt-actions">
          <button type="button" @click="copyPrompt">{{ promptCopied ? 'Copied!' : 'Copy prompt' }}</button>
        </div>
        <pre class="prompt-text">{{ RECIPE_IMPORT_PROMPT }}</pre>
      </div>
    </section>

    <div class="mode-toggle" role="tablist">
      <button
        type="button"
        role="tab"
        :aria-selected="mode === 'file'"
        :class="['mode-toggle__btn', { active: mode === 'file' }]"
        @click="mode = 'file'"
      >
        Upload file
      </button>
      <button
        type="button"
        role="tab"
        :aria-selected="mode === 'paste'"
        :class="['mode-toggle__btn', { active: mode === 'paste' }]"
        @click="mode = 'paste'"
      >
        Paste HTML
      </button>
    </div>

    <section v-if="mode === 'file'" class="upload">
      <button type="button" class="primary" @click="handleImportClick">Select Recipe File(s)</button>
      <input
        ref="fileInput"
        type="file"
        accept=".html,text/html"
        multiple
        class="hidden-input"
        @change="handleFileChange"
      />
    </section>

    <section v-else class="paste">
      <textarea
        v-model="pastedHtml"
        class="paste-textarea"
        rows="10"
        placeholder="Paste the LLM's HTML output here…"
      ></textarea>
      <div class="paste-actions">
        <button type="button" class="primary" @click="handlePasteImport">Parse Pasted HTML</button>
      </div>
    </section>

    <p v-if="error" class="error">{{ error }}</p>

    <section v-if="rejectedSources.length" class="rejected">
      <h2>Not recognized</h2>
      <ul>
        <li v-for="name in rejectedSources" :key="name">
          "{{ name }}" doesn't look like a cookbook-maker recipe import (missing the
          <code>data-cm-format="recipe"</code> marker). It was not imported.
        </li>
      </ul>
    </section>

    <section v-if="failures.length" class="failures">
      <h2>Recipes that couldn't be imported</h2>
      <ul>
        <li v-for="f in failures" :key="f.key">
          <strong>{{ f.label }}</strong>: {{ f.reason }}
        </li>
      </ul>
    </section>

    <section v-if="candidates.length" class="review">
      <h2>Review recipes to import ({{ includedCount }} of {{ candidates.length }} selected)</h2>
      <div v-for="c in candidates" :key="c.key" class="review-card">
        <label class="review-card__toggle">
          <input v-model="c.included" type="checkbox" />
          <span>Include "{{ c.recipe.title }}"</span>
        </label>
        <PagePreview>
          <RecipeSheet :recipe="c.recipe" />
        </PagePreview>
      </div>
    </section>

    <div v-if="candidates.length" class="actions">
      <button type="button" class="primary" :disabled="!includedCount || importing" @click="confirmImport">
        {{ importing ? 'Importing…' : `Import ${includedCount} recipe${includedCount === 1 ? '' : 's'}` }}
      </button>
    </div>

    <p v-if="!hasResults" class="empty">
      Select one or more <code>.html</code> recipe files, or paste HTML text, to get started.
    </p>
  </div>
</template>

<style scoped>
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-md);
}

.hidden-input {
  display: none;
}

.prompt-help {
  margin-bottom: var(--space-lg);
}

.link {
  background: none;
  border: none;
  color: var(--accent-color);
  text-decoration: underline;
  cursor: pointer;
  padding: 0;
  font: inherit;
}

.prompt-block {
  margin-top: var(--space-sm);
  padding: var(--space-md);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--bg-secondary);
}

.hint {
  color: var(--text-secondary);
  font-style: italic;
}

.prompt-actions {
  margin-bottom: var(--space-sm);
}

.prompt-text {
  white-space: pre-wrap;
  font-size: 0.85rem;
  max-height: 20rem;
  overflow-y: auto;
  padding: var(--space-sm);
  background: var(--bg-primary);
  border-radius: 4px;
}

.mode-toggle {
  display: flex;
  gap: var(--space-xs);
  margin-bottom: var(--space-md);
}

.mode-toggle__btn {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  color: var(--text-secondary);
  padding: var(--space-xs) var(--space-md);
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
}

.mode-toggle__btn.active {
  background: var(--accent-color);
  border-color: var(--accent-color);
  color: white;
}

.upload,
.paste {
  margin-bottom: var(--space-lg);
}

.paste-textarea {
  width: 100%;
  font-family: monospace;
  font-size: 0.85rem;
  padding: var(--space-sm);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--bg-primary);
  color: inherit;
  resize: vertical;
  box-sizing: border-box;
}

.paste-actions {
  margin-top: var(--space-sm);
}

button.primary {
  background: var(--accent-color);
  color: white;
  border: none;
  padding: var(--space-sm) var(--space-lg);
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

.rejected,
.failures {
  margin-bottom: var(--space-lg);
}

.rejected h2,
.failures h2 {
  font-size: 1rem;
  color: var(--color-danger);
}

.review-card {
  margin-bottom: var(--space-lg);
}

.review-card__toggle {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  font-weight: 600;
  margin-bottom: var(--space-sm);
}

.actions {
  margin-top: var(--space-md);
}

.empty {
  color: var(--text-secondary);
}
</style>
