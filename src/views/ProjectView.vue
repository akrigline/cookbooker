<script setup>
import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useProjectsStore } from '../stores/projects'
import { useRecipesStore } from '../stores/recipes'
import RecipeThumbnail from '../components/RecipeThumbnail.vue'
import Modal from '../components/Modal.vue'
import RecipePreviewDialog from '../components/RecipePreviewDialog.vue'
import { ACCENT_COLORS, COVER_TEMPLATES } from '../js/templates'
import { nextSequence } from '../js/sequence'

// ---------------------------------------------------------------------------
// Props / stores
// ---------------------------------------------------------------------------

const props = defineProps({
  projectId: { type: String, required: true },
})

const router = useRouter()
const projectsStore = useProjectsStore()
const recipesStore = useRecipesStore()

onMounted(async () => {
  if (!projectsStore.loaded) await projectsStore.load()
  if (!recipesStore.loaded) await recipesStore.load()
})

// ---------------------------------------------------------------------------
// Derived data
// ---------------------------------------------------------------------------

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
    .filter((e) => e.recipe)
}

// ---------------------------------------------------------------------------
// Task 1.3 — Live region
// ---------------------------------------------------------------------------

const liveMsg = ref('')
function announce(msg) {
  liveMsg.value = ''
  nextTick(() => { liveMsg.value = msg })
}

// ---------------------------------------------------------------------------
// Task 2.1 — Selection state
// ---------------------------------------------------------------------------

// selectedIds: Set of projectRecipe.id values for in-cookbook bulk actions
const selectedIds = ref(new Set())

// libSelectedIds: Set of recipe.id values for library bulk actions
const libSelectedIds = ref(new Set())

function toggleSelect(prId) {
  const s = new Set(selectedIds.value)
  if (s.has(prId)) s.delete(prId)
  else s.add(prId)
  selectedIds.value = s
}

function toggleLibSelect(recipeId) {
  const s = new Set(libSelectedIds.value)
  if (s.has(recipeId)) s.delete(recipeId)
  else s.add(recipeId)
  libSelectedIds.value = s
}

function selectAllInChapter(chapterId) {
  const rows = recipesInChapter(chapterId)
  const ids = rows.map((e) => e.pr.id)
  const s = new Set(selectedIds.value)
  const allSelected = ids.every((id) => s.has(id))
  if (allSelected) {
    ids.forEach((id) => s.delete(id))
  } else {
    ids.forEach((id) => s.add(id))
  }
  selectedIds.value = s
}

function chapterAllSelected(chapterId) {
  const rows = recipesInChapter(chapterId)
  if (!rows.length) return false
  return rows.every((e) => selectedIds.value.has(e.pr.id))
}

function chapterSomeSelected(chapterId) {
  const rows = recipesInChapter(chapterId)
  return rows.some((e) => selectedIds.value.has(e.pr.id))
}

function clearSelection() {
  selectedIds.value = new Set()
}

function clearLibSelection() {
  libSelectedIds.value = new Set()
}

// ---------------------------------------------------------------------------
// Task 2.3 / 2.4 / 2.5 — Modal state
// ---------------------------------------------------------------------------

const modal = reactive({
  type: null, // null | 'deleteChapter' | 'removeRecipe' | 'bulkRemove' | 'editCookbook' | 'chapterName'

  // deleteChapter
  deletingChapter: null,

  // removeRecipe
  removingPr: null,
  removingTitle: '',

  // editCookbook (transient edits staged here, committed on save)
  editTitle: '',
  editSubtitle: '',
  editAccent: '',

  // chapterName (shared for new/rename/newFromSelection/newFromLibrary)
  chapterNameValue: '',
  chapterNameMode: null, // 'new' | 'rename' | 'newFromSelection' | 'newFromLibrary'
  chapterNameTargetId: null, // chapter id for rename
  chapterNameHeading: '',
  chapterNameSubheading: '',
})

const modalBusy = ref(false)

function openDeleteChapter(chapter) {
  modal.type = 'deleteChapter'
  modal.deletingChapter = chapter
}

function openRemoveRecipe(pr, title) {
  modal.type = 'removeRecipe'
  modal.removingPr = pr
  modal.removingTitle = title
}

function openBulkRemove() {
  modal.type = 'bulkRemove'
}

function openEditCookbook() {
  modal.editTitle = project.value?.title ?? ''
  modal.editSubtitle = project.value?.subtitle ?? ''
  modal.editAccent = project.value?.accentColor ?? ''
  modal.type = 'editCookbook'
}

function openChapterNameModal(mode, targetId = null, existingName = '') {
  modal.chapterNameMode = mode
  modal.chapterNameTargetId = targetId
  modal.chapterNameValue = existingName
  if (mode === 'new') {
    modal.chapterNameHeading = 'New Chapter'
    modal.chapterNameSubheading = 'Enter a name for the new chapter.'
  } else if (mode === 'rename') {
    modal.chapterNameHeading = 'Rename Chapter'
    modal.chapterNameSubheading = 'Enter a new name for this chapter.'
  } else if (mode === 'newFromSelection') {
    modal.chapterNameHeading = 'New Chapter from Selection'
    modal.chapterNameSubheading = `Create a new chapter and move ${selectedIds.value.size} selected recipe${selectedIds.value.size !== 1 ? 's' : ''} into it.`
  } else if (mode === 'newFromLibrary') {
    modal.chapterNameHeading = 'New Chapter from Library'
    modal.chapterNameSubheading = `Create a new chapter and add ${libSelectedIds.value.size} selected recipe${libSelectedIds.value.size !== 1 ? 's' : ''} to the cookbook.`
  }
  modal.type = 'chapterName'
}

function closeModal() {
  if (modalBusy.value) return
  modal.type = null
}

const previewRecipe = ref(null)

function openPreview(recipe) {
  previewRecipe.value = recipe
}

function closePreview() {
  previewRecipe.value = null
}

function editPreviewRecipe() {
  const r = previewRecipe.value
  if (r) {
    router.push(`/library/${r.id}`)
  }
}


// ---------------------------------------------------------------------------
// Cookbook actions
// ---------------------------------------------------------------------------

async function confirmDeleteChapter() {
  if (modalBusy.value || !modal.deletingChapter) return
  modalBusy.value = true
  try {
    await projectsStore.removeChapter(modal.deletingChapter.id)
    announce(`Chapter "${modal.deletingChapter.name}" deleted.`)
    modal.type = null
  } finally {
    modalBusy.value = false
  }
}

async function saveEditCookbook() {
  if (modalBusy.value) return
  modalBusy.value = true
  try {
    await projectsStore.editProject(projectIdNum.value, {
      title: modal.editTitle.trim(),
      subtitle: modal.editSubtitle.trim(),
      accentColor: modal.editAccent,
    })
    modal.type = null
  } finally {
    modalBusy.value = false
  }
}

