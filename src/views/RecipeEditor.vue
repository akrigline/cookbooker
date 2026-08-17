<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useRecipesStore } from '../stores/recipes'
import { useSettingsStore } from '../stores/settings'
import { parseIngredientsText } from '../js/conversions'
import { exportRecipeToHtml } from '../js/recipeExport'
import {
  LAYOUT_TEMPLATES,
  DEFAULT_LAYOUT_TEMPLATE,
  INGREDIENT_COLUMN_OPTIONS,
  IMAGE_ASPECT_RATIOS,
  PLACEMENT_OPTIONS,
  DEFAULT_PLACEMENT,
} from '../js/templates'
import { computeReturnContext, returnContextBackTo } from '../js/returnContext'
import RecipeSheet from '../components/RecipeSheet.vue'
import PagePreview from '../components/PagePreview.vue'
import BackButton from '../components/BackButton.vue'

const props = defineProps({
  recipeId: {
    type: String,
    default: null,
  },
})

const router = useRouter()
const route = useRoute()
const recipesStore = useRecipesStore()
const settingsStore = useSettingsStore()
const pageSize = computed(() => settingsStore.pageSize)

const isEditing = computed(() => props.recipeId != null)

// Present when the editor was opened from a cookbook recipe preview's "Edit
// Recipe" button (see RecipePreviewDialog.vue / ProjectView.vue). Drives the
// back-button label and where "Cancel"/Save return to instead of the library.
const returnContext = computed(() => computeReturnContext(route.query))

const backLabel = computed(() => (returnContext.value ? 'Back to Cookbook' : 'Back to Recipe Library'))

const backTo = computed(() => returnContextBackTo(returnContext.value))

const title = ref('Untitled Recipe')
const instructionsText = ref('')
const ingredientsText = ref('')
const notes = ref('')
const layoutTemplate = ref(DEFAULT_LAYOUT_TEMPLATE)
const ingredientColumns = ref(1)
const imageAspectRatio = ref('auto')
const imagePlacement = ref(DEFAULT_PLACEMENT)
const notesPlacement = ref(DEFAULT_PLACEMENT)
const imageFile = ref(null)
const existingImage = ref(null)
const notesTextarea = ref(null)
const error = ref(null)
const showDeleteModal = ref(false)
const deleting = ref(false)
const saving = ref(false)
const loaded = ref(false)
const recipeNotFound = ref(false)
// Closed by default, including when editing a recipe that already has a
// legacy-tier layout selected - the disclosure is purely about not
// advertising the legacy templates, not about hiding the recipe's own
// current choice (that still shows as selected once expanded).
const showLegacyLayouts = ref(false)

const recommendedTemplates = computed(() => LAYOUT_TEMPLATES.filter((tpl) => tpl.tier === 'recommended'))
const legacyTemplates = computed(() => LAYOUT_TEMPLATES.filter((tpl) => tpl.tier === 'legacy'))

onMounted(async () => {
  if (!recipesStore.loaded) await recipesStore.load()
  if (isEditing.value) {
    const recipe = recipesStore.recipes.find((r) => r.id === Number(props.recipeId))
    if (recipe) {
      title.value = recipe.title ?? ''
      instructionsText.value = recipe.instructions ?? ''
      ingredientsText.value = (recipe.ingredients ?? []).map((i) => i.raw).join('\n')
      notes.value = recipe.notes ?? ''
      layoutTemplate.value = recipe.layoutTemplate ?? DEFAULT_LAYOUT_TEMPLATE
      ingredientColumns.value = recipe.ingredientColumns ?? 1
      imageAspectRatio.value = recipe.imageAspectRatio ?? 'auto'
      imagePlacement.value = recipe.imagePlacement ?? DEFAULT_PLACEMENT
      notesPlacement.value = recipe.notesPlacement ?? DEFAULT_PLACEMENT
      existingImage.value = recipe.image ?? null
    } else {
      recipeNotFound.value = true
    }
  } else {
    title.value = ''
  }
  loaded.value = true
})

