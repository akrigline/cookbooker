<script setup>
import { computed, markRaw, ref } from 'vue'
import { useRecipesStore } from '../stores/recipes'
import { parseRecipeImportHtml } from '../js/recipeImport'
import { RECIPE_IMPORT_PROMPT } from '../js/recipeImportPrompt'
import RecipeSheet from '../components/RecipeSheet.vue'
import PagePreview from '../components/PagePreview.vue'

const recipesStore = useRecipesStore()

const fileInput = ref(null)
const mode = ref('file') // 'file' | 'paste'
const pastedHtml = ref('')
const candidates = ref([]) // [{ key, recipe, included }]
const failures = ref([]) // [{ key, label, reason }]
const rejectedSources = ref([]) // file names / "Pasted HTML" with no valid markers
const error = ref(null)
const success = ref(null)
const importing = ref(false)
const promptCopied = ref(false)
const promptExpanded = ref(false)

let nextKey = 0

const includedCount = computed(() => candidates.value.filter((c) => c.included).length)
const hasResults = computed(
  () => candidates.value.length > 0 || failures.value.length > 0 || rejectedSources.value.length > 0,
)

const isInputStage = computed(() => candidates.value.length === 0 && failures.value.length === 0 && rejectedSources.value.length === 0)
const isReviewStage = computed(() => !isInputStage.value)

function handleImportClick() {
  fileInput.value?.click()
}

function resetResults() {
  error.value = null
  success.value = null
  candidates.value = []
  failures.value = []
  rejectedSources.value = []
}

function processImportSource(text, sourceLabel) {
  const result = parseRecipeImportHtml(text)
  if (result.rejected) {
    rejectedSources.value.push(sourceLabel)
    return
  }

  for (const recipe of result.recipes) {
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
    success.value = `Import complete - ${toImport.length} recipe${toImport.length === 1 ? '' : 's'} added to the Global Recipe Library.`
    candidates.value = []
    failures.value = []
    rejectedSources.value = []
  } finally {
    importing.value = false
  }
}

function handleCancelReview() {
  resetResults()
  pastedHtml.value = ''
}
</script>