function updateField(field, value) {
  projectsStore.editProject(projectIdNum.value, { [field]: value })
}

// Chapter name form submission (shared modal for new/rename/newFromSelection/newFromLibrary)
async function submitChapterName() {
  if (modalBusy.value) return
  const name = modal.chapterNameValue.trim()
  if (!name) return
  modalBusy.value = true
  try {
    const mode = modal.chapterNameMode

    if (mode === 'new') {
      await projectsStore.createChapter(projectIdNum.value, name)
      announce(`Chapter "${name}" created.`)
    } else if (mode === 'rename') {
      await projectsStore.editChapter(modal.chapterNameTargetId, { name })
      announce(`Chapter renamed to "${name}".`)
    } else if (mode === 'newFromSelection') {
      // Create chapter then bulk move selected recipes into it
      const chapterId = await projectsStore.createChapter(projectIdNum.value, name)
      await bulkMoveToChapter(chapterId)
      announce(`Chapter "${name}" created with ${selectedIds.value.size} recipes.`)
    } else if (mode === 'newFromLibrary') {
      // Create chapter then add selected library recipes into it
      const chapterId = await projectsStore.createChapter(projectIdNum.value, name)
      const recipeIds = Array.from(libSelectedIds.value)
      await Promise.all(
        recipeIds.map((rid) => projectsStore.addRecipeToProject(projectIdNum.value, rid, chapterId)),
      )
      clearLibSelection()
      announce(`Chapter "${name}" created with ${recipeIds.length} recipes from library.`)
    }

    modal.type = null
  } finally {
    modalBusy.value = false
  }
}

// ---------------------------------------------------------------------------
// Per-recipe actions
// ---------------------------------------------------------------------------

async function confirmRemoveRecipe() {
  if (modalBusy.value || !modal.removingPr) return
  modalBusy.value = true
  try {
    await projectsStore.removeProjectRecipe(modal.removingPr.id)
    selectedIds.value = new Set([...selectedIds.value].filter((id) => id !== modal.removingPr.id))
    announce(`"${modal.removingTitle}" removed from cookbook.`)
    modal.type = null
  } finally {
    modalBusy.value = false
  }
}

async function moveRecipeToChapter(pr, newChapterId) {
  const target = Number(newChapterId)
  if (target === pr.chapterId) return
  const siblings = projectsStore.projectRecipesForChapter(target)
  const sequence = nextSequence(siblings)
  await projectsStore.moveProjectRecipe(pr.id, { chapterId: target, sequence })
  announce(`Recipe moved to new chapter.`)
}

// ---------------------------------------------------------------------------
// Sorting
// ---------------------------------------------------------------------------

async function sortChapterAZ(chapterId) {
  const rows = recipesInChapter(chapterId)
  const sorted = [...rows].sort((a, b) =>
    (a.recipe.title ?? '').localeCompare(b.recipe.title ?? ''),
  )
  await Promise.all(
    sorted.map(({ pr }, i) => projectsStore.moveProjectRecipe(pr.id, { sequence: i })),
  )
  announce('Recipes sorted A–Z.')
}

// ---------------------------------------------------------------------------
// Task 5.2 — Bulk operations (in-cookbook)
// ---------------------------------------------------------------------------

async function bulkMoveToChapter(chapterId) {
  const ids = Array.from(selectedIds.value)
  const siblings = projectsStore.projectRecipesForChapter(chapterId)
  let seq = nextSequence(siblings)
  await Promise.all(
    ids.map((prId) =>
      projectsStore.moveProjectRecipe(prId, { chapterId, sequence: seq++ }),
    ),
  )
  clearSelection()
}

const bulkMoveTarget = ref('')
async function doBulkMove() {
  if (!bulkMoveTarget.value) return
  await bulkMoveToChapter(Number(bulkMoveTarget.value))
  announce(`Moved ${selectedIds.value.size} recipes.`)
  bulkMoveTarget.value = ''
}

async function confirmBulkRemove() {
  if (modalBusy.value) return
  modalBusy.value = true
  try {
    const ids = Array.from(selectedIds.value)
    await Promise.all(ids.map((prId) => projectsStore.removeProjectRecipe(prId)))
    clearSelection()
    announce(`${ids.length} recipe${ids.length !== 1 ? 's' : ''} removed from cookbook.`)
    modal.type = null
  } finally {
    modalBusy.value = false
  }
}

// ---------------------------------------------------------------------------
// Library
// ---------------------------------------------------------------------------

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
async function quickAddRecipe(recipe) {
  if (addingRecipeId.value) return
  addingRecipeId.value = recipe.id
  try {
    await projectsStore.addRecipeToProject(projectIdNum.value, recipe.id)
    announce(`"${recipe.title}" added to cookbook.`)
  } finally {
    addingRecipeId.value = null
  }
}

// Library bulk — "Add to chapter…" select
const libBulkChapterTarget = ref('')
async function libBulkAddToChapter() {
  if (!libBulkChapterTarget.value || !libSelectedIds.value.size) return
  const chapterId = Number(libBulkChapterTarget.value)
  const recipeIds = Array.from(libSelectedIds.value)
  await Promise.all(
    recipeIds.map((rid) => projectsStore.addRecipeToProject(projectIdNum.value, rid, chapterId)),
  )
  clearLibSelection()
  libBulkChapterTarget.value = ''
  announce(`${recipeIds.length} recipe${recipeIds.length !== 1 ? 's' : ''} added to chapter.`)
}

async function libBulkAddToMisc() {
  if (!libSelectedIds.value.size) return
  const recipeIds = Array.from(libSelectedIds.value)
  await Promise.all(
    recipeIds.map((rid) => projectsStore.addRecipeToProject(projectIdNum.value, rid)),
  )
  clearLibSelection()
  announce(`${recipeIds.length} recipe${recipeIds.length !== 1 ? 's' : ''} added to Miscellaneous.`)
}

// ---------------------------------------------------------------------------
// Task 6.1 — Chapter drag-and-drop
// ---------------------------------------------------------------------------

const dragChapterId = ref(null)
const dragOverChapterId = ref(null)

function onChapterDragStart(e, chapterId) {
  dragChapterId.value = chapterId
  e.dataTransfer.effectAllowed = 'move'
  e.dataTransfer.setData('text/plain', `chapter:${chapterId}`)
}

function onChapterDragOver(e, chapterId) {
  if (dragChapterId.value === null) return
  const src = dragChapterId.value
  const destChapter = orderedChapters.value.find((c) => c.id === chapterId)
  if (!destChapter || destChapter.isDefault) return
  e.preventDefault()
  e.dataTransfer.dropEffect = 'move'
  dragOverChapterId.value = chapterId
}

function onChapterDragLeave() {
  dragOverChapterId.value = null
}

