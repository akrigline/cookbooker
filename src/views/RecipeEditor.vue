<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useRecipesStore } from '../stores/recipes'
import { parseIngredientsText } from '../js/conversions'
import { exportRecipeToHtml } from '../js/recipeExport'
import { LAYOUT_TEMPLATES, DEFAULT_LAYOUT_TEMPLATE, INGREDIENT_COLUMN_OPTIONS, INGREDIENT_QTY_ALIGN_OPTIONS, DEFAULT_INGREDIENT_QTY_ALIGN, IMAGE_ASPECT_RATIOS } from '../js/templates'
import RecipeSheet from '../components/RecipeSheet.vue'
import PagePreview from '../components/PagePreview.vue'

const props = defineProps({
  recipeId: {
    type: String,
    default: null,
  },
})

const router = useRouter()
const recipesStore = useRecipesStore()

const isEditing = computed(() => props.recipeId != null)

const title = ref('Untitled Recipe')
const instructionsText = ref('')
const ingredientsText = ref('')
const notes = ref('')
const layoutTemplate = ref(DEFAULT_LAYOUT_TEMPLATE)
const ingredientColumns = ref(1)
const ingredientQtyAlign = ref(DEFAULT_INGREDIENT_QTY_ALIGN)
const imageAspectRatio = ref('auto')
const imageFile = ref(null)
const existingImage = ref(null)
const notesTextarea = ref(null)
const error = ref(null)
const showDeleteModal = ref(false)
const deleting = ref(false)
const saving = ref(false)

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
      ingredientQtyAlign.value = recipe.ingredientQtyAlign ?? DEFAULT_INGREDIENT_QTY_ALIGN
      imageAspectRatio.value = recipe.imageAspectRatio ?? 'auto'
      existingImage.value = recipe.image ?? null
    }
  } else {
    title.value = ''
  }
})

const parsedIngredients = computed(() => parseIngredientsText(ingredientsText.value))
const showImageAspectControl = computed(() => {
  const active = LAYOUT_TEMPLATES.find((tpl) => tpl.id === layoutTemplate.value)
  return active ? active.hasImage : true
})

