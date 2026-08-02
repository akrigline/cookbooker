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
  <main id="cm-main" style="max-width:1280px; margin:0 auto; padding:40px 32px 80px;" v-if="project">
    <div class="toolbar">
      <div>
        <h1 style="font-family:'Newsreader',Georgia,serif; font-size:34px; font-weight:600; margin:0 0 6px; letter-spacing:-0.01em;">{{ project.title || 'Untitled Cookbook' }}</h1>
        <p v-if="project.subtitle" style="margin:0; font-size:15px; color:oklch(45% 0.01 75);">{{ project.subtitle }}</p>
      </div>
      <router-link class="primary" :to="`/projects/${project.id}/print`">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v8H6z"/></svg>
        Print Preview
      </router-link>
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
            :aria-pressed="project.accentColor === color.value"
            @click="updateField('accentColor', color.value)"
          />
        </div>
      </div>
      <label class="field" style="margin-top: 16px;">
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
            <button
              type="button"
              :aria-label="`Move chapter '${chapter.name}' up`"
              @click="projectsStore.reorderChapter(chapter.id, -1)"
            >
              ↑
            </button>
            <button
              type="button"
              :aria-label="`Move chapter '${chapter.name}' down`"
              @click="projectsStore.reorderChapter(chapter.id, 1)"
            >
              ↓
            </button>
            <button
              type="button"
              class="danger"
              :aria-label="`Delete chapter '${chapter.name}'`"
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
              <button
                type="button"
                :aria-label="`Move '${recipe.title}' up`"
                @click="projectsStore.reorderProjectRecipe(pr.id, -1)"
              >
                ↑
              </button>
              <button
                type="button"
                :aria-label="`Move '${recipe.title}' down`"
                @click="projectsStore.reorderProjectRecipe(pr.id, 1)"
              >
                ↓
              </button>
              <select
                :value="pr.chapterId"
                :aria-label="`Move '${recipe.title}' to a different chapter`"
                @change="moveRecipeToChapter(pr, $event.target.value)"
              >
                <option v-for="c in orderedChapters" :key="c.id" :value="c.id">{{ c.name }}</option>
              </select>
              <router-link :to="`/projects/${project.id}/recipes/${recipe.id}/print`">Print</router-link>
              <button
                type="button"
                class="danger"
                :aria-label="`Remove '${recipe.title}' from this cookbook`"
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
            :aria-label="`Add '${recipe.title}' to this cookbook`"
            :disabled="addingRecipeId === recipe.id"
            @click="addRecipeToProject(recipe)"
          >
            + Add
          </button>
        </li>
      </ul>
    </section>
  </main>
  <main id="cm-main" style="max-width:1280px; margin:0 auto; padding:40px 32px 80px;" v-else>
    <p>Project not found.</p>
  </main>
</template>

<style scoped>
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 28px;
  gap: 16px;
  flex-wrap: wrap;
}

.toolbar .primary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: oklch(20% 0.015 75);
  color: oklch(98% 0.004 75);
  text-decoration: none;
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  transition: background 0.15s;
}

.toolbar .primary:hover {
  background: oklch(28% 0.02 75);
}

.toolbar .primary:focus-visible {
  outline: 2px solid oklch(52% 0.16 250);
  outline-offset: 2px;
}

.panel {
  background: oklch(99.2% 0.002 75);
  border: 1px solid oklch(88% 0.008 75);
  border-radius: 14px;
  padding: 24px 28px;
  margin-bottom: 24px;
}