async function onChapterDrop(e, targetChapterId) {
  e.preventDefault()
  const srcId = dragChapterId.value
  dragChapterId.value = null
  dragOverChapterId.value = null
  if (srcId === null || srcId === targetChapterId) return
  const destChapter = orderedChapters.value.find((c) => c.id === targetChapterId)
  if (!destChapter || destChapter.isDefault) return
  const srcChapter = orderedChapters.value.find((c) => c.id === srcId)
  if (!srcChapter) return
  // Swap sequences
  await Promise.all([
    projectsStore.editChapter(srcId, { sequence: destChapter.sequence }),
    projectsStore.editChapter(targetChapterId, { sequence: srcChapter.sequence }),
  ])
  announce(`Chapter moved.`)
}

function onChapterDragEnd() {
  dragChapterId.value = null
  dragOverChapterId.value = null
}

// ---------------------------------------------------------------------------
// Task 6.2 — Recipe drag-and-drop
// ---------------------------------------------------------------------------

// Drag payload can be:
//   'recipe:<prId>'       — dragging an in-cookbook recipe (reorder / chapter move)
//   'library:<recipeId>'  — dragging a library recipe into the cookbook

const dragRecipePrId = ref(null)   // pr.id when dragging in-cookbook recipe
const dragLibRecipeId = ref(null)  // recipe.id when dragging from library
const dropChapterId = ref(null)    // chapter being hovered (for highlighting)
const dropAfterPrId = ref(null)    // pr.id to insert after (null = top of chapter)

function onRecipeDragStart(e, pr) {
  dragRecipePrId.value = pr.id
  dragLibRecipeId.value = null
  e.dataTransfer.effectAllowed = 'move'
  e.dataTransfer.setData('text/plain', `recipe:${pr.id}`)
}

function onLibRecipeDragStart(e, recipe) {
  dragLibRecipeId.value = recipe.id
  dragRecipePrId.value = null
  e.dataTransfer.effectAllowed = 'copy'
  e.dataTransfer.setData('text/plain', `library:${recipe.id}`)
}

function onRecipeDragOver(e, chapterId, afterPrId = null) {
  if (dragRecipePrId.value === null && dragLibRecipeId.value === null) return
  e.preventDefault()
  e.dataTransfer.dropEffect = dragLibRecipeId.value ? 'copy' : 'move'
  dropChapterId.value = chapterId
  dropAfterPrId.value = afterPrId
}

function onChapterAreaDragLeave(e) {
  // Only clear if leaving the chapter container entirely
  if (!e.currentTarget.contains(e.relatedTarget)) {
    dropChapterId.value = null
    dropAfterPrId.value = null
  }
}

async function onRecipeDrop(e, targetChapterId) {
  e.preventDefault()
  dropChapterId.value = null
  dropAfterPrId.value = null

  if (dragLibRecipeId.value !== null) {
    // Add library recipe to cookbook in this chapter
    const rid = dragLibRecipeId.value
    dragLibRecipeId.value = null
    const recipe = recipesStore.recipes.find((r) => r.id === rid)
    if (!recipe) return
    await projectsStore.addRecipeToProject(projectIdNum.value, rid, targetChapterId)
    announce(`"${recipe.title}" added to chapter.`)
    return
  }

  if (dragRecipePrId.value !== null) {
    const prId = dragRecipePrId.value
    dragRecipePrId.value = null
    const pr = projectsStore.projectRecipes.find((p) => p.id === prId)
    if (!pr) return

    if (pr.chapterId === targetChapterId) {
      // Reorder within chapter — drop after dropAfterPrId or at top
      const siblings = projectsStore.projectRecipesForChapter(targetChapterId)
      const afterId = dropAfterPrId.value
      const otherPr = afterId ? siblings.find((p) => p.id === afterId) : null
      // Simple sequence reassignment: put after target
      let newSeq
      if (!afterId) {
        newSeq = (siblings[0]?.sequence ?? 0) - 1
      } else if (otherPr) {
        const nextPr = siblings[siblings.indexOf(otherPr) + 1]
        newSeq = nextPr
          ? (otherPr.sequence + nextPr.sequence) / 2
          : otherPr.sequence + 1
      } else {
        newSeq = nextSequence(siblings)
      }
      await projectsStore.moveProjectRecipe(prId, { sequence: newSeq })
      announce('Recipe reordered.')
    } else {
      // Move to different chapter
      await moveRecipeToChapter(pr, targetChapterId)
    }
  }
}

function onRecipeDragEnd() {
  dragRecipePrId.value = null
  dragLibRecipeId.value = null
  dropChapterId.value = null
  dropAfterPrId.value = null
}

// ---------------------------------------------------------------------------
// Overflow menu state
// ---------------------------------------------------------------------------

const openMenuPrId = ref(null)

function toggleMenu(prId) {
  openMenuPrId.value = openMenuPrId.value === prId ? null : prId
}

function closeMenus() {
  openMenuPrId.value = null
}

// Close menus on outside click
onMounted(() => {
  document.addEventListener('click', closeMenus)
})

import { onUnmounted } from 'vue'
onUnmounted(() => {
  document.removeEventListener('click', closeMenus)
})
</script>

