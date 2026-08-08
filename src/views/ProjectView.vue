<script setup>
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useProjectsStore } from '../stores/projects'
import { useRecipesStore } from '../stores/recipes'
import RecipePreviewDialog from '../components/RecipePreviewDialog.vue'
import ChapterCard from '../components/ChapterCard.vue'
import LibrarySidebarPanel from '../components/LibrarySidebarPanel.vue'
import BulkActionBar from '../components/BulkActionBar.vue'
import ConfirmDialog from '../components/ConfirmDialog.vue'
import EditCookbookModal from '../components/EditCookbookModal.vue'
import ChapterNameModal from '../components/ChapterNameModal.vue'
import BackButton from '../components/BackButton.vue'
import { sequenceForInsertAfter } from '../js/sequence'
import { applyRange } from '../js/rangeSelect'
import { intersectExistingRecipeIds } from '../js/cookbookImportShortcut'

// ---------------------------------------------------------------------------
// Props / stores
// ---------------------------------------------------------------------------

const props = defineProps({
  projectId: { type: String, required: true },
})

const router = useRouter()
const route = useRoute()
const projectsStore = useProjectsStore()
const recipesStore = useRecipesStore()

onMounted(async () => {
  if (!projectsStore.loaded) await projectsStore.load()
  if (!recipesStore.loaded) await recipesStore.load()
  checkReopenRecipe()
  applyAutoSelectIds()
})

// The recipe editor's "Back to Cookbook"/save-return path appends
// ?reopenRecipe=<id> (see RecipeEditor.vue's returnContext). Reopen that
// recipe's preview once chapters/recipes are loaded, then strip the param so
// a copied/bookmarked URL doesn't retrigger it.
watch(() => route.query.reopenRecipe, () => checkReopenRecipe())

function checkReopenRecipe() {
  const reopenId = route.query.reopenRecipe
  if (!reopenId) return
  const targetId = Number(reopenId)
  for (const chapter of orderedChapters.value) {
    const entry = recipesInChapter(chapter.id).find((e) => e.recipe.id === targetId)
    if (entry) {
      openPreview(entry.recipe, chapter.id)
      break
    }
  }
  const { reopenRecipe, ...rest } = route.query
  router.replace({ path: route.path, query: rest })
}

// ---------------------------------------------------------------------------
// Cookbook-page import shortcut (openspec: cookbook-import-shortcut)
// ---------------------------------------------------------------------------

function startCookbookImport() {
  router.push({
    name: 'recipe-import',
    query: { returnToProject: props.projectId },
  })
}

