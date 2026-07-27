<script setup>
import { computed, onMounted, ref } from 'vue'
import { useProjectsStore } from '../stores/projects'
import { useRecipesStore } from '../stores/recipes'
import RecipeThumbnail from '../components/RecipeThumbnail.vue'
import { ACCENT_COLORS, COVER_TEMPLATES } from '../js/templates'
import { nextSequence } from '../js/sequence'

const props = defineProps({
  projectId: {
    type: String,
    required: true,
  },
})

const projectsStore = useProjectsStore()
const recipesStore = useRecipesStore()

onMounted(async () => {
  if (!projectsStore.loaded) await projectsStore.load()
  if (!recipesStore.loaded) await recipesStore.load()
})

const projectIdNum = computed(() => Number(props.projectId))
const project = computed(() => projectsStore.projects.find((p) => p.id === projectIdNum.value))

const orderedChapters = computed(() => {
  const all = projectsStore.chaptersForProject(projectIdNum.value)
  const custom = all.filter((c) => !c.isDefault)
  const misc = all.find((c) => c.isDefault)
  return misc ? [...custom, misc] : custom
})

function recipesInChapter(chapterId) {
  return projectsStore
    .projectRecipesForChapter(chapterId)
    .map((pr) => ({ pr, recipe: recipesStore.recipes.find((r) => r.id === pr.recipeId) }))
    .filter((entry) => entry.recipe)
}

const newChapterName = ref('')
const addingChapter = ref(false)
async function addChapter() {
  const name = newChapterName.value.trim()
  if (!name || addingChapter.value) return
  addingChapter.value = true
  try {
    await projectsStore.createChapter(projectIdNum.value, name)
    newChapterName.value = ''
  } finally {
    addingChapter.value = false
  }
}

async function renameChapter(chapter, event) {
  const name = event.target.value.trim()
  if (!name || name === chapter.name) return
  await projectsStore.editChapter(chapter.id, { name })
}

const deletingChapterId = ref(null)
async function deleteChapter(chapter) {
  if (deletingChapterId.value) return
  if (!confirm(`Delete chapter "${chapter.name}"? Its recipes move to Miscellaneous.`)) return
  deletingChapterId.value = chapter.id
  try {
    await projectsStore.removeChapter(chapter.id)
  } finally {
    deletingChapterId.value = null
  }
}

function updateField(field, value) {
  projectsStore.editProject(projectIdNum.value, { [field]: value })
}

async function moveRecipeToChapter(pr, newChapterId) {
  if (Number(newChapterId) === pr.chapterId) return
  const siblings = projectsStore.projectRecipesForChapter(Number(newChapterId))
  const sequence = nextSequence(siblings)
  await projectsStore.moveProjectRecipe(pr.id, { chapterId: Number(newChapterId), sequence })
}

const removingRecipeId = ref(null)
async function removeFromProject(pr, title) {
  if (removingRecipeId.value) return
  if (!confirm(`Remove "${title}" from this cookbook? It stays in the Global Recipe Library.`)) return
  removingRecipeId.value = pr.id
  try {
    await projectsStore.removeProjectRecipe(pr.id)
  } finally {
    removingRecipeId.value = null
  }
}

const librarySearch = ref('')
const availableRecipes = computed(() => {
  const inProjectIds = new Set(
    projectsStore.projectRecipesForProject(projectIdNum.value).map((pr) => pr.recipeId),
  )
  const needle = librarySearch.value.trim().toLowerCase()
  return recipesStore.recipes.filter((r) => {
    if (inProjectIds.has(r.id)) return false
    if (!needle) return true
    return r.title.toLowerCase().includes(needle)
  })
})

const addingRecipeId = ref(null)
async function addRecipeToProject(recipe) {
  if (addingRecipeId.value) return
  addingRecipeId.value = recipe.id
  try {
    await projectsStore.addRecipeToProject(projectIdNum.value, recipe.id)
  } finally {
    addingRecipeId.value = null
  }
}
</script>