<template>
  <!-- Task 1.3: Live region for screen reader announcements -->
  <div
    role="status"
    aria-live="polite"
    aria-atomic="true"
    class="sr-only"
  >{{ liveMsg }}</div>

  <!-- Not-found state -->
  <div v-if="!project" style="padding: 60px 32px; max-width: 1280px; margin: 0 auto;">
    <p style="color: oklch(45% 0.01 75);">Project not found.</p>
  </div>

  <!-- Task 1.1 + 1.2: Two-column stack layout with sticky header -->
  <div v-else class="pv-layout">

    <!-- Sticky header bar -->
    <header class="pv-header" role="banner">
      <div class="pv-header-inner">
        <div class="pv-header-left">
          <button
            type="button"
            class="pv-back-btn"
            aria-label="Back to Cookbooks"
            @click="router.push('/')"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            Cookbooks
          </button>
          <div class="pv-header-title-row">
            <h1 class="pv-header-title">{{ project.title || 'Untitled Cookbook' }}</h1>
            <button
              type="button"
              class="pv-icon-btn"
              aria-label="Edit cookbook details"
              title="Edit cookbook details"
              @click="openEditCookbook"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
          </div>
          <p v-if="project.subtitle" class="pv-header-subtitle">{{ project.subtitle }}</p>
        </div>
        <div class="pv-header-actions">
          <router-link class="pv-btn-primary" :to="`/projects/${project.id}/print`">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v8H6z"/></svg>
            Print Preview
          </router-link>
        </div>
      </div>
    </header>

    <!-- Content area: main + sidebar -->
    <div class="pv-body">

      <!-- Main content -->
      <main id="cm-main" class="pv-main">

        <!-- Chapters -->
        <div
          v-for="chapter in orderedChapters"
          :key="chapter.id"
          class="chapter-card"
          :class="{
            'chapter-card--drag-over': dragOverChapterId === chapter.id,
            'chapter-card--dragging': dragChapterId === chapter.id,
          }"
          :draggable="!chapter.isDefault"
          @dragstart="!chapter.isDefault && onChapterDragStart($event, chapter.id)"
          @dragover="onChapterDragOver($event, chapter.id)"
          @dragleave="onChapterDragLeave"
          @drop="onChapterDrop($event, chapter.id)"
          @dragend="onChapterDragEnd"
        >
          <!-- Task 3.1: Chapter Card header row -->
          <div class="chapter-card__header">
            <div class="chapter-card__title-row">
              <!-- Drag handle (only for non-default chapters) -->
              <span
                v-if="!chapter.isDefault"
                class="drag-handle"
                aria-hidden="true"
                title="Drag to reorder chapter"
              >
                <svg width="12" height="18" viewBox="0 0 12 18" fill="currentColor"><circle cx="3" cy="3" r="1.5"/><circle cx="9" cy="3" r="1.5"/><circle cx="3" cy="9" r="1.5"/><circle cx="9" cy="9" r="1.5"/><circle cx="3" cy="15" r="1.5"/><circle cx="9" cy="15" r="1.5"/></svg>
              </span>
              <h2 class="chapter-card__name">{{ chapter.name }}</h2>
              <span v-if="chapter.isDefault" class="chapter-badge">Default</span>
            </div>
            <div class="chapter-card__controls">
              <!-- Select all checkbox -->
              <label class="chapter-select-all" :title="chapterAllSelected(chapter.id) ? 'Deselect all' : 'Select all'">
                <input
                  type="checkbox"
                  :checked="chapterAllSelected(chapter.id)"
                  :indeterminate="!chapterAllSelected(chapter.id) && chapterSomeSelected(chapter.id)"
                  :aria-label="`Select all recipes in ${chapter.name}`"
                  @change="selectAllInChapter(chapter.id)"
                />
                <span>Select all</span>
              </label>
              <!-- Sort A–Z -->
              <button
                type="button"
                class="chapter-action-btn"
                :aria-label="`Sort recipes in ${chapter.name} A–Z`"
                @click="sortChapterAZ(chapter.id)"
              >
                Sort A–Z
              </button>
              <!-- Move up/down (non-default chapters) -->
              <template v-if="!chapter.isDefault">
                <button
                  type="button"
                  class="chapter-action-btn"
                  :aria-label="`Move chapter '${chapter.name}' up`"
                  @click="projectsStore.reorderChapter(chapter.id, -1)"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
                </button>
                <button
                  type="button"
                  class="chapter-action-btn"
                  :aria-label="`Move chapter '${chapter.name}' down`"
                  @click="projectsStore.reorderChapter(chapter.id, 1)"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                </button>
                <button
                  type="button"
                  class="chapter-action-btn chapter-action-btn--danger"
                  :aria-label="`Delete chapter '${chapter.name}'`"
                  @click="openDeleteChapter(chapter)"
                >
                  Delete
                </button>
                <button
                  type="button"
                  class="chapter-action-btn"
                  :aria-label="`Rename chapter '${chapter.name}'`"
                  @click="openChapterNameModal('rename', chapter.id, chapter.name)"
                >
                  Rename
                </button>
              </template>
            </div>
          </div>

          <!-- Recipe list drop zone -->
          <ul
            class="recipe-list"
            :class="{ 'recipe-list--drop-active': dropChapterId === chapter.id }"
            @dragover="onRecipeDragOver($event, chapter.id)"
            @dragleave="onChapterAreaDragLeave"
            @drop="onRecipeDrop($event, chapter.id)"
          >
            <li v-if="!recipesInChapter(chapter.id).length" class="recipe-list__empty">
              No recipes yet. Add from the library →
            </li>

            <!-- Task 3.2: Recipe Row -->
            <li
              v-for="{ pr, recipe } in recipesInChapter(chapter.id)"
              :key="pr.id"
              class="recipe-row"
              :class="{ 'recipe-row--selected': selectedIds.has(pr.id) }"
              draggable="true"
              @dragstart="onRecipeDragStart($event, pr)"
              @dragover="onRecipeDragOver($event, chapter.id, pr.id)"
              @dragend="onRecipeDragEnd"
            >
              <!-- Checkbox -->
              <input
                type="checkbox"
                class="recipe-row__check"
                :checked="selectedIds.has(pr.id)"
                :aria-label="`Select '${recipe.title}'`"
                @change="toggleSelect(pr.id)"
              />
              <!-- Drag handle -->
              <span class="drag-handle recipe-row__drag" aria-hidden="true" title="Drag to reorder">
                <svg width="10" height="16" viewBox="0 0 10 16" fill="currentColor"><circle cx="2.5" cy="2.5" r="1.5"/><circle cx="7.5" cy="2.5" r="1.5"/><circle cx="2.5" cy="8" r="1.5"/><circle cx="7.5" cy="8" r="1.5"/><circle cx="2.5" cy="13.5" r="1.5"/><circle cx="7.5" cy="13.5" r="1.5"/></svg>
              </span>
              <!-- Thumbnail -->
              <div class="recipe-row__thumb">
                <RecipeThumbnail :image="recipe.image" />
              </div>
              <!-- Title -->
              <a href="#" class="recipe-row__title" @click.prevent="openPreview(recipe)">
                {{ recipe.title }}
              </a>
              <!-- Overflow menu -->
              <div class="recipe-row__menu-wrap" @click.stop>
                <button
                  type="button"
                  class="recipe-row__menu-btn"
                  :aria-label="`Actions for '${recipe.title}'`"
                  :aria-expanded="openMenuPrId === pr.id"
                  @click="toggleMenu(pr.id)"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>
                </button>
                <div v-if="openMenuPrId === pr.id" class="overflow-menu" role="menu">
                  <button
                    type="button"
                    role="menuitem"
                    @click="() => { closeMenus(); openChapterNameModal('rename', chapter.id, chapter.name) }"
                  >
                    Rename chapter
                  </button>
                  <hr />
                  <div role="group" aria-label="Move to chapter">
                    <button
                      v-for="c in orderedChapters.filter(c => c.id !== chapter.id)"
                      :key="c.id"
                      type="button"
                      role="menuitem"
                      @click="() => { closeMenus(); moveRecipeToChapter(pr, c.id) }"
                    >
                      Move to: {{ c.name }}
                    </button>
                  </div>
                  <hr />
                  <router-link
                    role="menuitem"
                    :to="`/projects/${project.id}/recipes/${recipe.id}/print`"
                    @click="closeMenus"
                  >
                    Print recipe
                  </router-link>
                  <button
                    type="button"
                    role="menuitem"
                    class="overflow-menu__danger"
                    @click="() => { closeMenus(); openRemoveRecipe(pr, recipe.title) }"
                  >
                    Remove from cookbook
                  </button>
                </div>
              </div>
            </li>
          </ul>
        </div>

        <!-- Empty state -->
        <div v-if="orderedChapters.length === 0" class="empty-state">
          <p>No chapters yet. Use the "New Chapter" form in the sidebar to get started.</p>
        </div>
      </main>

      <!-- Task 4.1 / 4.2: Recipe Library Sidebar -->
      <aside class="pv-sidebar" aria-label="Recipe Library">

        <!-- Task 3.3: New Chapter quick-add form -->
        <section class="sidebar-section sidebar-section--new-chapter">
          <h2 class="sidebar-section__heading">New Chapter</h2>
          <form class="new-chapter-form" @submit.prevent="openChapterNameModal('new')">
            <button type="submit" class="sidebar-btn sidebar-btn--full">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              New Chapter…
            </button>
          </form>
        </section>

        <div class="sidebar-divider" />

        <!-- Library search -->
        <section class="sidebar-section sidebar-section--library">
          <h2 class="sidebar-section__heading">Global Recipe Library</h2>
          <input
            v-model="librarySearch"
            type="search"
            class="sidebar-search"
            placeholder="Search recipes…"
            aria-label="Search recipe library"
          />

          <!-- Library recipe list -->
          <ul class="lib-list" aria-label="Available recipes">
            <li v-if="!availableRecipes.length" class="lib-list__empty">
              <template v-if="librarySearch">No matches for "{{ librarySearch }}".</template>
              <template v-else>All library recipes are already in this cookbook.
                <router-link to="/library/new">Create a new recipe</router-link>.
              </template>
            </li>
            <li
              v-for="recipe in availableRecipes"
              :key="recipe.id"
              class="lib-row"
              :class="{ 'lib-row--selected': libSelectedIds.has(recipe.id) }"
              draggable="true"
              @dragstart="onLibRecipeDragStart($event, recipe)"
              @dragend="onRecipeDragEnd"
            >
              <input
                type="checkbox"
                class="lib-row__check"
                :checked="libSelectedIds.has(recipe.id)"
                :aria-label="`Select '${recipe.title}'`"
                @change="toggleLibSelect(recipe.id)"
              />
              <div class="lib-row__thumb">
                <RecipeThumbnail :image="recipe.image" />
              </div>
              <span class="lib-row__title">{{ recipe.title }}</span>
              <button
                type="button"
                class="lib-row__add-btn"
                :aria-label="`Add '${recipe.title}' to cookbook`"
                :disabled="addingRecipeId === recipe.id"
                @click="quickAddRecipe(recipe)"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              </button>
            </li>
          </ul>
        </section>

        <!-- Task 4.2: Library bulk action bar -->
        <Transition name="slide-up">
          <div v-if="libSelectedIds.size > 0" class="lib-bulk-bar" role="toolbar" aria-label="Library bulk actions">
            <span class="lib-bulk-bar__count">{{ libSelectedIds.size }} selected</span>
            <div class="lib-bulk-bar__actions">
              <label class="lib-bulk-label" for="lib-bulk-chapter-select">Add to chapter:</label>
              <select
                id="lib-bulk-chapter-select"
                v-model="libBulkChapterTarget"
                class="lib-bulk-select"
                aria-label="Select target chapter"
                @change="libBulkAddToChapter"
              >
                <option value="">Choose…</option>
                <option v-for="c in orderedChapters" :key="c.id" :value="c.id">{{ c.name }}</option>
              </select>
              <button type="button" class="sidebar-btn" @click="libBulkAddToMisc">
                Add to Misc.
              </button>
              <button
                type="button"
                class="sidebar-btn"
                @click="openChapterNameModal('newFromLibrary')"
              >
                New chapter…
              </button>
            </div>
          </div>
        </Transition>
      </aside>
    </div>

    <!-- Task 5.1 / 5.2: In-cookbook bulk action bar -->
    <Transition name="slide-up">
      <div v-if="selectedIds.size > 0" class="bulk-bar" role="toolbar" aria-label="Bulk recipe actions">
        <span class="bulk-bar__count">
          {{ selectedIds.size }} recipe{{ selectedIds.size !== 1 ? 's' : '' }} selected
        </span>
        <div class="bulk-bar__actions">
          <label for="bulk-move-select" class="bulk-bar__label">Move to:</label>
          <select
            id="bulk-move-select"
            v-model="bulkMoveTarget"
            class="bulk-bar__select"
            aria-label="Select chapter to move to"
            @change="doBulkMove"
          >
            <option value="">Choose chapter…</option>
            <option v-for="c in orderedChapters" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
          <button
            type="button"
            class="bulk-bar__btn"
            @click="openChapterNameModal('newFromSelection')"
          >
            New chapter from these
          </button>
          <button
            type="button"
            class="bulk-bar__btn bulk-bar__btn--danger"
            @click="openBulkRemove"
          >
            Remove from cookbook
          </button>
          <button type="button" class="bulk-bar__btn bulk-bar__btn--ghost" @click="clearSelection">
            Cancel
          </button>
        </div>
      </div>
    </Transition>
  </div>

  <!-- ============================================================
       Task 2.3: Delete Chapter modal (double confirmation)
       ============================================================ -->
  <Modal
    v-if="modal.type === 'deleteChapter'"
    role="alertdialog"
    title-id="modal-delete-chapter-title"
    @close="closeModal"
  >
    <h2 id="modal-delete-chapter-title" class="modal-title">Delete Chapter</h2>
    <p class="modal-body">
      Delete <strong>{{ modal.deletingChapter?.name }}</strong>?
      Its recipes will be moved to the Miscellaneous chapter.
    </p>
    <div class="modal-actions">
      <button type="button" class="modal-btn modal-btn--ghost" :disabled="modalBusy" @click="closeModal">
        Cancel
      </button>
      <button type="button" class="modal-btn modal-btn--danger" :disabled="modalBusy" @click="confirmDeleteChapter">
        {{ modalBusy ? 'Deleting…' : 'Delete chapter' }}
      </button>
    </div>
  </Modal>

  <!-- Task 2.3: Remove Recipe modal -->
  <Modal
    v-if="modal.type === 'removeRecipe'"
    role="alertdialog"
    title-id="modal-remove-recipe-title"
    @close="closeModal"
  >
    <h2 id="modal-remove-recipe-title" class="modal-title">Remove Recipe</h2>
    <p class="modal-body">
      Remove <strong>{{ modal.removingTitle }}</strong> from this cookbook?
      It will remain in the Global Recipe Library.
    </p>
    <div class="modal-actions">
      <button type="button" class="modal-btn modal-btn--ghost" :disabled="modalBusy" @click="closeModal">
        Cancel
      </button>
      <button type="button" class="modal-btn modal-btn--danger" :disabled="modalBusy" @click="confirmRemoveRecipe">
        {{ modalBusy ? 'Removing…' : 'Remove recipe' }}
      </button>
    </div>
  </Modal>

  <!-- Task 2.3: Bulk Remove modal -->
  <Modal
    v-if="modal.type === 'bulkRemove'"
    role="alertdialog"
    title-id="modal-bulk-remove-title"
    @close="closeModal"
  >
    <h2 id="modal-bulk-remove-title" class="modal-title">Remove Recipes</h2>
    <p class="modal-body">
      Remove {{ selectedIds.size }} recipe{{ selectedIds.size !== 1 ? 's' : '' }} from this cookbook?
      They will remain in the Global Recipe Library.
    </p>
    <div class="modal-actions">
      <button type="button" class="modal-btn modal-btn--ghost" :disabled="modalBusy" @click="closeModal">
        Cancel
      </button>
      <button type="button" class="modal-btn modal-btn--danger" :disabled="modalBusy" @click="confirmBulkRemove">
        {{ modalBusy ? 'Removing…' : `Remove ${selectedIds.size} recipe${selectedIds.size !== 1 ? 's' : ''}` }}
      </button>
    </div>
  </Modal>

  <!-- Task 2.4: Edit Cookbook Details modal -->
  <Modal
    v-if="modal.type === 'editCookbook'"
    title-id="modal-edit-cookbook-title"
    @close="closeModal"
  >
    <h2 id="modal-edit-cookbook-title" class="modal-title">Edit Cookbook Details</h2>
    <div class="modal-form">
      <label class="form-field">
        <span class="form-label">Title</span>
        <input v-model="modal.editTitle" type="text" class="form-input" placeholder="Cookbook title" />
      </label>
      <label class="form-field">
        <span class="form-label">Subtitle</span>
        <input v-model="modal.editSubtitle" type="text" class="form-input" placeholder="Optional subtitle" />
      </label>
      <div class="form-field">
        <span class="form-label">Accent Color</span>
        <div class="swatches">
          <button
            v-for="color in ACCENT_COLORS"
            :key="color.id"
            type="button"
            class="swatch"
            :class="{ 'swatch--active': modal.editAccent === color.value }"
            :style="{ background: color.value }"
            :title="color.label"
            :aria-pressed="modal.editAccent === color.value"
            @click="modal.editAccent = color.value"
          />
        </div>
      </div>
      <!-- Cover layout stays in-line edit for now; design only specified title/subtitle/accent in modal -->
      <label class="form-field">
        <span class="form-label">Cover Layout</span>
        <select
          :value="project?.coverTemplate"
          class="form-input"
          @change="updateField('coverTemplate', $event.target.value)"
        >
          <option v-for="tpl in COVER_TEMPLATES" :key="tpl.id" :value="tpl.id">{{ tpl.label }}</option>
        </select>
      </label>
      <label class="form-field form-field--checkbox">
        <input
          type="checkbox"
          :checked="project?.pageNumbersEnabled"
          @change="updateField('pageNumbersEnabled', $event.target.checked)"
        />
        <span>Page numbers &amp; Table of Contents</span>
      </label>
    </div>
    <div class="modal-actions">
      <button type="button" class="modal-btn modal-btn--ghost" :disabled="modalBusy" @click="closeModal">
        Cancel
      </button>
      <button type="button" class="modal-btn modal-btn--primary" :disabled="modalBusy" @click="saveEditCookbook">
        {{ modalBusy ? 'Saving…' : 'Save changes' }}
      </button>
    </div>
  </Modal>

  <!-- Task 2.5: Shared Chapter Name modal -->
  <Modal
    v-if="modal.type === 'chapterName'"
    title-id="modal-chapter-name-title"
    @close="closeModal"
  >
    <h2 id="modal-chapter-name-title" class="modal-title">{{ modal.chapterNameHeading }}</h2>
    <p v-if="modal.chapterNameSubheading" class="modal-body">{{ modal.chapterNameSubheading }}</p>
    <form class="modal-form" @submit.prevent="submitChapterName">
      <label class="form-field">
        <span class="form-label">Chapter name</span>
        <input
          v-model="modal.chapterNameValue"
          type="text"
          class="form-input"
          placeholder="e.g. Breakfast & Brunch"
          required
          autofocus
        />
      </label>
      <div class="modal-actions">
        <button type="button" class="modal-btn modal-btn--ghost" :disabled="modalBusy" @click="closeModal">
          Cancel
        </button>
        <button
          type="submit"
          class="modal-btn modal-btn--primary"
          :disabled="modalBusy || !modal.chapterNameValue.trim()"
        >
          {{ modalBusy ? 'Saving…' : modal.chapterNameHeading }}
        </button>
      </div>
    </form>
  </Modal>
  <!-- Recipe Preview Dialog -->
  <RecipePreviewDialog
    v-if="previewRecipe"
    :recipe="previewRecipe"
    :accent-color="project?.accentColor"
    @close="closePreview"
    @edit="editPreviewRecipe"
  />