const parsedIngredients = computed(() => parseIngredientsText(ingredientsText.value))
const activeLayoutTemplate = computed(() => LAYOUT_TEMPLATES.find((tpl) => tpl.id === layoutTemplate.value))
const showImageAspectControl = computed(() => (activeLayoutTemplate.value ? activeLayoutTemplate.value.hasImage : true))
const showPlacementControls = computed(() => Boolean(activeLayoutTemplate.value?.placementConfigurable))

const previewRecipe = computed(() => ({
  id: isEditing.value ? Number(props.recipeId) : Date.now(),
  title: title.value.trim() || 'Untitled Recipe',
  instructions: instructionsText.value,
  ingredients: parsedIngredients.value,
  notes: notes.value,
  layoutTemplate: layoutTemplate.value,
  ingredientColumns: ingredientColumns.value,
  imageAspectRatio: imageAspectRatio.value,
  imagePlacement: imagePlacement.value,
  notesPlacement: notesPlacement.value,
  image: imageFile.value ?? existingImage.value ?? null,
}))

function handleImageChange(event) {
  const file = event.target.files?.[0]
  if (!file) return
  imageFile.value = file
}

function wrapNotesSelection(marker) {
  const el = notesTextarea.value
  if (!el) return
  const start = el.selectionStart
  const end = el.selectionEnd
  const value = notes.value
  const selected = value.slice(start, end) || 'text'
  notes.value = value.slice(0, start) + marker + selected + marker + value.slice(end)
  requestAnimationFrame(() => {
    el.focus()
    el.setSelectionRange(start + marker.length, start + marker.length + selected.length)
  })
}

async function save() {
  if (saving.value) return
  error.value = null
  if (!title.value.trim()) {
    error.value = 'Title is required.'
    return
  }
  if (!instructionsText.value.trim()) {
    error.value = 'Instructions are required.'
    return
  }

  // Without this catch a rejected write (a structured-clone failure on a
  // reactive object, a row deleted in another tab) escapes as an unhandled
  // rejection: no error, no navigation, an apparently dead form.
  saving.value = true
  try {
    let id = props.recipeId ? Number(props.recipeId) : null
    if (isEditing.value) {
      await recipesStore.editRecipe(id, previewRecipe.value)
    } else {
      id = await recipesStore.createRecipe(previewRecipe.value)
    }
    router.push(backTo.value)
  } catch (err) {
    error.value = `Could not save this recipe: ${err.message}`
  } finally {
    saving.value = false
  }
}

async function confirmDelete() {
  if (!isEditing.value || deleting.value) return
  deleting.value = true
  try {
    await recipesStore.removeRecipe(Number(props.recipeId))
    router.push(returnContext.value ? `/projects/${returnContext.value.projectId}` : '/library')
  } catch (err) {
    error.value = `Could not delete this recipe: ${err.message}`
  } finally {
    deleting.value = false
    showDeleteModal.value = false
  }
}

function handlePrint() {
  window.print()
}