const previewRecipe = computed(() => ({
  id: isEditing.value ? Number(props.recipeId) : Date.now(),
  title: title.value.trim() || 'Untitled Recipe',
  instructions: instructionsText.value,
  ingredients: parsedIngredients.value,
  notes: notes.value,
  layoutTemplate: layoutTemplate.value,
  ingredientColumns: ingredientColumns.value,
  ingredientQtyAlign: ingredientQtyAlign.value,
  imageAspectRatio: imageAspectRatio.value,
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
    router.push('/library')
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
    router.push('/library')
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

function handleCancel() {
  router.push('/library')
}
</script>

<template>
  <main id="cm-main" style="max-width:1280px; margin:0 auto; padding:32px 32px 100px;">
    <router-link to="/library" class="cm-back-link" style="display:inline-flex; align-items:center; gap:6px; font-size:14px; font-weight:600; text-decoration:none; margin-bottom:20px;">
      <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
      Back to Recipe Library
    </router-link>

    <div class="cm-grid" style="display:grid; grid-template-columns:minmax(320px, 360px) minmax(0, 1fr); gap:32px; align-items:start;">
      <div class="cm-edit-column" style="display:flex; flex-direction:column; gap:22px; min-width:0;">
        <p v-if="error" style="color:oklch(45% 0.14 25); font-weight:600; margin:0;">{{ error }}</p>

        <div>
          <label for="cm-title" style="display:block; font-size:12px; font-weight:600; color:oklch(50% 0.01 75); margin-bottom:6px;">Title <span aria-hidden="true" style="color:oklch(45% 0.05 25);">*</span></label>
          <input id="cm-title" v-model="title" type="text" required style="width:100%; box-sizing:border-box; font-family:'Newsreader',Georgia,serif; font-size:26px; font-weight:600; padding:10px 12px; border:1px solid oklch(85% 0.008 75); border-radius:8px; background:oklch(99.3% 0.002 75);" />
        </div>

        <div role="group" aria-label="Layout template">
          <p style="font-size:12px; font-weight:600; color:oklch(50% 0.01 75); margin:0 0 8px;">Layout template</p>
          <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(170px, 1fr)); gap:8px;">
            <button v-for="tpl in LAYOUT_TEMPLATES" :key="tpl.id" type="button" :aria-pressed="layoutTemplate === tpl.id" @click="layoutTemplate = tpl.id" :style="layoutTemplate === tpl.id ? 'background:oklch(93% 0.02 250); border:1.5px solid oklch(52% 0.16 250); color:oklch(20% 0.01 75);' : 'background:oklch(97% 0.004 75); border:1.5px solid oklch(85% 0.008 75); color:oklch(20% 0.01 75);'" style="text-align:left; padding:10px 12px; border-radius:8px; cursor:pointer; font-size:13px; font-weight:600;">
              {{ tpl.label }}
              <span style="display:block; font-weight:400; font-size:12px; color:oklch(45% 0.01 75); margin-top:2px;">{{ tpl.description || tpl.label }}</span>
            </button>
          </div>
        </div>

        <div role="group" aria-label="Ingredient columns">
          <p style="font-size:12px; font-weight:600; color:oklch(50% 0.01 75); margin:0 0 8px;">Ingredient columns</p>
          <div style="display:flex; gap:8px;">
            <button v-for="n in INGREDIENT_COLUMN_OPTIONS" :key="n" type="button" :aria-pressed="ingredientColumns === n" @click="ingredientColumns = n" :style="ingredientColumns === n ? 'background:oklch(93% 0.02 250); border:1.5px solid oklch(52% 0.16 250); color:oklch(20% 0.01 75);' : 'background:oklch(97% 0.004 75); border:1.5px solid oklch(85% 0.008 75); color:oklch(20% 0.01 75);'" style="flex:1; text-align:center; padding:10px 12px; border-radius:8px; cursor:pointer; font-size:13px; font-weight:600;">
              {{ n }}
            </button>
          </div>
        </div>

        <div role="group" aria-label="Ingredient quantity alignment">
          <p style="font-size:12px; font-weight:600; color:oklch(50% 0.01 75); margin:0 0 8px;">Ingredient quantity alignment</p>
          <div style="display:flex; gap:8px;">
            <button v-for="opt in INGREDIENT_QTY_ALIGN_OPTIONS" :key="opt.id" type="button" :aria-pressed="ingredientQtyAlign === opt.id" @click="ingredientQtyAlign = opt.id" :style="ingredientQtyAlign === opt.id ? 'background:oklch(93% 0.02 250); border:1.5px solid oklch(52% 0.16 250); color:oklch(20% 0.01 75);' : 'background:oklch(97% 0.004 75); border:1.5px solid oklch(85% 0.008 75); color:oklch(20% 0.01 75);'" style="flex:1; text-align:center; padding:10px 12px; border-radius:8px; cursor:pointer; font-size:13px; font-weight:600;">
              {{ opt.label }}
            </button>
          </div>
        </div>

        <div v-if="showImageAspectControl" role="group" aria-label="Image aspect ratio">
          <p style="font-size:12px; font-weight:600; color:oklch(50% 0.01 75); margin:0 0 8px;">Image aspect ratio</p>
          <div style="display:flex; gap:8px; flex-wrap:wrap;">
            <button v-for="ratio in IMAGE_ASPECT_RATIOS" :key="ratio.id" type="button" :aria-pressed="imageAspectRatio === ratio.id" @click="imageAspectRatio = ratio.id" :style="imageAspectRatio === ratio.id ? 'background:oklch(93% 0.02 250); border:1.5px solid oklch(52% 0.16 250); color:oklch(20% 0.01 75);' : 'background:oklch(97% 0.004 75); border:1.5px solid oklch(85% 0.008 75); color:oklch(20% 0.01 75);'" style="padding:10px 12px; border-radius:8px; cursor:pointer; font-size:13px; font-weight:600;">
              {{ ratio.label }}
            </button>
          </div>
        </div>

        <div>
          <label for="cm-ingredients" style="display:block; font-size:12px; font-weight:600; color:oklch(50% 0.01 75); margin-bottom:6px;">Ingredients <span aria-hidden="true" style="color:oklch(45% 0.05 25);">*</span></label>
          <p style="margin:0 0 8px; font-size:12px; color:oklch(55% 0.01 75);">One ingredient per line. Parsed and converted automatically.</p>
          <textarea id="cm-ingredients" v-model="ingredientsText" rows="8" style="width:100%; box-sizing:border-box; padding:10px 12px; font-size:14px; font-family:ui-monospace,monospace; border:1px solid oklch(85% 0.008 75); border-radius:8px; resize:vertical; background:oklch(99.3% 0.002 75);"></textarea>
        </div>

        <div>
          <label for="cm-instructions" style="display:block; font-size:12px; font-weight:600; color:oklch(50% 0.01 75); margin-bottom:6px;">Instructions <span aria-hidden="true" style="color:oklch(45% 0.05 25);">*</span></label>
          <p style="margin:0 0 8px; font-size:12px; color:oklch(55% 0.01 75);">One step per line.</p>
          <textarea id="cm-instructions" v-model="instructionsText" rows="8" style="width:100%; box-sizing:border-box; padding:10px 12px; font-size:14px; font-family:inherit; border:1px solid oklch(85% 0.008 75); border-radius:8px; resize:vertical; background:oklch(99.3% 0.002 75);"></textarea>
        </div>

        <div>
          <label for="cm-notes" style="display:block; font-size:12px; font-weight:600; color:oklch(50% 0.01 75); margin-bottom:6px;">Chef's Notes (optional)</label>
          <div style="display:flex; gap:6px; margin-bottom:8px;">
            <button type="button" aria-label="Bold selected text" @click="wrapNotesSelection('**')" style="width:32px; height:32px; font-weight:700; font-family:Georgia,serif; border:1px solid oklch(85% 0.008 75); border-radius:6px; background:oklch(99.3% 0.002 75); cursor:pointer;">B</button>
            <button type="button" aria-label="Italicize selected text" @click="wrapNotesSelection('*')" style="width:32px; height:32px; font-weight:600; font-style:italic; font-family:Georgia,serif; border:1px solid oklch(85% 0.008 75); border-radius:6px; background:oklch(99.3% 0.002 75); cursor:pointer;">I</button>
          </div>
          <textarea id="cm-notes" ref="notesTextarea" v-model="notes" rows="3" placeholder="Add optional notes… use the B/I buttons to add emphasis." style="width:100%; box-sizing:border-box; padding:10px 12px; font-size:14px; font-family:inherit; border:1px solid oklch(85% 0.008 75); border-radius:8px; resize:vertical; background:oklch(99.3% 0.002 75);"></textarea>
        </div>

        <div>
          <label style="display:block; font-size:12px; font-weight:600; color:oklch(50% 0.01 75); margin-bottom:6px;">Recipe Image (optional)</label>
          <div style="display:flex; align-items:center; gap:16px;">
            <input type="file" accept="image/*" @change="handleImageChange" style="font-size:14px;" />
          </div>
        </div>
      </div>

      <div class="cm-preview-column" style="position:sticky; top:24px; min-width:0;">
        <p class="cm-preview-label" style="margin:0 0 10px; font-size:12px; font-weight:600; color:oklch(50% 0.01 75); text-transform:uppercase; letter-spacing:0.04em;">Live preview</p>
        <PagePreview>
          <RecipeSheet :recipe="previewRecipe" />
        </PagePreview>
      </div>
    </div>

    <div class="cm-action-bar" style="display:flex; justify-content:space-between; align-items:center; gap:10px; margin-top:32px; padding-top:20px; border-top:1px solid oklch(88% 0.008 75); flex-wrap:wrap;">
      <div>
        <button v-if="isEditing" type="button" @click="showDeleteModal = true" style="padding:10px 16px; font-size:14px; font-weight:600; border-radius:8px; border:1px solid oklch(85% 0.06 25); background:none; color:oklch(45% 0.12 25); cursor:pointer;">Delete recipe</button>
      </div>
      <div style="display:flex; gap:10px;">
        <button v-if="isEditing" type="button" @click="handleExport" style="display:flex; align-items:center; gap:8px; padding:10px 16px; font-size:14px; font-weight:600; border-radius:8px; border:1px solid oklch(82% 0.008 75); background:none; cursor:pointer;">
          <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Export recipe
        </button>
        <button v-if="isEditing" type="button" @click="handlePrint" style="display:flex; align-items:center; gap:8px; padding:10px 16px; font-size:14px; font-weight:600; border-radius:8px; border:1px solid oklch(82% 0.008 75); background:none; cursor:pointer;">
          <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v8H6z"/></svg>
          Print recipe
        </button>
        <button type="button" @click="handleCancel" style="padding:10px 18px; font-size:14px; font-weight:600; border-radius:8px; border:1px solid oklch(82% 0.008 75); background:none; cursor:pointer;">Cancel</button>
        <button type="button" :disabled="saving" @click="save" :style="saving ? 'opacity:0.55; cursor:not-allowed;' : 'cursor:pointer;'" style="padding:10px 20px; font-size:14px; font-weight:600; border-radius:8px; border:none; background:oklch(20% 0.015 75); color:oklch(98% 0.004 75);">{{ saving ? 'Saving…' : 'Save' }}</button>
      </div>
    </div>

    <div v-if="showDeleteModal" @click="showDeleteModal = false" style="position:fixed; inset:0; background:oklch(20% 0.01 75 / 0.45); display:flex; align-items:center; justify-content:center; padding:24px; z-index:200;">
      <div role="alertdialog" aria-modal="true" aria-labelledby="cm-del-heading" aria-describedby="cm-del-desc" @click.stop style="background:oklch(99.3% 0.002 75); border-radius:14px; width:100%; max-width:420px; padding:26px 26px 22px; box-shadow:0 20px 60px oklch(20% 0.02 75 / 0.25);">
        <h2 id="cm-del-heading" style="font-family:'Newsreader',Georgia,serif; font-size:20px; font-weight:600; margin:0 0 10px;">Delete "{{ previewRecipe.title }}"?</h2>
        <p id="cm-del-desc" style="margin:0 0 22px; font-size:14px; color:oklch(40% 0.01 75); line-height:1.5;">This permanently removes the recipe from the Global Recipe Library and withdraws it from every cookbook that includes it. This can't be undone.</p>
        <div style="display:flex; justify-content:flex-end; gap:10px;">
          <button type="button" @click="showDeleteModal = false" style="padding:10px 18px; font-size:14px; font-weight:600; border-radius:8px; border:1px solid oklch(82% 0.008 75); background:none; cursor:pointer;">Cancel</button>
          <button type="button" @click="confirmDelete" :disabled="deleting" style="padding:10px 18px; font-size:14px; font-weight:600; border-radius:8px; border:none; background:oklch(45% 0.14 25); color:white; cursor:pointer;">Delete permanently</button>
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

input:focus, textarea:focus, button:focus-visible, a:focus-visible {
  outline: 2px solid oklch(52% 0.16 250);
  outline-offset: 1px;
  border-color: oklch(52% 0.16 250);
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