</template>

<style scoped>
/* ================================================================
   Task 1.1 — Two-column layout
   ================================================================ */

.pv-layout {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 62px); /* subtract App header height */
  overflow: hidden;
}

.pv-body {
  display: grid;
  grid-template-columns: 1fr 340px;
  flex: 1;
  overflow: hidden;
}

.pv-main {
  overflow-y: auto;
  padding: 28px 32px 140px; /* bottom pad for bulk bar */
}

/* ================================================================
   Task 1.2 — Sticky header
   ================================================================ */

.pv-header {
  background: oklch(99% 0.003 75);
  border-bottom: 1px solid oklch(88% 0.008 75);
  flex-shrink: 0;
  z-index: 50;
}

.pv-header-inner {
  padding: 12px 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.pv-header-left {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.pv-back-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  font-weight: 600;
  color: oklch(50% 0.01 75);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  margin-bottom: 4px;
  transition: color 0.12s;
}

.pv-back-btn:hover { color: oklch(25% 0.015 75); }

.pv-header-title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pv-header-title {
  font-family: 'Newsreader', Georgia, serif;
  font-size: 22px;
  font-weight: 600;
  margin: 0;
  letter-spacing: -0.01em;
  color: oklch(18% 0.01 75);
}

.pv-header-subtitle {
  margin: 0;
  font-size: 13px;
  color: oklch(50% 0.01 75);
}

.pv-header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.pv-btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  background: oklch(20% 0.015 75);
  color: oklch(98% 0.004 75);
  text-decoration: none;
  padding: 10px 18px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  transition: background 0.15s;
}