function slugify(text) {
  return (text || 'recipe').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

async function handleExport() {
  const html = await exportRecipeToHtml(previewRecipe.value)
  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${slugify(title.value)}.html`
  a.click()
  URL.revokeObjectURL(url)
}

</script>

<template>
  <main v-if="loaded && recipeNotFound" id="cm-main" class="cm-page-main cm-page-main--compact">
    <h1 class="text-page-title--compact">Recipe not found</h1>
    <p class="text-subtitle" style="margin:0 0 24px;">This recipe may have been deleted.</p>
    <router-link to="/library" class="btn-primary" style="display:inline-flex; align-items:center; background:var(--ink-20); color:var(--ink-99); border:none; border-radius:8px; padding:10px 20px; font-size:14px; font-weight:600; text-decoration:none;">
      Back to Recipe Library
    </router-link>
  </main>
  <main v-else id="cm-main" class="cm-page-main">
    <!-- Header row: back + title left, actions right -->
    <div class="cm-action-bar" style="display:flex; align-items:flex-end; justify-content:space-between; gap:16px; margin-bottom:28px; flex-wrap:wrap;">
      <div>
        <BackButton :to="backTo">{{ backLabel }}</BackButton>
        <h1 class="text-page-title" style="margin-top:4px;">{{ isEditing ? 'Edit Recipe' : 'New Recipe' }}</h1>
      </div>
      <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:center;">
        <p v-if="error" style="color:var(--color-danger); font-weight:600; margin:0;">{{ error }}</p>
        <button v-if="isEditing" type="button" @click="showDeleteModal = true" style="padding:12px 20px; font-size:15px; font-weight:600; border-radius:8px; border:1px solid var(--color-danger-border); background:none; color:oklch(45% 0.12 25); cursor:pointer;">Delete recipe</button>
        <button v-if="isEditing" type="button" @click="handleExport" style="display:flex; align-items:center; gap:8px; padding:12px 20px; font-size:15px; font-weight:600; border-radius:8px; border:1px solid var(--ink-84); background:none; cursor:pointer;">
          <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Export recipe
        </button>
        <button v-if="isEditing" type="button" @click="handlePrint" style="display:flex; align-items:center; gap:8px; padding:12px 20px; font-size:15px; font-weight:600; border-radius:8px; border:1px solid var(--ink-84); background:none; cursor:pointer;">
          <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v8H6z"/></svg>
          Print recipe
        </button>
        <button type="button" :disabled="saving" @click="save" :style="saving ? 'opacity:0.55; cursor:not-allowed;' : 'cursor:pointer;'" style="padding:12px 20px; font-size:15px; font-weight:600; border-radius:8px; border:none; background:var(--ink-20); color:var(--ink-99);">{{ saving ? 'Saving…' : 'Save' }}</button>
      </div>
    </div>

    <div class="cm-grid" style="display:grid; grid-template-columns:minmax(320px, 360px) minmax(0, 1fr); gap:32px; align-items:start;">
      <div class="cm-edit-column" style="display:flex; flex-direction:column; gap:22px; min-width:0;">

        <div>
          <label for="cm-title" style="display:block; font-size:12px; font-weight:600; color:var(--ink-52); margin-bottom:6px;">Title <span aria-hidden="true" style="color:oklch(45% 0.05 25);">*</span></label>
          <input id="cm-title" v-model="title" type="text" required style="width:100%; box-sizing:border-box; font-family:'Newsreader',Georgia,serif; font-size:26px; font-weight:600; padding:10px 12px; border:1px solid var(--ink-84); border-radius:8px; background:var(--ink-99);" />
        </div>

        <div role="group" aria-label="Layout template">
          <p style="font-size:12px; font-weight:600; color:var(--ink-52); margin:0 0 8px;">Layout template</p>
          <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(140px, 1fr)); gap:12px;">
            <button
              v-for="tpl in recommendedTemplates"
              :key="tpl.id"
              type="button"
              :aria-pressed="layoutTemplate === tpl.id"
              class="cm-layout-card"
              :class="{ 'cm-layout-card--active': layoutTemplate === tpl.id }"
              @click="layoutTemplate = tpl.id"
            >
              <!-- eslint-disable-next-line vue/no-v-html -->
              <span class="cm-layout-card__thumb" v-html="tpl.thumbnail"></span>
              <span class="cm-layout-card__label">{{ tpl.label }}</span>
            </button>
          </div>

          <hr class="cm-layout-separator" />

          <button
            type="button"
            class="cm-legacy-toggle"
            :aria-expanded="showLegacyLayouts"
            @click="showLegacyLayouts = !showLegacyLayouts"
          >
            {{ showLegacyLayouts ? 'Hide more layouts' : 'Show more layouts' }}
          </button>

          <div v-if="showLegacyLayouts" style="display:grid; grid-template-columns:repeat(auto-fill, minmax(170px, 1fr)); gap:8px; margin-top:10px;">
            <button v-for="tpl in legacyTemplates" :key="tpl.id" type="button" :aria-pressed="layoutTemplate === tpl.id" @click="layoutTemplate = tpl.id" :style="layoutTemplate === tpl.id ? 'background:oklch(93% 0.02 250); border:1.5px solid var(--color-focus); color:var(--ink-20);' : 'background:var(--ink-96); border:1.5px solid var(--ink-84); color:var(--ink-20);'" style="text-align:left; padding:10px 12px; border-radius:8px; cursor:pointer; font-size:13px; font-weight:600;">
              {{ tpl.label }}
              <span style="display:block; font-weight:400; font-size:12px; color:var(--ink-46); margin-top:2px;">{{ tpl.description || tpl.label }}</span>
            </button>
          </div>
        </div>

        <div v-if="showPlacementControls" role="group" aria-label="Image placement">
          <p style="font-size:12px; font-weight:600; color:var(--ink-52); margin:0 0 8px;">Image placement</p>
          <div style="display:flex; gap:8px; flex-wrap:wrap;">
            <button v-for="opt in PLACEMENT_OPTIONS" :key="opt.id" type="button" :aria-pressed="imagePlacement === opt.id" @click="imagePlacement = opt.id" :style="imagePlacement === opt.id ? 'background:oklch(93% 0.02 250); border:1.5px solid var(--color-focus); color:var(--ink-20);' : 'background:var(--ink-96); border:1.5px solid var(--ink-84); color:var(--ink-20);'" style="padding:10px 12px; border-radius:8px; cursor:pointer; font-size:13px; font-weight:600;">
              {{ opt.label }}
            </button>
          </div>
        </div>

        <div v-if="showPlacementControls" role="group" aria-label="Chef's Notes placement">
          <p style="font-size:12px; font-weight:600; color:var(--ink-52); margin:0 0 8px;">Chef's Notes placement</p>
          <div style="display:flex; gap:8px; flex-wrap:wrap;">
            <button v-for="opt in PLACEMENT_OPTIONS" :key="opt.id" type="button" :aria-pressed="notesPlacement === opt.id" @click="notesPlacement = opt.id" :style="notesPlacement === opt.id ? 'background:oklch(93% 0.02 250); border:1.5px solid var(--color-focus); color:var(--ink-20);' : 'background:var(--ink-96); border:1.5px solid var(--ink-84); color:var(--ink-20);'" style="padding:10px 12px; border-radius:8px; cursor:pointer; font-size:13px; font-weight:600;">
              {{ opt.label }}
            </button>
          </div>
        </div>

        <div role="group" aria-label="Ingredient columns">
          <p style="font-size:12px; font-weight:600; color:var(--ink-52); margin:0 0 8px;">Ingredient columns</p>
          <div style="display:flex; gap:8px;">
            <button v-for="n in INGREDIENT_COLUMN_OPTIONS" :key="n" type="button" :aria-pressed="ingredientColumns === n" @click="ingredientColumns = n" :style="ingredientColumns === n ? 'background:oklch(93% 0.02 250); border:1.5px solid var(--color-focus); color:var(--ink-20);' : 'background:var(--ink-96); border:1.5px solid var(--ink-84); color:var(--ink-20);'" style="flex:1; text-align:center; padding:10px 12px; border-radius:8px; cursor:pointer; font-size:13px; font-weight:600;">
              {{ n }}
            </button>
          </div>
        </div>


        <div>
          <label for="cm-ingredients" style="display:block; font-size:12px; font-weight:600; color:var(--ink-52); margin-bottom:6px;">Ingredients <span aria-hidden="true" style="color:oklch(45% 0.05 25);">*</span></label>
          <p style="margin:0 0 8px; font-size:12px; color:var(--ink-52);">One ingredient per line. Parsed and converted automatically.</p>
          <textarea id="cm-ingredients" v-model="ingredientsText" rows="8" style="width:100%; box-sizing:border-box; padding:10px 12px; font-size:14px; font-family:ui-monospace,monospace; border:1px solid var(--ink-84); border-radius:8px; resize:vertical; background:var(--ink-99);"></textarea>
        </div>

        <div>
          <label for="cm-instructions" style="display:block; font-size:12px; font-weight:600; color:var(--ink-52); margin-bottom:6px;">Instructions <span aria-hidden="true" style="color:oklch(45% 0.05 25);">*</span></label>
          <p style="margin:0 0 8px; font-size:12px; color:var(--ink-52);">One step per line.</p>
          <textarea id="cm-instructions" v-model="instructionsText" rows="8" style="width:100%; box-sizing:border-box; padding:10px 12px; font-size:14px; font-family:inherit; border:1px solid var(--ink-84); border-radius:8px; resize:vertical; background:var(--ink-99);"></textarea>
        </div>

        <div>
          <label for="cm-notes" style="display:block; font-size:12px; font-weight:600; color:var(--ink-52); margin-bottom:6px;">Chef's Notes (optional)</label>
          <div style="display:flex; gap:6px; margin-bottom:8px;">
            <button type="button" aria-label="Bold selected text" @click="wrapNotesSelection('**')" style="width:32px; height:32px; font-weight:700; font-family:Georgia,serif; border:1px solid var(--ink-84); border-radius:6px; background:var(--ink-99); cursor:pointer;">B</button>
            <button type="button" aria-label="Italicize selected text" @click="wrapNotesSelection('*')" style="width:32px; height:32px; font-weight:600; font-style:italic; font-family:Georgia,serif; border:1px solid var(--ink-84); border-radius:6px; background:var(--ink-99); cursor:pointer;">I</button>
          </div>
          <textarea id="cm-notes" ref="notesTextarea" v-model="notes" rows="3" placeholder="Add optional notes… use the B/I buttons to add emphasis." style="width:100%; box-sizing:border-box; padding:10px 12px; font-size:14px; font-family:inherit; border:1px solid var(--ink-84); border-radius:8px; resize:vertical; background:var(--ink-99);"></textarea>
        </div>

        <div>
          <label for="cm-image" style="display:block; font-size:12px; font-weight:600; color:var(--ink-52); margin-bottom:6px;">Recipe Image (optional)</label>
          <div style="display:flex; align-items:center; gap:16px;">
            <input id="cm-image" type="file" accept="image/*" @change="handleImageChange" style="font-size:14px;" />
          </div>
          <div v-if="showImageAspectControl" role="group" aria-label="Image aspect ratio" style="margin-top:12px;">
            <p style="font-size:12px; font-weight:600; color:var(--ink-52); margin:0 0 8px;">Image aspect ratio</p>
            <div style="display:flex; gap:8px; flex-wrap:wrap;">
              <button v-for="ratio in IMAGE_ASPECT_RATIOS" :key="ratio.id" type="button" :aria-pressed="imageAspectRatio === ratio.id" @click="imageAspectRatio = ratio.id" :style="imageAspectRatio === ratio.id ? 'background:oklch(93% 0.02 250); border:1.5px solid var(--color-focus); color:var(--ink-20);' : 'background:var(--ink-96); border:1.5px solid var(--ink-84); color:var(--ink-20);'" style="padding:10px 12px; border-radius:8px; cursor:pointer; font-size:13px; font-weight:600;">
                {{ ratio.label }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="cm-preview-column" style="position:sticky; top:24px; min-width:0;">
        <p class="cm-preview-label" style="margin:0 0 10px; font-size:12px; font-weight:600; color:var(--ink-52); text-transform:uppercase; letter-spacing:0.04em;">Live preview</p>
        <PagePreview :paper-size="pageSize">
          <RecipeSheet :recipe="previewRecipe" />
        </PagePreview>
      </div>
    </div>


    <div v-if="showDeleteModal" @click="showDeleteModal = false" style="position:fixed; inset:0; background:oklch(10% 0.01 75 / 0.45); display:flex; align-items:center; justify-content:center; padding:24px; z-index:200;">
      <div role="alertdialog" aria-modal="true" aria-labelledby="cm-del-heading" aria-describedby="cm-del-desc" @click.stop style="background:var(--ink-99); border-radius:14px; width:100%; max-width:420px; padding:26px 26px 22px; box-shadow:0 20px 60px oklch(10% 0.01 75 / 0.25);">
        <h2 id="cm-del-heading" class="text-h2">Delete "{{ previewRecipe.title }}"?</h2>
        <p id="cm-del-desc" style="margin:0 0 22px; font-size:14px; color:var(--ink-42); line-height:1.5;">This permanently removes the recipe from the Global Recipe Library and withdraws it from every cookbook that includes it. This can't be undone.</p>
        <div style="display:flex; justify-content:flex-end; gap:10px;">
          <button type="button" @click="showDeleteModal = false" style="padding:10px 20px; font-size:14px; font-weight:600; border-radius:8px; border:1px solid var(--ink-84); background:var(--ink-93); cursor:pointer;">Cancel</button>
          <button type="button" @click="confirmDelete" :disabled="deleting" style="padding:10px 20px; font-size:14px; font-weight:600; border-radius:8px; border:none; background:var(--color-danger); color:white; cursor:pointer;">Delete permanently</button>
        </div>
      </div>
    </div>

    </main>
</template>

<style scoped>
.cm-preview-column :deep(.page-preview) {
  margin-left: 0;
  margin-right: 0;
}

.cm-layout-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px;
  border-radius: 10px;
  border: 1.5px solid var(--ink-84);
  background: var(--ink-96);
  color: var(--ink-20);
  cursor: pointer;
}

.cm-layout-card--active {
  border-color: var(--color-focus);
  background: oklch(93% 0.02 250);
}

.cm-layout-card__thumb {
  display: block;
  width: 100%;
}

.cm-layout-card__thumb :deep(svg) {
  width: 100%;
  height: auto;
  display: block;
}

.cm-layout-card__thumb :deep(.thumb-title) {
  fill: var(--ink-46);
}

.cm-layout-card__thumb :deep(.thumb-notes) {
  fill: var(--ink-88);
  stroke: var(--ink-80);
  stroke-width: 1;
}

.cm-layout-card__thumb :deep(.thumb-ingredients),
.cm-layout-card__thumb :deep(.thumb-instructions) {
  fill: var(--ink-93);
}

.cm-layout-card__thumb :deep(.thumb-qr) {
  fill: var(--ink-80);
}

.cm-layout-card__label {
  font-size: 13px;
  font-weight: 600;
}

.cm-layout-separator {
  margin: 16px 0 12px;
  border: none;
  border-top: 1px solid var(--ink-84);
}

.cm-legacy-toggle {
  margin-top: 0;
  padding: 0;
  border: none;
  background: none;
  color: var(--ink-46);
  font-size: 12px;
  font-weight: 600;
  text-decoration: underline;
  cursor: pointer;
}

input:focus, textarea:focus, button:focus-visible, a:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 1px;
  border-color: var(--color-focus);
}
button:hover, a:hover {
  filter: brightness(0.95);
}
@media print {
  .cm-app-chrome, .cm-edit-column, .cm-preview-label, .cm-action-bar, .cm-back-link { display: none !important; }
  main { max-width: none !important; padding: 0 !important; margin: 0 !important; }
  .cm-grid { display: block !important; }
}
</style>