<template>
  <main id="cm-main" style="max-width:840px; margin:0 auto; padding:40px 32px 100px;">
    <router-link to="/library" style="display:inline-flex; align-items:center; gap:6px; font-size:14px; font-weight:600; text-decoration:none; margin-bottom:18px;">
      <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
      Back to Recipe Library
    </router-link>

    <div v-if="success" style="margin-bottom:20px; padding:12px; background:oklch(96% 0.05 140); color:oklch(35% 0.05 140); border:1px solid oklch(85% 0.1 140); border-radius:8px;">
      {{ success }}
    </div>

    <template v-if="isInputStage">
      <h1 style="font-family:'Newsreader',Georgia,serif; font-size:32px; font-weight:600; margin:0 0 8px; letter-spacing:-0.01em;">Import Recipes</h1>
      <p style="margin:0 0 32px; font-size:15px; color:oklch(45% 0.01 75); line-height:1.5;">Bring in recipes transcribed elsewhere (Drive docs, PDFs, bookmarked pages, screenshots) using the structured recipe/1 HTML format. Nothing is added to your library until you review and confirm.</p>

      <section aria-labelledby="cm-file-heading" style="background:oklch(99.2% 0.002 75); border:1px solid oklch(88% 0.008 75); border-radius:14px; padding:24px; margin-bottom:20px;">
        <h2 id="cm-file-heading" style="font-family:'Newsreader',Georgia,serif; font-size:19px; font-weight:600; margin:0 0 6px;">Select a file</h2>
        <p style="margin:0 0 16px; font-size:14px; color:oklch(45% 0.01 75);">Choose an .html file containing one or more recipe/1 elements.</p>
        <label for="cm-file-input" style="position:absolute; width:1px; height:1px; overflow:hidden; clip:rect(0 0 0 0);">Select recipe HTML file or files</label>
        <input id="cm-file-input" ref="fileInput" type="file" accept=".html,.htm,text/html" multiple @change="handleFileChange" style="font-size:14px;" />
        <p style="margin:10px 0 0; font-size:12px; color:oklch(50% 0.01 75);">You can select multiple files at once — each may contain one or more recipes.</p>
      </section>

      <section aria-labelledby="cm-prompt-heading" style="background:oklch(99.2% 0.002 75); border:1px solid oklch(88% 0.008 75); border-radius:14px; padding:24px; margin-bottom:20px;">
        <h2 id="cm-prompt-heading" style="font-family:'Newsreader',Georgia,serif; font-size:19px; font-weight:600; margin:0 0 6px;">Need to transcribe a recipe first?</h2>
        <p style="margin:0 0 14px; font-size:14px; color:oklch(45% 0.01 75); line-height:1.5;">Copy this prompt and give it to an LLM along with a recipe (text, a photo, a screenshot) to get back HTML in the recipe/1 format this importer expects.</p>
        <textarea id="cm-prompt-text" readonly :value="RECIPE_IMPORT_PROMPT" rows="6" style="width:100%; box-sizing:border-box; padding:12px 14px; font-size:12px; font-family:ui-monospace,monospace; color:oklch(35% 0.01 75); border:1px solid oklch(85% 0.008 75); border-radius:8px; background:oklch(96% 0.004 75); resize:vertical;"></textarea>
        <div style="display:flex; justify-content:flex-end; margin-top:12px;">
          <button type="button" @click="copyPrompt" class="btn-secondary">
            <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1"/></svg>
            {{ promptCopied ? 'Copied!' : 'Copy prompt' }}
          </button>
        </div>
      </section>

      <section aria-labelledby="cm-paste-heading" style="background:oklch(99.2% 0.002 75); border:1px solid oklch(88% 0.008 75); border-radius:14px; padding:24px;">
        <h2 id="cm-paste-heading" style="font-family:'Newsreader',Georgia,serif; font-size:19px; font-weight:600; margin:0 0 6px;">Or paste HTML</h2>
        <p style="margin:0 0 12px; font-size:14px; color:oklch(45% 0.01 75);">Paste recipe/1 HTML text directly.</p>
        <textarea id="cm-paste-area" v-model="pastedHtml" rows="8" placeholder="<div data-cm-format=&quot;recipe&quot; data-cm-version=&quot;1&quot;>…</div>" style="width:100%; box-sizing:border-box; padding:12px 14px; font-size:13px; font-family:ui-monospace,monospace; border:1px solid oklch(80% 0.01 75); border-radius:8px; resize:vertical;"></textarea>
        <div style="display:flex; justify-content:flex-end; margin-top:12px;">
          <button type="button" @click="handlePasteImport" class="btn-primary">
            Parse pasted text
          </button>
        </div>
      </section>

      <p v-if="error" role="alert" style="margin:18px 0 0; font-size:14px; color:oklch(45% 0.14 25); background:oklch(96% 0.03 25); border:1px solid oklch(85% 0.06 25); border-radius:8px; padding:12px 16px;">{{ error }}</p>
    </template>

    <template v-if="isReviewStage">
      <h1 tabindex="-1" style="font-family:'Newsreader',Georgia,serif; font-size:32px; font-weight:600; margin:0 0 8px; letter-spacing:-0.01em; outline:none;">Review Import</h1>
      <p style="margin:0 0 28px; font-size:15px; color:oklch(45% 0.01 75);">
        {{ candidates.length }} recipe{{ candidates.length === 1 ? '' : 's' }} parsed successfully. Review below and confirm to add them to your library.
      </p>

      <section v-if="candidates.length">
        <h2 style="font-family:'Newsreader',Georgia,serif; font-size:18px; font-weight:600; margin:0 0 12px;">Ready to import</h2>
        <div style="display:flex; flex-direction:column; gap:20px; margin-bottom:32px;">
          <div v-for="c in candidates" :key="c.key" style="background:oklch(99.5% 0.002 75); border:1px solid oklch(88% 0.008 75); border-radius:12px; overflow:hidden; box-shadow:0 1px 3px oklch(20% 0.02 75 / 0.06);">
            <div style="display:flex; align-items:center; gap:10px; padding:14px 20px; background:oklch(97% 0.005 75); border-bottom:1px solid oklch(90% 0.008 75);">
              <input type="checkbox" :id="`cm-inc-${c.key}`" v-model="c.included" style="width:19px; height:19px; flex-shrink:0; accent-color:oklch(45% 0.14 250);" />
              <label :for="`cm-inc-${c.key}`" style="font-size:13px; font-weight:600; cursor:pointer;">Include "{{ c.recipe.title }}"</label>
            </div>
            <div style="padding: 20px;">
              <PagePreview>
                <RecipeSheet :recipe="c.recipe" />
              </PagePreview>
            </div>
          </div>
        </div>
      </section>

      <section v-if="failures.length || rejectedSources.length">
        <h2 style="font-family:'Newsreader',Georgia,serif; font-size:18px; font-weight:600; margin:0 0 12px;">Couldn't be imported</h2>
        <div style="display:flex; flex-direction:column; gap:10px; margin-bottom:32px;">
          <div v-for="f in failures" :key="f.key" style="background:oklch(97% 0.02 25); border:1px solid oklch(88% 0.05 25); border-radius:10px; padding:14px 18px;">
            <p style="margin:0 0 4px; font-size:14px; font-weight:600;">{{ f.label }}</p>
            <p style="margin:0; font-size:13px; color:oklch(40% 0.08 25);">{{ f.reason }}</p>
          </div>
          <div v-for="source in rejectedSources" :key="source" style="background:oklch(97% 0.02 25); border:1px solid oklch(88% 0.05 25); border-radius:10px; padding:14px 18px;">
            <p style="margin:0 0 4px; font-size:14px; font-weight:600;">{{ source }}</p>
            <p style="margin:0; font-size:13px; color:oklch(40% 0.08 25);">Missing the data-cm-format="recipe" marker.</p>
          </div>
        </div>
      </section>

      <div style="display:flex; justify-content:flex-end; gap:10px; padding-top:8px; border-top:1px solid oklch(88% 0.008 75); flex-wrap:wrap;">
        <button type="button" @click="handleCancelReview" class="btn-cancel">Cancel</button>
        <button type="button" @click="confirmImport" :disabled="!includedCount || importing" class="btn-primary" :style="{ opacity: !includedCount ? 0.5 : 1, cursor: !includedCount ? 'not-allowed' : 'pointer' }">
          {{ importing ? 'Importing…' : `Import ${includedCount} recipe${includedCount === 1 ? '' : 's'}` }}
        </button>
      </div>
    </template>
  </main>
</template>

<style scoped>
.btn-secondary {
  display:flex; align-items:center; gap:8px; background:none; color:oklch(20% 0.015 75); border:1px solid oklch(82% 0.008 75); border-radius:8px; padding:10px 16px; font-size:14px; font-weight:600; cursor:pointer;
}
.btn-secondary:hover { background:oklch(94% 0.006 75); }
.btn-secondary:focus-visible { outline:2px solid oklch(52% 0.16 250); outline-offset:2px; }

.btn-primary {
  background:oklch(20% 0.015 75); color:oklch(98% 0.004 75); border:none; border-radius:8px; padding:11px 20px; font-size:14px; font-weight:600; cursor:pointer;
}
.btn-primary:hover { background:oklch(28% 0.02 75); }
.btn-primary:focus-visible { outline:2px solid oklch(52% 0.16 250); outline-offset:2px; }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-cancel {
  padding:11px 20px; font-size:14px; font-weight:600; border-radius:8px; border:1px solid oklch(82% 0.008 75); background:none; cursor:pointer;
}
.btn-cancel:hover { background:oklch(94% 0.006 75); }
.btn-cancel:focus-visible { outline:2px solid oklch(52% 0.16 250); outline-offset:2px; }
</style>