.panel h2 {
  font-family: 'Newsreader', Georgia, serif;
  font-size: 22px;
  font-weight: 600;
  margin-top: 0;
  margin-bottom: 16px;
  color: oklch(20% 0.015 75);
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field.checkbox {
  flex-direction: row;
  align-items: center;
  gap: 10px;
  align-self: center;
  margin-top: 18px;
}

.field > span {
  font-weight: 600;
  font-size: 13px;
  color: oklch(50% 0.01 75);
}

input[type='text'],
input[type='search'],
select {
  font: inherit;
  font-size: 14px;
  padding: 10px 12px;
  border: 1px solid oklch(85% 0.008 75);
  border-radius: 8px;
  background: oklch(99.3% 0.002 75);
  color: oklch(18% 0.01 75);
}

input[type='text']:focus-visible,
input[type='search']:focus-visible,
select:focus-visible {
  outline: 2px solid oklch(52% 0.16 250);
  outline-offset: 1px;
  border-color: oklch(52% 0.16 250);
}

.swatches {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.swatch {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  box-shadow: 0 0 0 2px oklch(99% 0 0);
  transition: transform 0.15s;
}

.swatch.active {
  border-color: oklch(20% 0.015 75);
  transform: scale(1.1);
}

.swatch:focus-visible {
  outline: 2px solid oklch(52% 0.16 250);
  outline-offset: 2px;
}

.new-chapter {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.new-chapter input {
  flex: 1;
  max-width: 320px;
}

.new-chapter button {
  background: oklch(20% 0.015 75);
  color: oklch(98% 0.004 75);
  border: none;
  border-radius: 8px;
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.new-chapter button:hover {
  background: oklch(28% 0.02 75);
}

.chapter {
  border-top: 1px solid oklch(90% 0.008 75);
  padding-top: 16px;
  margin-top: 16px;
}

.chapter__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.chapter__name {
  font-weight: 700;
  font-size: 16px;
  border: 1px solid transparent;
  background: transparent;
  flex: 1;
  padding: 4px 8px;
  border-radius: 6px;
}

.chapter__name:hover:not(:disabled),
.chapter__name:focus-visible {
  background: oklch(96% 0.006 75);
  border-color: oklch(85% 0.008 75);
}

.chapter__name:disabled {
  color: oklch(45% 0.01 75);
}

.chapter__actions {
  display: flex;
  gap: 6px;
}

.chapter__actions button {
  background: oklch(94% 0.006 75);
  border: 1px solid oklch(85% 0.008 75);
  border-radius: 6px;
  padding: 6px 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  color: oklch(18% 0.01 75);
}

.chapter__actions button.danger {
  background: none;
  border: 1px solid oklch(85% 0.06 25);
  color: oklch(45% 0.12 25);
}

.chapter__actions button.danger:hover {
  background: oklch(94% 0.04 25);
}

.chapter__badge {
  font-size: 13px;
  color: oklch(45% 0.01 75);
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
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid oklch(94% 0.006 75);
}

.chapter-recipes li:last-child,
.library-list li:last-child {
  border-bottom: none;
}

.recipe-row__thumb {
  width: 44px;
  height: 44px;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid oklch(85% 0.02 250);
  flex-shrink: 0;
}

.recipe-row__title {
  flex: 1;
  color: oklch(18% 0.01 75);
  font-size: 15px;
  font-weight: 600;
  text-decoration: none;
}

.recipe-row__title:hover {
  text-decoration: underline;
}

.recipe-row__actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.recipe-row__actions button,
.recipe-row__actions a {
  background: oklch(94% 0.006 75);
  border: 1px solid oklch(85% 0.008 75);
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 13px;
  font-weight: 600;
  color: oklch(18% 0.01 75);
  text-decoration: none;
  cursor: pointer;
}

.recipe-row__actions button.danger {
  background: none;
  border: 1px solid oklch(85% 0.06 25);
  color: oklch(45% 0.12 25);
}

.recipe-row__actions button.danger:hover {
  background: oklch(94% 0.04 25);
}

.empty {
  color: oklch(45% 0.01 75);
  font-style: italic;
  font-size: 14px;
}

.library-search {
  margin-bottom: 16px;
  width: 100%;
  max-width: 320px;
}

button {
  font: inherit;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