.pv-btn-primary:hover { background: oklch(28% 0.02 75); }

.pv-icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 7px;
  border: 1px solid oklch(86% 0.008 75);
  background: oklch(97% 0.004 75);
  color: oklch(45% 0.01 75);
  cursor: pointer;
  transition: background 0.12s, color 0.12s;
}

.pv-icon-btn:hover {
  background: oklch(93% 0.008 75);
  color: oklch(25% 0.015 75);
}

/* ================================================================
   Task 3.1 — Chapter Card
   ================================================================ */

.chapter-card {
  background: oklch(99.2% 0.002 75);
  border: 1px solid oklch(88% 0.008 75);
  border-radius: 14px;
  margin-bottom: 20px;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.chapter-card--drag-over {
  border-color: oklch(52% 0.16 250);
  box-shadow: 0 0 0 3px oklch(75% 0.12 250 / 35%);
}

.chapter-card--dragging {
  opacity: 0.5;
}

.chapter-card__header {
  padding: 16px 20px 12px;
  border-bottom: 1px solid oklch(91% 0.007 75);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.chapter-card__title-row {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.chapter-card__name {
  font-family: 'Newsreader', Georgia, serif;
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: oklch(20% 0.015 75);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chapter-badge {
  font-size: 11px;
  font-weight: 600;
  color: oklch(55% 0.01 75);
  background: oklch(93% 0.006 75);
  border: 1px solid oklch(86% 0.008 75);
  padding: 2px 8px;
  border-radius: 99px;
  white-space: nowrap;
}

.chapter-card__controls {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.chapter-select-all {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 13px;
  color: oklch(45% 0.01 75);
  cursor: pointer;
  user-select: none;
}

.chapter-select-all input[type='checkbox'] {
  width: 15px;
  height: 15px;
  cursor: pointer;
  accent-color: oklch(52% 0.16 250);
}

.chapter-action-btn {
  background: oklch(95% 0.005 75);
  border: 1px solid oklch(86% 0.008 75);
  border-radius: 7px;
  padding: 5px 10px;
  font-size: 12px;
  font-weight: 600;
  color: oklch(30% 0.01 75);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  transition: background 0.12s;
}

.chapter-action-btn:hover { background: oklch(91% 0.007 75); }

.chapter-action-btn--danger {
  background: none;
  border-color: oklch(82% 0.06 25);
  color: oklch(45% 0.12 25);
}

.chapter-action-btn--danger:hover { background: oklch(95% 0.04 25); }

/* ================================================================
   Task 3.2 — Recipe Row
   ================================================================ */

.recipe-list {
  list-style: none;
  margin: 0;
  padding: 8px 20px;
}

.recipe-list--drop-active {
  background: oklch(95% 0.05 250 / 30%);
  border-radius: 0 0 14px 14px;
}

.recipe-list__empty {
  padding: 16px 0;
  color: oklch(55% 0.01 75);
  font-style: italic;
  font-size: 14px;
}

.recipe-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid oklch(93% 0.005 75);
  cursor: grab;
  border-radius: 6px;
  transition: background 0.1s;
}

.recipe-row:last-child { border-bottom: none; }

.recipe-row--selected {
  background: oklch(95% 0.04 250 / 40%);
}

.recipe-row:active { cursor: grabbing; }

.recipe-row__check {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  accent-color: oklch(52% 0.16 250);
  cursor: pointer;
}

.recipe-row__drag {
  flex-shrink: 0;
  color: oklch(72% 0.008 75);
  cursor: grab;
}

.recipe-row__thumb {
  width: 40px;
  height: 40px;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid oklch(88% 0.01 250);
  flex-shrink: 0;
}

.recipe-row__title {
  flex: 1;
  font-size: 14px;
  font-weight: 600;
  color: oklch(20% 0.01 75);
  text-decoration: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

.recipe-row__title:hover { text-decoration: underline; }

/* Overflow menu */
.recipe-row__menu-wrap {
  position: relative;
  flex-shrink: 0;
}

.recipe-row__menu-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 7px;
  border: 1px solid transparent;
  background: transparent;
  color: oklch(55% 0.01 75);
  cursor: pointer;
  transition: background 0.12s, border-color 0.12s;
}

.recipe-row__menu-btn:hover {
  background: oklch(93% 0.006 75);
  border-color: oklch(86% 0.008 75);
}

.overflow-menu {
  position: absolute;
  right: 0;
  top: calc(100% + 4px);
  background: oklch(99.5% 0.002 75);
  border: 1px solid oklch(88% 0.008 75);
  border-radius: 10px;
  padding: 6px;
  min-width: 180px;
  box-shadow: 0 8px 28px oklch(10% 0.01 75 / 14%);
  z-index: 200;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.overflow-menu button,
.overflow-menu a {
  display: block;
  width: 100%;
  text-align: left;
  padding: 8px 10px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  color: oklch(25% 0.01 75);
  background: none;
  border: none;
  cursor: pointer;
  text-decoration: none;
  transition: background 0.1s;
}

.overflow-menu button:hover,
.overflow-menu a:hover {
  background: oklch(94% 0.006 75);
}

.overflow-menu hr {
  border: none;
  border-top: 1px solid oklch(91% 0.007 75);
  margin: 4px 0;
}

.overflow-menu__danger {
  color: oklch(45% 0.12 25) !important;
}

.overflow-menu__danger:hover {
  background: oklch(95% 0.04 25) !important;
}

/* ================================================================
   Drag handle (shared)
   ================================================================ */

.drag-handle {
  display: inline-flex;
  align-items: center;
  color: oklch(75% 0.006 75);
  cursor: grab;
  flex-shrink: 0;
}

/* ================================================================
   Task 4.1 / 4.2 — Sidebar
   ================================================================ */

.pv-sidebar {
  border-left: 1px solid oklch(88% 0.008 75);
  background: oklch(98.5% 0.003 75);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

.sidebar-section {
  padding: 16px 16px 12px;
}

.sidebar-section--library {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding-bottom: 0;
}

.sidebar-section__heading {
  font-family: 'Newsreader', Georgia, serif;
  font-size: 15px;
  font-weight: 600;
  color: oklch(28% 0.015 75);
  margin: 0 0 10px;
}

.sidebar-divider {
  height: 1px;
  background: oklch(89% 0.007 75);
  margin: 0 16px;
}

.sidebar-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: oklch(20% 0.015 75);
  color: oklch(98% 0.004 75);
  border: none;
  border-radius: 8px;
  padding: 9px 14px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
  white-space: nowrap;
}

.sidebar-btn:hover { background: oklch(28% 0.02 75); }

.sidebar-btn--full { width: 100%; justify-content: center; }

.sidebar-search {
  font: inherit;
  font-size: 13px;
  padding: 8px 12px;
  border: 1px solid oklch(86% 0.008 75);
  border-radius: 8px;
  background: oklch(99.3% 0.002 75);
  color: oklch(18% 0.01 75);
  width: 100%;
  margin-bottom: 10px;
}

.sidebar-search:focus-visible {
  outline: 2px solid oklch(52% 0.16 250);
  outline-offset: 1px;
}

.lib-list {
  list-style: none;
  margin: 0;
  padding: 0;
  overflow-y: auto;
  flex: 1;
  /* bottom padding to ensure last item isn't hidden by bulk bar */
  padding-bottom: 80px;
}

.lib-list__empty {
  padding: 16px 0;
  font-size: 13px;
  color: oklch(50% 0.01 75);
  font-style: italic;
}

.lib-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  border-bottom: 1px solid oklch(93% 0.005 75);
  cursor: grab;
}

.lib-row:last-child { border-bottom: none; }

.lib-row--selected { background: oklch(95% 0.04 250 / 40%); border-radius: 6px; }

.lib-row__check {
  width: 15px;
  height: 15px;
  flex-shrink: 0;
  accent-color: oklch(52% 0.16 250);
  cursor: pointer;
}

.lib-row__thumb {
  width: 34px;
  height: 34px;
  border-radius: 5px;
  overflow: hidden;
  border: 1px solid oklch(88% 0.01 250);
  flex-shrink: 0;
}

.lib-row__title {
  flex: 1;
  font-size: 13px;
  font-weight: 500;
  color: oklch(22% 0.01 75);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

.lib-row__add-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 7px;
  border: 1px solid oklch(86% 0.008 75);
  background: oklch(96% 0.004 75);
  color: oklch(35% 0.01 75);
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.12s;
}

.lib-row__add-btn:hover { background: oklch(91% 0.007 75); }
.lib-row__add-btn:disabled { opacity: 0.4; cursor: not-allowed; }

/* Task 4.2 — Library bulk action bar */
.lib-bulk-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: oklch(99% 0.003 75);
  border-top: 1px solid oklch(88% 0.008 75);
  padding: 10px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  box-shadow: 0 -4px 14px oklch(10% 0.01 75 / 8%);
}

.lib-bulk-bar__count {
  font-size: 12px;
  font-weight: 600;
  color: oklch(45% 0.01 75);
}

.lib-bulk-bar__actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.lib-bulk-label {
  font-size: 12px;
  font-weight: 600;
  color: oklch(45% 0.01 75);
  white-space: nowrap;
}

.lib-bulk-select {
  font: inherit;
  font-size: 12px;
  padding: 6px 8px;
  border: 1px solid oklch(86% 0.008 75);
  border-radius: 7px;
  background: oklch(99% 0.003 75);
  color: oklch(20% 0.01 75);
  flex: 1;
}

/* ================================================================
   Task 5.1 — In-cookbook bulk action bar (fixed to viewport bottom)
   ================================================================ */

.bulk-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: oklch(20% 0.015 75);
  color: oklch(97% 0.004 75);
  padding: 14px 32px;
  display: flex;
  align-items: center;
  gap: 16px;
  z-index: 500;
  box-shadow: 0 -4px 24px oklch(10% 0.01 75 / 25%);
  flex-wrap: wrap;
}

.bulk-bar__count {
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
}

.bulk-bar__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  flex-wrap: wrap;
}

.bulk-bar__label {
  font-size: 13px;
  font-weight: 600;
  color: oklch(80% 0.008 75);
  white-space: nowrap;
}

.bulk-bar__select {
  font: inherit;
  font-size: 13px;
  padding: 7px 10px;
  border: 1px solid oklch(50% 0.012 75);
  border-radius: 8px;
  background: oklch(25% 0.015 75);
  color: oklch(97% 0.004 75);
}

.bulk-bar__btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  border: 1px solid oklch(50% 0.012 75);
  background: oklch(28% 0.018 75);
  color: oklch(97% 0.004 75);
  cursor: pointer;
  transition: background 0.12s;
  white-space: nowrap;
}