<template>
  <div class="view" v-if="project">
    <div class="toolbar">
      <h1>{{ project.title || 'Untitled Cookbook' }}</h1>
      <router-link class="primary" :to="`/projects/${project.id}/print`">Print Preview</router-link>
    </div>

    <section class="panel">
      <h2>Cookbook Settings</h2>
      <div class="settings-grid">
        <label class="field">
          <span>Title</span>
          <input :value="project.title" type="text" @change="updateField('title', $event.target.value)" />
        </label>
        <label class="field">
          <span>Subtitle</span>
          <input :value="project.subtitle" type="text" @change="updateField('subtitle', $event.target.value)" />
        </label>
        <label class="field">
          <span>Author</span>
          <input :value="project.author" type="text" @change="updateField('author', $event.target.value)" />
        </label>
        <label class="field checkbox">
          <input
            type="checkbox"
            :checked="project.pageNumbersEnabled"
            @change="updateField('pageNumbersEnabled', $event.target.checked)"
          />
          <span>Page numbers &amp; Table of Contents</span>
        </label>
      </div>
    </section>

    <section class="panel">
      <h2>Styling</h2>
      <div class="field">
        <span>Accent Color</span>
        <div class="swatches">
          <button
            v-for="color in ACCENT_COLORS"
            :key="color.id"
            type="button"
            class="swatch"
            :class="{ active: project.accentColor === color.value }"
            :style="{ background: color.value }"
            :title="color.label"
            @click="updateField('accentColor', color.value)"
          />
        </div>
      </div>
      <label class="field">
        <span>Cover Layout</span>
        <select :value="project.coverTemplate" @change="updateField('coverTemplate', $event.target.value)">
          <option v-for="tpl in COVER_TEMPLATES" :key="tpl.id" :value="tpl.id">{{ tpl.label }}</option>
        </select>
      </label>
    </section>

    <section class="panel">
      <h2>Chapters &amp; Recipes</h2>

      <form class="new-chapter" @submit.prevent="addChapter">
        <input v-model="newChapterName" type="text" placeholder="New chapter name..." />
        <button type="submit" :disabled="addingChapter">+ Add Chapter</button>
      </form>

      <div v-for="chapter in orderedChapters" :key="chapter.id" class="chapter">
        <div class="chapter__header">
          <input
            class="chapter__name"
            :value="chapter.name"
            :disabled="chapter.isDefault"
            @change="renameChapter(chapter, $event)"
          />
          <div class="chapter__actions" v-if="!chapter.isDefault">
            <button type="button" @click="projectsStore.reorderChapter(chapter.id, -1)">↑</button>
            <button type="button" @click="projectsStore.reorderChapter(chapter.id, 1)">↓</button>
            <button
              type="button"
              class="danger"
              :disabled="deletingChapterId === chapter.id"
              @click="deleteChapter(chapter)"
            >
              Delete
            </button>
          </div>
          <span v-else class="chapter__badge">Default (always last, cannot be deleted)</span>
        </div>

        <ul class="chapter-recipes">
          <li v-if="!recipesInChapter(chapter.id).length" class="empty">No recipes yet.</li>
          <li v-for="{ pr, recipe } in recipesInChapter(chapter.id)" :key="pr.id">
            <div class="recipe-row__thumb">
              <RecipeThumbnail :image="recipe.image" />
            </div>
            <router-link :to="`/library/${recipe.id}`" class="recipe-row__title">
              {{ recipe.title }}
            </router-link>
            <div class="recipe-row__actions">
              <button type="button" @click="projectsStore.reorderProjectRecipe(pr.id, -1)">↑</button>
              <button type="button" @click="projectsStore.reorderProjectRecipe(pr.id, 1)">↓</button>
              <select :value="pr.chapterId" @change="moveRecipeToChapter(pr, $event.target.value)">
                <option v-for="c in orderedChapters" :key="c.id" :value="c.id">{{ c.name }}</option>
              </select>
              <router-link :to="`/projects/${project.id}/recipes/${recipe.id}/print`">Print</router-link>
              <button
                type="button"
                class="danger"
                :disabled="removingRecipeId === pr.id"
                @click="removeFromProject(pr, recipe.title)"
              >
                Remove
              </button>
            </div>
          </li>
        </ul>
      </div>
    </section>

    <section class="panel">
      <h2>Add Recipes from the Global Library</h2>
      <input v-model="librarySearch" type="search" placeholder="Search library..." class="library-search" />
      <ul class="library-list">
        <li v-if="!availableRecipes.length" class="empty">
          No matching recipes to add. <router-link to="/library/new">Create one</router-link>.
        </li>
        <li v-for="recipe in availableRecipes" :key="recipe.id">
          <div class="recipe-row__thumb">
            <RecipeThumbnail :image="recipe.image" />
          </div>
          <span class="recipe-row__title">{{ recipe.title }}</span>
          <button
            type="button"
            :disabled="addingRecipeId === recipe.id"
            @click="addRecipeToProject(recipe)"
          >
            + Add
          </button>
        </li>
      </ul>
    </section>
  </div>
  <div v-else class="view">
    <p>Project not found.</p>
  </div>
</template>

<style scoped>
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-lg);
}

.toolbar .primary {
  background: var(--accent-color);
  color: white;
  text-decoration: none;
  padding: var(--space-sm) var(--space-md);
  border-radius: 6px;
  font-weight: 600;
}

.panel {
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: var(--space-md);
  margin-bottom: var(--space-lg);
}

.panel h2 {
  margin-top: 0;
  font-size: 1.1rem;
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: var(--space-md);
}

.field {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  margin-bottom: var(--space-sm);
}

.field.checkbox {
  flex-direction: row;
  align-items: center;
}

.field > span {
  font-weight: 600;
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

input[type='text'],
input[type='search'],
select {
  font: inherit;
  padding: var(--space-sm);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--bg-primary);
  color: var(--text-primary);
}

.swatches {
  display: flex;
  gap: var(--space-sm);
}

.swatch {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
}

.swatch.active {
  border-color: var(--text-primary);
}

.new-chapter {
  display: flex;
  gap: var(--space-sm);
  margin-bottom: var(--space-md);
}

.chapter {
  border-top: 1px solid var(--border-color);
  padding-top: var(--space-sm);
  margin-top: var(--space-sm);
}

.chapter__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-sm);
  margin-bottom: var(--space-sm);
}

.chapter__name {
  font-weight: 700;
  border: none;
  background: transparent;
  flex: 1;
}

.chapter__name:disabled {
  color: var(--text-secondary);
}

.chapter__actions {
  display: flex;
  gap: var(--space-xs);
}

.chapter__badge {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  font-style: italic;
}

.chapter-recipes,
.library-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.chapter-recipes li,
.library-list li {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-xs) 0;
}

.recipe-row__thumb {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 4px;
  overflow: hidden;
  flex-shrink: 0;
}

.recipe-row__title {
  flex: 1;
  color: var(--text-primary);
  text-decoration: none;
}

.recipe-row__actions {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.recipe-row__actions a {
  color: var(--accent-color);
  font-size: var(--font-size-sm);
}

.empty {
  color: var(--text-secondary);
  font-style: italic;
}

.library-search {
  margin-bottom: var(--space-sm);
  max-width: 20rem;
}

button.danger {
  background: none;
  border: 1px solid var(--color-danger);
  color: var(--color-danger);
  border-radius: 6px;
  padding: 2px var(--space-sm);
  cursor: pointer;
}

button {
  font: inherit;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
