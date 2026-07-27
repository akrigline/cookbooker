<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useRecipesStore } from '../stores/recipes'
import { parseIngredientsText, formatIngredientLine } from '../js/conversions'
import { renderChefNotes } from '../js/richtext'
import { LAYOUT_TEMPLATES } from '../js/templates'
import { useObjectUrl } from '../js/useObjectUrl'

const props = defineProps({
  recipeId: {
    type: String,
    default: null,
  },
})

const router = useRouter()
const recipesStore = useRecipesStore()

const isEditing = computed(() => props.recipeId != null)

const title = ref('')
const instructionsText = ref('')
const ingredientsText = ref('')
const notes = ref('')
const layoutTemplate = ref('standard')
const imageFile = ref(null)
const existingImage = ref(null)
const notesTextarea = ref(null)
const error = ref(null)

const imagePreviewSource = computed(() => imageFile.value ?? existingImage.value)
const imagePreviewUrl = useObjectUrl(imagePreviewSource)

onMounted(async () => {
  if (!recipesStore.loaded) await recipesStore.load()
  if (isEditing.value) {
    const recipe = recipesStore.recipes.find((r) => r.id === Number(props.recipeId))
    if (recipe) {
      title.value = recipe.title ?? ''
      instructionsText.value = recipe.instructions ?? ''
      ingredientsText.value = (recipe.ingredients ?? []).map((i) => i.raw).join('\n')
      notes.value = recipe.notes ?? ''
      layoutTemplate.value = recipe.layoutTemplate ?? 'standard'
      existingImage.value = recipe.image ?? null
    }
  }
})

const parsedIngredients = computed(() => parseIngredientsText(ingredientsText.value))

function handleImageChange(event) {
  const file = event.target.files?.[0]
  if (!file) return
  imageFile.value = file
}

function clearImage() {
  imageFile.value = null
  existingImage.value = null
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
  error.value = null
  if (!title.value.trim()) {
    error.value = 'Title is required.'
    return
  }
  if (!instructionsText.value.trim()) {
    error.value = 'Instructions are required.'
    return
  }

  const recipe = {
    title: title.value.trim(),
    instructions: instructionsText.value,
    ingredients: parsedIngredients.value,
    notes: notes.value,
    layoutTemplate: layoutTemplate.value,
    image: imageFile.value ?? existingImage.value ?? null,
  }

  let id = props.recipeId ? Number(props.recipeId) : null
  if (isEditing.value) {
    await recipesStore.editRecipe(id, recipe)
  } else {
    id = await recipesStore.createRecipe(recipe)
  }
  router.push(`/library/${id}`)
}
</script>

<template>
  <div class="view recipe-editor">
    <h1>{{ isEditing ? 'Edit Recipe' : 'New Recipe' }}</h1>

    <p v-if="error" class="error">{{ error }}</p>

    <label class="field">
      <span>Title</span>
      <input v-model="title" type="text" placeholder="Grandma's Apple Pie" />
    </label>

    <label class="field">
      <span>Instructions</span>
      <span class="hint">One step per line - steps are numbered automatically.</span>
      <textarea
        v-model="instructionsText"
        rows="8"
        placeholder="Preheat oven to 375F&#10;Mix dry ingredients..."
      />
    </label>

    <div class="field">
      <span>Ingredients</span>
      <div class="ingredients-grid">
        <textarea
          v-model="ingredientsText"
          rows="10"
          placeholder="1 1/2 cups all-purpose flour&#10;1 cup butter&#10;2 tsp vanilla extract"
        />
        <ul class="ingredients-preview">
          <li v-if="!parsedIngredients.length" class="hint">
            Parsed ingredients will appear here as you type.
          </li>
          <li v-for="(ing, idx) in parsedIngredients" :key="idx">
            {{ formatIngredientLine(ing) }}
          </li>
        </ul>
      </div>
    </div>

    <label class="field">
      <span>Layout Template</span>
      <select v-model="layoutTemplate">
        <option v-for="tpl in LAYOUT_TEMPLATES" :key="tpl.id" :value="tpl.id">
          {{ tpl.label }}
        </option>
      </select>
    </label>

    <div class="field">
      <span>Recipe Image (optional)</span>
      <div class="image-row">
        <div class="image-preview" :class="{ empty: !imagePreviewUrl }">
          <img v-if="imagePreviewUrl" :src="imagePreviewUrl" alt="" />
        </div>
        <div class="image-actions">
          <input type="file" accept="image/*" @change="handleImageChange" />
          <button v-if="imagePreviewUrl" type="button" @click="clearImage">Remove image</button>
        </div>
      </div>
    </div>

    <div class="field">
      <span>Chef's Notes (optional)</span>
      <div class="notes-toolbar">
        <button type="button" title="Bold" @click="wrapNotesSelection('**')"><strong>B</strong></button>
        <button type="button" title="Italic" @click="wrapNotesSelection('*')"><em>I</em></button>
      </div>
      <textarea ref="notesTextarea" v-model="notes" rows="4" placeholder="A little **tip** or *story* about this recipe" />
      <div class="notes-preview" v-html="renderChefNotes(notes)" />
    </div>

    <div class="actions">
      <button type="button" class="primary" @click="save">Save Recipe</button>
    </div>
  </div>
</template>

<style scoped>
.field {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  margin-bottom: var(--space-lg);
}

.field > span {
  font-weight: 600;
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.field > span.hint {
  font-weight: 400;
  font-style: italic;
}

input[type='text'],
textarea,
select {
  font: inherit;
  padding: var(--space-sm);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--bg-primary);
  color: var(--text-primary);
}

.ingredients-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-md);
}

.ingredients-preview {
  list-style: none;
  margin: 0;
  padding: var(--space-sm);
  border: 1px dashed var(--border-color);
  border-radius: 6px;
  min-height: 4rem;
}

.ingredients-preview .hint {
  color: var(--text-secondary);
  font-style: italic;
}

.image-row {
  display: flex;
  gap: var(--space-md);
  align-items: flex-start;
}

.image-preview {
  width: 140px;
  height: 140px;
  flex-shrink: 0;
  border-radius: 6px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  overflow: hidden;
}

.image-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.notes-toolbar {
  display: flex;
  gap: var(--space-xs);
}

.notes-toolbar button {
  width: 2rem;
  height: 2rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: var(--bg-secondary);
}

.notes-preview {
  padding: var(--space-sm);
  border: 1px dashed var(--border-color);
  border-radius: 6px;
  min-height: 2rem;
}

.actions {
  display: flex;
  gap: var(--space-sm);
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

.error {
  color: var(--color-danger);
}

@media (max-width: 700px) {
  .ingredients-grid {
    grid-template-columns: 1fr;
  }
}
</style>