.bulk-bar__btn:hover { background: oklch(34% 0.018 75); }

.bulk-bar__btn--danger {
  background: none;
  border-color: oklch(65% 0.15 25);
  color: oklch(80% 0.1 25);
}

.bulk-bar__btn--danger:hover { background: oklch(30% 0.08 25); }

.bulk-bar__btn--ghost {
  background: none;
  border-color: oklch(50% 0.01 75);
  color: oklch(75% 0.008 75);
}

.bulk-bar__btn--ghost:hover { background: oklch(28% 0.01 75); }

/* ================================================================
   Modals (titles / buttons / forms)
   ================================================================ */

.modal-title {
  font-family: 'Newsreader', Georgia, serif;
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 12px;
  color: oklch(18% 0.01 75);
}

.modal-body {
  font-size: 14px;
  color: oklch(35% 0.01 75);
  line-height: 1.6;
  margin: 0 0 20px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 20px;
}

.modal-btn {
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: background 0.12s;
}

.modal-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.modal-btn--primary {
  background: oklch(20% 0.015 75);
  color: oklch(98% 0.004 75);
}

.modal-btn--primary:hover:not(:disabled) { background: oklch(28% 0.02 75); }

.modal-btn--ghost {
  background: oklch(93% 0.006 75);
  color: oklch(25% 0.01 75);
  border: 1px solid oklch(86% 0.008 75);
}