// Consumes `history.state.autoSelectIds` left behind by RecipeImport.vue's
// post-confirm redirect (see Decision 3 in the change's design.md): populates
// the library selection so the always-visible "Add Recipes" sidebar shows the
// newly-imported recipes pre-checked, then clears the state so a later
// back-navigation to this page doesn't re-trigger the pre-selection.
function applyAutoSelectIds() {
  const ids = history.state?.autoSelectIds
  if (!Array.isArray(ids) || !ids.length) return

  const validIds = intersectExistingRecipeIds(ids, recipesStore.recipes)
  if (validIds.length) {
    libSelectedIds.value = new Set(validIds)
    nextTick(() => {
      document.querySelector('.pv-sidebar')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  history.replaceState({ ...history.state, autoSelectIds: undefined }, '')
}

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
// Persistence failures
// ---------------------------------------------------------------------------

// db.js rejects a write whose row is already gone - deleted in another tab, or
// by a list this view is holding stale. Every write here goes through
// `persist`, which reports into one shared banner rather than per-handler
// error state: `modal` already carries five modes' worth of fields, and a
// stale-row failure is not retryable from the dialog that raised it. So the
// modal closes on failure and the banner, which sits below the sticky header
// and outside the scrolling region, says what did not happen.
const errorMsg = ref('')

async function persist(description, run) {
  errorMsg.value = ''
  try {
    await run()
    return true
  } catch (err) {
    errorMsg.value = `Could not ${description}: ${err.message}`
    return false
  }
}

// ---------------------------------------------------------------------------
// Task 2.1 — Selection state
// ---------------------------------------------------------------------------

// selectedIds: Set of projectRecipe.id values for in-cookbook bulk actions
const selectedIds = ref(new Set())

// libSelectedIds: Set of recipe.id values for library bulk actions
const libSelectedIds = ref(new Set())

// Shift+click range-select anchors. Chapter ranges are scoped to a single
// chapter (mirrors "Select all" being per-chapter) - a shift-click against a
// different chapter, or against an id no longer in the current list (e.g.
// the library search changed), falls back to a plain toggle.
const lastClickedPr = ref(null) // { chapterId, prId } | null
const lastClickedLibId = ref(null)

function toggleSelect(prId, chapterId, event) {
  if (event?.shiftKey && lastClickedPr.value?.chapterId === chapterId) {
    const ids = recipesInChapter(chapterId).map((e) => e.pr.id)
    const ranged = applyRange(selectedIds.value, ids, lastClickedPr.value.prId, prId, !selectedIds.value.has(prId))
    if (ranged) {
      selectedIds.value = ranged
      lastClickedPr.value = { chapterId, prId }
      return
    }
  }
  const s = new Set(selectedIds.value)
  if (s.has(prId)) s.delete(prId)
  else s.add(prId)
  selectedIds.value = s
  lastClickedPr.value = { chapterId, prId }
}

function toggleLibSelect(recipeId, event) {
  if (event?.shiftKey && lastClickedLibId.value !== null) {
    const ids = availableRecipes.value.map((r) => r.id)
    const ranged = applyRange(libSelectedIds.value, ids, lastClickedLibId.value, recipeId, !libSelectedIds.value.has(recipeId))
    if (ranged) {
      libSelectedIds.value = ranged
      lastClickedLibId.value = recipeId
      return
    }
  }
  const s = new Set(libSelectedIds.value)
  if (s.has(recipeId)) s.delete(recipeId)
  else s.add(recipeId)
  libSelectedIds.value = s
  lastClickedLibId.value = recipeId
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

function selectAllInLibrary() {
  const ids = availableRecipes.value.map((r) => r.id)
  const s = new Set(libSelectedIds.value)
  const allSelected = ids.every((id) => s.has(id))
  if (allSelected) {
    ids.forEach((id) => s.delete(id))
  } else {
    ids.forEach((id) => s.add(id))
  }
  libSelectedIds.value = s
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

const previewChapterId = ref(null)
const previewIndex = ref(-1)

const previewChapterRecipes = computed(() => {
  if (previewChapterId.value == null) return []
  return recipesInChapter(previewChapterId.value).map((e) => e.recipe)
})

const previewRecipe = computed(() => previewChapterRecipes.value[previewIndex.value] ?? null)

function openPreview(recipe, chapterId) {
  previewChapterId.value = chapterId
  previewIndex.value = recipesInChapter(chapterId).findIndex((e) => e.recipe.id === recipe.id)
}

function closePreview() {
  previewChapterId.value = null
  previewIndex.value = -1
}

function navigatePreview(delta) {
  const next = previewIndex.value + delta
  if (next < 0 || next >= previewChapterRecipes.value.length) return
  previewIndex.value = next
}

function editPreviewRecipe() {
  const r = previewRecipe.value
  if (r) {
    router.push({
      path: `/library/${r.id}`,
      query: { returnToProject: project.value.id, returnToRecipe: r.id },
    })
  }
}


// ---------------------------------------------------------------------------
// Cookbook actions
// ---------------------------------------------------------------------------

async function confirmDeleteChapter() {
  if (modalBusy.value || !modal.deletingChapter) return
  const { id, name } = modal.deletingChapter
  modalBusy.value = true
  try {
    if (await persist(`delete "${name}"`, () => projectsStore.removeChapter(id))) {
      announce(`Chapter "${name}" deleted.`)
    }
    modal.type = null
  } finally {
    modalBusy.value = false
  }
}

async function saveEditCookbook() {
  if (modalBusy.value) return
  modalBusy.value = true
  try {
    await persist('save these cookbook details', () =>
      projectsStore.editProject(projectIdNum.value, {
        title: modal.editTitle.trim(),
        subtitle: modal.editSubtitle.trim(),
        accentColor: modal.editAccent,
      }),
    )
    modal.type = null
  } finally {
    modalBusy.value = false
  }
}

function updateField(field, value) {
  persist('save these cookbook details', () =>
    projectsStore.editProject(projectIdNum.value, { [field]: value }),
  )
}

// Chapter name form submission (shared modal for new/rename/newFromSelection/newFromLibrary)
async function submitChapterName() {
  if (modalBusy.value) return
  const name = modal.chapterNameValue.trim()
  if (!name) return
  const mode = modal.chapterNameMode
  const targetId = modal.chapterNameTargetId
  modalBusy.value = true
  try {
    if (mode === 'rename') {
      const ok = await persist('rename this chapter', () =>
        projectsStore.editChapter(targetId, { name }),
      )
      if (ok) announce(`Chapter renamed to "${name}".`)
    } else {
      // Creating the chapter and populating it are two transactions, so they
      // report separately: if the second fails the chapter still exists, and
      // one combined message would imply nothing had happened.
      let chapterId = null
      const created = await persist(`create chapter "${name}"`, async () => {
        chapterId = await projectsStore.createChapter(projectIdNum.value, name)
      })
      if (created && mode === 'new') {
        announce(`Chapter "${name}" created.`)
      } else if (created && mode === 'newFromSelection') {
        // Read before the move, which clears the selection.
        const count = selectedIds.value.size
        const moved = await persist(`move the selected recipes into "${name}"`, () =>
          bulkMoveToChapter(chapterId),
        )
        if (moved) announce(`Chapter "${name}" created with ${count} recipes.`)
      } else if (created && mode === 'newFromLibrary') {
        await addLibrarySelection(Array.from(libSelectedIds.value), chapterId, name)
      }
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
  const prId = modal.removingPr.id
  const title = modal.removingTitle
  modalBusy.value = true
  try {
    const ok = await persist(`remove "${title}"`, () =>
      projectsStore.removeProjectRecipe(prId),
    )
    if (ok) {
      selectedIds.value = new Set([...selectedIds.value].filter((id) => id !== prId))
      announce(`"${title}" removed from cookbook.`)
    }
    modal.type = null
  } finally {
    modalBusy.value = false
  }
}

async function moveRecipeToChapter(pr, newChapterId) {
  const target = Number(newChapterId)
  if (target === pr.chapterId) return
  // db.js derives the sequence inside the same transaction as the write, so
  // this doesn't recompute one from a possibly stale in-memory chapter.
  const ok = await persist('move this recipe', () =>
    projectsStore.moveProjectRecipesToChapter([pr.id], target),
  )
  if (ok) announce(`Recipe moved to new chapter.`)
}

// ---------------------------------------------------------------------------
// Sorting
// ---------------------------------------------------------------------------

async function sortChapterAZ(chapterId) {
  const sorted = [...recipesInChapter(chapterId)].sort((a, b) =>
    (a.recipe.title ?? '').localeCompare(b.recipe.title ?? ''),
  )
  // One transaction, not N independent writes - a partial failure here would
  // leave the chapter half-sorted.
  const ok = await persist('sort this chapter', () =>
    projectsStore.resequenceProjectRecipes(sorted.map(({ pr }) => pr.id)),
  )
  if (ok) announce('Recipes sorted A–Z.')
}

// ---------------------------------------------------------------------------
// Task 5.2 — Bulk operations (in-cookbook)
// ---------------------------------------------------------------------------

// Throws on failure; the two callers wrap it, since one of them (the
// new-chapter-from-selection flow) has more to report than just this step.
async function bulkMoveToChapter(chapterId) {
  const ids = Array.from(selectedIds.value)
  await projectsStore.moveProjectRecipesToChapter(ids, chapterId)
  clearSelection()
}

const bulkMoveTarget = ref('')
async function doBulkMove() {
  if (!bulkMoveTarget.value) return
  // Both read before the move, which clears the selection and the select.
  const count = selectedIds.value.size
  const target = Number(bulkMoveTarget.value)
  bulkMoveTarget.value = ''
  const ok = await persist('move the selected recipes', () => bulkMoveToChapter(target))
  if (ok) announce(`Moved ${count} recipe${count !== 1 ? 's' : ''}.`)
}

async function confirmBulkRemove() {
  if (modalBusy.value) return
  const ids = Array.from(selectedIds.value)
  modalBusy.value = true
  try {
    const ok = await persist('remove the selected recipes', () =>
      projectsStore.removeProjectRecipes(ids),
    )
    if (ok) {
      clearSelection()
      announce(`${ids.length} recipe${ids.length !== 1 ? 's' : ''} removed from cookbook.`)
    }
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
    await persist(`add "${recipe.title}"`, async () => {
      const prId = await projectsStore.addRecipeToProject(projectIdNum.value, recipe.id)
      // Same idempotent-add as onRecipeDrop: a recipe already in the cookbook
      // reconciles to its existing placement (which may not be Miscellaneous,
      // the implicit target here) rather than adding a second row.
      const misc = projectsStore.chaptersForProject(projectIdNum.value).find((c) => c.isDefault)
      const placed = projectsStore.projectRecipes.find((pr) => pr.id === prId)
      announce(
        placed?.chapterId === misc?.id
          ? `"${recipe.title}" added to cookbook.`
          : `"${recipe.title}" is already in this cookbook.`,
      )
    })
  } finally {
    addingRecipeId.value = null
  }
}

// Both library bulk-adds go through one transactional store call. db.js reports
// recipes already in the cookbook rather than adding them twice, so the count
// announced is what was actually written, not what was selected.
async function addLibrarySelection(recipeIds, chapterId, destination) {
  const ok = await persist(`add the selected recipes to ${destination}`, async () => {
    const { added, duplicates } = await projectsStore.addRecipesToProject(
      projectIdNum.value,
      recipeIds,
      chapterId,
    )
    clearLibSelection()
    const skipped = duplicates.length
      ? ` ${duplicates.length} already in this cookbook.`
      : ''
    announce(
      `${added.length} recipe${added.length !== 1 ? 's' : ''} added to ${destination}.${skipped}`,
    )
  })
  return ok
}

// Library bulk — "Add to chapter…" select
const libBulkChapterTarget = ref('')
async function libBulkAddToChapter() {
  if (!libBulkChapterTarget.value || !libSelectedIds.value.size) return
  const chapterId = Number(libBulkChapterTarget.value)
  const chapterName = orderedChapters.value.find((c) => c.id === chapterId)?.name ?? 'chapter'
  const recipeIds = Array.from(libSelectedIds.value)
  libBulkChapterTarget.value = ''
  await addLibrarySelection(recipeIds, chapterId, chapterName)
}

async function libBulkAddToMisc() {
  if (!libSelectedIds.value.size) return
  await addLibrarySelection(Array.from(libSelectedIds.value), null, 'Miscellaneous')
}

// ---------------------------------------------------------------------------
// Task 6.1 — Chapter drag-and-drop
// ---------------------------------------------------------------------------

const dragChapterId = ref(null)
// id of the custom chapter the dragged chapter would land after; null means
// "insert before all custom chapters" (there's no drop-between-Miscellaneous
// since it's always last and never a drag target).
const dropChapterAfterId = ref(null)

function customChaptersExcluding(excludeId) {
  return orderedChapters.value.filter((c) => !c.isDefault && c.id !== excludeId)
}

function onChapterDragStart(e, chapterId) {
  dragChapterId.value = chapterId
  e.dataTransfer.effectAllowed = 'move'
  e.dataTransfer.setData('text/plain', `chapter:${chapterId}`)
}

// Reports where the dragged chapter would land relative to `chapterId` -
// before it or after it, based on which half of the card the pointer is
// over - so the highlight is an insertion line between two chapters rather
// than "this whole chapter is the drop target."
function onChapterDragOver(e, chapterId) {
  if (dragChapterId.value === null || chapterId === dragChapterId.value) return
  const destChapter = orderedChapters.value.find((c) => c.id === chapterId)
  if (!destChapter || destChapter.isDefault) return
  e.preventDefault()
  e.dataTransfer.dropEffect = 'move'
  const rect = e.currentTarget.getBoundingClientRect()
  const before = e.clientY < rect.top + rect.height / 2
  const siblings = customChaptersExcluding(dragChapterId.value)
  const idx = siblings.findIndex((c) => c.id === chapterId)
  dropChapterAfterId.value = before ? (idx > 0 ? siblings[idx - 1].id : null) : chapterId
}

function onChapterDragLeave() {
  dropChapterAfterId.value = null
}

async function onChapterDrop(e, targetChapterId) {
  e.preventDefault()
  const srcId = dragChapterId.value
  const afterId = dropChapterAfterId.value
  dragChapterId.value = null
  dropChapterAfterId.value = null
  if (srcId === null || srcId === targetChapterId) return
  const destChapter = orderedChapters.value.find((c) => c.id === targetChapterId)
  if (!destChapter || destChapter.isDefault) return
  const siblings = customChaptersExcluding(srcId)
  const newSequence = sequenceForInsertAfter(siblings, afterId)
  const ok = await persist('move this chapter', () =>
    projectsStore.moveChapter(srcId, { sequence: newSequence }),
  )
  if (ok) announce(`Chapter moved.`)
}

// The move up/down buttons; the store call rejects for a chapter another tab
// deleted, so it can't be bound straight to `@click`.
async function moveChapter(chapter, direction) {
  let moved = false
  const ok = await persist(`move "${chapter.name}"`, async () => {
    moved = await projectsStore.reorderChapter(chapter.id, direction)
  })
  if (ok && moved) announce(`Chapter moved.`)
}

// Recipe-row up/down equivalent of moveChapter, for keyboard/screen-reader
// users who can't use the row's drag handle to reorder within a chapter.
async function moveRecipe(pr, recipe, direction) {
  const ok = await persist(`move "${recipe.title}"`, () =>
    projectsStore.reorderProjectRecipe(pr.id, direction),
  )
  if (ok) announce(`"${recipe.title}" moved.`)
}

function onChapterDragEnd() {
  dragChapterId.value = null
  dropChapterAfterId.value = null
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
  // Stop this from bubbling up to the chapter card's own draggable div: a
  // non-default chapter card is draggable too (for chapter reordering), and
  // dragstart bubbles, so without this the chapter-level handler would also
  // fire and treat the recipe drag as a chapter drag.
  e.stopPropagation()
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

// `pr` is the row being hovered, or null when hovering the chapter's list
// container directly (blank space below the rows, or an empty chapter).
// Reordering within the recipe's own chapter reports an insertion point
// (before/after the hovered row, from which half of it the pointer is over);
// moving into a different chapter always appends at the end (that's what
// moveRecipeToChapter actually does), so the insertion point there is
// pinned to "after the last row" rather than tracking the pointer.
function onRecipeDragOver(e, chapterId, pr = null) {
  if (dragRecipePrId.value === null && dragLibRecipeId.value === null) return
  e.preventDefault()
  e.stopPropagation()
  e.dataTransfer.dropEffect = dragLibRecipeId.value ? 'copy' : 'move'
  dropChapterId.value = chapterId

  const siblings = projectsStore
    .projectRecipesForChapter(chapterId)
    .filter((p) => p.id !== dragRecipePrId.value)
  const reordering = dragRecipePrId.value !== null && chapterId === chapterIdOfProjectRecipe(dragRecipePrId.value)
  if (!reordering || pr === null) {
    dropAfterPrId.value = siblings.length ? siblings[siblings.length - 1].id : null
    return
  }
  const rect = e.currentTarget.getBoundingClientRect()
  const before = e.clientY < rect.top + rect.height / 2
  const idx = siblings.findIndex((p) => p.id === pr.id)
  dropAfterPrId.value = before ? (idx > 0 ? siblings[idx - 1].id : null) : pr.id
}

function chapterIdOfProjectRecipe(prId) {
  return projectsStore.projectRecipes.find((p) => p.id === prId)?.chapterId ?? null
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
  e.stopPropagation()
  const afterId = dropAfterPrId.value
  dropChapterId.value = null
  dropAfterPrId.value = null

  if (dragLibRecipeId.value !== null) {
    // Add library recipe to cookbook in this chapter
    const rid = dragLibRecipeId.value
    dragLibRecipeId.value = null
    const recipe = recipesStore.recipes.find((r) => r.id === rid)
    if (!recipe) return
    await persist(`add "${recipe.title}"`, async () => {
      const prId = await projectsStore.addRecipeToProject(projectIdNum.value, rid, targetChapterId)
      // The add is idempotent: a recipe already in the cookbook reconciles to
      // its existing placement rather than moving here, so the confirmation has
      // to reflect where it actually is.
      const placed = projectsStore.projectRecipes.find((pr) => pr.id === prId)
      announce(
        placed?.chapterId === targetChapterId
          ? `"${recipe.title}" added to chapter.`
          : `"${recipe.title}" is already in this cookbook.`,
      )
    })
    return
  }

  if (dragRecipePrId.value !== null) {
    const prId = dragRecipePrId.value
    dragRecipePrId.value = null
    const pr = projectsStore.projectRecipes.find((p) => p.id === prId)
    if (!pr) return

    if (pr.chapterId === targetChapterId) {
      // Reorder within chapter — drop after afterId, or at the top if null
      const siblings = projectsStore.projectRecipesForChapter(targetChapterId).filter((p) => p.id !== prId)
      const newSeq = sequenceForInsertAfter(siblings, afterId)
      const ok = await persist('reorder this recipe', () =>
        projectsStore.moveProjectRecipe(prId, { sequence: newSeq }),
      )
      if (ok) announce('Recipe reordered.')
    } else {
      // Move to different chapter
      await moveRecipeToChapter(pr, targetChapterId)
    }
  }
}

function onRecipeDragEnd(e) {
  e.stopPropagation()
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

onUnmounted(() => {
  document.removeEventListener('click', closeMenus)
})

// ---------------------------------------------------------------------------
// Grouped props for the extracted view components below. ProjectView.vue
// keeps ownership of every store write and the shared persist/announce
// plumbing; these components only render and forward interactions, so
// extracting them isn't a behavior change, just a markup split.
// ---------------------------------------------------------------------------

const dragState = computed(() => ({
  dragChapterId: dragChapterId.value,
  dropChapterAfterId: dropChapterAfterId.value,
  dragRecipePrId: dragRecipePrId.value,
  dropChapterId: dropChapterId.value,
  dropAfterPrId: dropAfterPrId.value,
}))

const chapterCardHandlers = {
  onChapterDragStart,
  onChapterDragOver,
  onChapterDragLeave,
  onChapterDrop,
  onChapterDragEnd,
  onRecipeDragOver,
  onChapterAreaDragLeave,
  onRecipeDrop,
  onRecipeDragStart,
  onRecipeDragEnd,
  onSelectAll: selectAllInChapter,
  onSortAZ: sortChapterAZ,
  onMoveChapter: moveChapter,
  onDeleteChapter: openDeleteChapter,
  onRenameChapter: (chapterId, name) => openChapterNameModal('rename', chapterId, name),
  onToggleSelect: toggleSelect,
  onMoveRecipe: moveRecipe,
  onOpenPreview: openPreview,
  onToggleMenu: toggleMenu,
  onMoveRecipeToChapter: moveRecipeToChapter,
  onOpenRemoveRecipe: openRemoveRecipe,
}

const librarySidebarHandlers = {
  onNewChapter: () => openChapterNameModal('new'),
  onToggleLibSelect: toggleLibSelect,
  onLibSelectAll: selectAllInLibrary,
  onLibRecipeDragStart,
  onRecipeDragEnd,
  onQuickAdd: quickAddRecipe,
  onLibBulkAddToChapter: libBulkAddToChapter,
  onLibBulkAddToMisc: libBulkAddToMisc,
  onNewChapterFromLibrary: () => openChapterNameModal('newFromLibrary'),
}

const bulkActionHandlers = {
  onMove: doBulkMove,
  onNewChapterFromSelection: () => openChapterNameModal('newFromSelection'),
  onBulkRemove: openBulkRemove,
  onClear: clearSelection,
}
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
    <p style="color: var(--gray-46);">Project not found.</p>
  </div>

  <!-- Task 1.1 + 1.2: Two-column stack layout with inline header -->
  <main v-else id="cm-main" class="cm-page-main" style="padding-bottom: 140px;">

    <!-- Header row -->
    <div style="display:flex; align-items:flex-end; justify-content:space-between; gap:16px; margin-bottom:28px; flex-wrap:wrap;">
      <div>
        <BackButton to="/" style="margin-bottom:4px;">Cookbooks</BackButton>
        <div style="display:flex; align-items:center; gap:8px;">
          <h1 class="text-page-title">{{ project.title || 'Untitled Cookbook' }}</h1>
          <button
            type="button"
            class="btn-icon"
            style="width: 30px; height: 30px;"
            aria-label="Edit cookbook details"
            title="Edit cookbook details"
            @click="openEditCookbook"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
        </div>
        <p v-if="project.subtitle" style="margin:0; font-size:15px; color:var(--gray-46);">{{ project.subtitle }}</p>
      </div>
      <div style="display:flex; gap:10px; flex-wrap:wrap;">
        <button type="button" class="btn-new" @click="startCookbookImport">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Import Recipes
        </button>
        <router-link class="btn-new" :to="`/projects/${project.id}/print`">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v8H6z"/></svg>
          Print Preview
        </router-link>
      </div>
    </div>

    <!-- Shared surface for every failed write in this view; see `persist`.
         Sits outside the scrolling region so it is visible wherever the
         failure was triggered from. -->
    <div v-if="errorMsg" class="pv-error" role="alert" style="margin-bottom: 24px; border-radius: 8px;">
      <span class="pv-error__text">{{ errorMsg }}</span>
      <button
        type="button"
        class="pv-error__dismiss"
        aria-label="Dismiss error"
        @click="errorMsg = ''"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>

    <!-- Content area: main + sidebar -->
    <div style="display: grid; grid-template-columns: 1fr 340px; gap: 32px; align-items: start;">

      <!-- Main content -->
      <div>
        <!-- Chapters -->
        <ChapterCard
          v-for="chapter in orderedChapters"
          :key="chapter.id"
          :chapter="chapter"
          :recipes="recipesInChapter(chapter.id)"
          :ordered-chapters="orderedChapters"
          :selected-ids="selectedIds"
          :open-menu-pr-id="openMenuPrId"
          :project-id="project.id"
          :drag-state="dragState"
          :handlers="chapterCardHandlers"
        />

        <!-- Empty state -->
        <div v-if="orderedChapters.length === 0" class="empty-state">
          <p>No chapters yet. Use the "New Chapter" form in the sidebar to get started.</p>
        </div>
      </div>

      <!-- Recipe Library Sidebar -->
      <LibrarySidebarPanel
        v-model:library-search="librarySearch"
        v-model:lib-bulk-chapter-target="libBulkChapterTarget"
        :ordered-chapters="orderedChapters"
        :available-recipes="availableRecipes"
        :lib-selected-ids="libSelectedIds"
        :adding-recipe-id="addingRecipeId"
        :handlers="librarySidebarHandlers"
      />
    </div>

    <!-- In-cookbook bulk action bar -->
    <BulkActionBar
      v-model:bulk-move-target="bulkMoveTarget"
      :count="selectedIds.size"
      :ordered-chapters="orderedChapters"
      :handlers="bulkActionHandlers"
    />
  </main>

  <!-- Delete Chapter modal (double confirmation) -->
  <ConfirmDialog
    v-if="modal.type === 'deleteChapter'"
    title-id="modal-delete-chapter-title"
    heading="Delete Chapter"
    confirm-label="Delete chapter"
    busy-label="Deleting…"
    :busy="modalBusy"
    @close="closeModal"
    @confirm="confirmDeleteChapter"
  >
    Delete <strong>{{ modal.deletingChapter?.name }}</strong>?
    Its recipes will be moved to the Miscellaneous chapter.
  </ConfirmDialog>

  <!-- Remove Recipe modal -->
  <ConfirmDialog
    v-if="modal.type === 'removeRecipe'"
    title-id="modal-remove-recipe-title"
    heading="Remove Recipe"
    confirm-label="Remove recipe"
    busy-label="Removing…"
    :busy="modalBusy"
    @close="closeModal"
    @confirm="confirmRemoveRecipe"
  >
    Remove <strong>{{ modal.removingTitle }}</strong> from this cookbook?
    It will remain in the Global Recipe Library.
  </ConfirmDialog>

  <!-- Bulk Remove modal -->
  <ConfirmDialog
    v-if="modal.type === 'bulkRemove'"
    title-id="modal-bulk-remove-title"
    heading="Remove Recipes"
    :confirm-label="`Remove ${selectedIds.size} recipe${selectedIds.size !== 1 ? 's' : ''}`"
    busy-label="Removing…"
    :busy="modalBusy"
    @close="closeModal"
    @confirm="confirmBulkRemove"
  >
    Remove {{ selectedIds.size }} recipe{{ selectedIds.size !== 1 ? 's' : '' }} from this cookbook?
    They will remain in the Global Recipe Library.
  </ConfirmDialog>

  <!-- Edit Cookbook Details modal -->
  <EditCookbookModal
    v-if="modal.type === 'editCookbook'"
    v-model:title="modal.editTitle"
    v-model:subtitle="modal.editSubtitle"
    v-model:accent="modal.editAccent"
    :cover-template="project?.coverTemplate"
    :page-numbers-enabled="project?.pageNumbersEnabled"
    :busy="modalBusy"
    @update-field="updateField"
    @close="closeModal"
    @save="saveEditCookbook"
  />

  <!-- Shared Chapter Name modal -->
  <ChapterNameModal
    v-if="modal.type === 'chapterName'"
    v-model:value="modal.chapterNameValue"
    :heading="modal.chapterNameHeading"
    :subheading="modal.chapterNameSubheading"
    :busy="modalBusy"
    @close="closeModal"
    @submit="submitChapterName"
  />
  <!-- Recipe Preview Dialog -->
  <RecipePreviewDialog
    v-if="previewRecipe"
    :recipe="previewRecipe"
    :accent-color="project?.accentColor"
    :has-prev="previewIndex > 0"
    :has-next="previewIndex < previewChapterRecipes.length - 1"
    @close="closePreview"
    @edit="editPreviewRecipe"
    @navigate="navigatePreview"
  />
</template>

<style scoped>
/* Buttons */
.btn-new {
  display: flex; align-items: center; gap: 8px;
  background: var(--gray-20); color: var(--gray-99);
  border: none; border-radius: 8px; padding: 12px 20px;
  font-size: 15px; font-weight: 600; cursor: pointer; text-decoration: none;
}
.btn-new:hover { background: var(--gray-30); }
.btn-new:focus-visible { outline: 2px solid var(--color-focus); outline-offset: 2px; }
.btn-new:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-icon {
  display: inline-flex; align-items: center; justify-content: center;
  border-radius: 7px; border: 1px solid var(--gray-84);
  background: var(--gray-96); color: var(--gray-46);
  cursor: pointer; transition: background 0.12s, color 0.12s;
}
.btn-icon:hover { background: var(--gray-93); color: var(--gray-20); }

/* ================================================================
   Shared error banner
   ================================================================ */

.pv-error {
  flex-shrink: 0;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 10px 32px;
  background: oklch(95% 0.045 25);
  border-bottom: 1px solid oklch(82% 0.07 25);
  color: oklch(38% 0.12 25);
  font-size: 14px;
  font-weight: 600;
}

.pv-error__text {
  flex: 1;
  min-width: 0;
}

.pv-error__dismiss {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  border: none;
  background: none;
  color: inherit;
  cursor: pointer;
}

.pv-error__dismiss:hover { background: oklch(90% 0.06 25); }

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
  color: var(--gray-52);
  font-size: 15px;
}

/* Buttons inherit font */
button { font: inherit; }
button:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