.modal-btn--ghost:hover:not(:disabled) { background: oklch(88% 0.008 75); }

.modal-btn--danger {
  background: oklch(45% 0.18 25);
  color: oklch(98% 0.004 75);
}

.modal-btn--danger:hover:not(:disabled) { background: oklch(38% 0.18 25); }

/* ================================================================
   Modal form fields
   ================================================================ */

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.form-field--checkbox {
  flex-direction: row;
  align-items: center;
  gap: 10px;
}

.form-label {
  font-size: 12px;
  font-weight: 700;
  color: oklch(48% 0.01 75);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.form-input {
  font: inherit;
  font-size: 14px;
  padding: 9px 12px;
  border: 1px solid oklch(85% 0.008 75);
  border-radius: 8px;
  background: oklch(99.3% 0.002 75);
  color: oklch(18% 0.01 75);
}

.form-input:focus-visible {
  outline: 2px solid oklch(52% 0.16 250);
  outline-offset: 1px;
  border-color: oklch(52% 0.16 250);
}

/* Accent color swatches inside modal */
.swatches {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  padding: 4px 0;
}

.swatch {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  box-shadow: 0 0 0 2px oklch(99% 0 0);
  transition: transform 0.15s;
}

.swatch--active {
  border-color: oklch(20% 0.015 75);
  transform: scale(1.15);
}

.swatch:focus-visible { outline: 2px solid oklch(52% 0.16 250); outline-offset: 2px; }

/* ================================================================
   Transitions
   ================================================================ */

.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.22s ease, opacity 0.22s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

/* ================================================================
   Utility
   ================================================================ */

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.empty-state {
  padding: 48px 0;
  text-align: center;
  color: oklch(55% 0.01 75);
  font-size: 15px;
}

/* Buttons inherit font */
button { font: inherit; }
button:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
