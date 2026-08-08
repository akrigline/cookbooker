<script setup>
import { computed } from 'vue'
import RecipeThumbnail from './RecipeThumbnail.vue'
import RecipeFitWarningBadge from './RecipeFitWarningBadge.vue'

const props = defineProps({
  chapter: { type: Object, required: true },
  // [{ pr, recipe }], precomputed by the parent so it's derived once per render
  // instead of once per template reference.
  recipes: { type: Array, required: true },
  orderedChapters: { type: Array, required: true },
  selectedIds: { type: Set, required: true },
  openMenuPrId: { type: [Number, String, null], default: null },
  projectId: { type: [Number, String], required: true },
  // { dragChapterId, dropChapterAfterId, dragRecipePrId, dropChapterId, dropAfterPrId }
  dragState: { type: Object, required: true },
  // Grouped callbacks - ProjectView.vue keeps ownership of every store write
  // and the shared error/announce plumbing; this component only forwards
  // interactions, so extracting it isn't a change in behavior, just markup.
  handlers: { type: Object, required: true },
})

const allSelected = computed(
  () => props.recipes.length > 0 && props.recipes.every(({ pr }) => props.selectedIds.has(pr.id)),
)
const someSelected = computed(() => props.recipes.some(({ pr }) => props.selectedIds.has(pr.id)))

// Chapter reordering shows an insertion line between two existing chapters
// (rather than highlighting a whole chapter as "the" drop target), matching
// the recipe-row insertion lines below.
const customChapters = computed(() => props.orderedChapters.filter((c) => !c.isDefault))
const isFirstCustomChapter = computed(() => customChapters.value[0]?.id === props.chapter.id)
const showChapterLineAbove = computed(
  () => props.dragState.dragChapterId !== null && isFirstCustomChapter.value && props.dragState.dropChapterAfterId === null,
)
const showChapterLineBelow = computed(
  () => props.dragState.dragChapterId !== null && props.dragState.dropChapterAfterId === props.chapter.id,
)

// Recipe row insertion line: above the first row when dropAfterPrId is null,
// otherwise below whichever row it names.
function dropLineAbove(recipeIndex) {
  return props.dragState.dropChapterId === props.chapter.id && recipeIndex === 0 && props.dragState.dropAfterPrId === null
}
function dropLineBelow(pr) {
  return props.dragState.dropChapterId === props.chapter.id && props.dragState.dropAfterPrId === pr.id
}
</script>

<template>
  <div
    class="chapter-card"
    :class="{
      'chapter-card--dragging': dragState.dragChapterId === chapter.id,
      'chapter-card--drop-line-above': showChapterLineAbove,
      'chapter-card--drop-line-below': showChapterLineBelow,
    }"
    :draggable="!chapter.isDefault"
    @dragstart="!chapter.isDefault && handlers.onChapterDragStart($event, chapter.id)"
    @dragover="handlers.onChapterDragOver($event, chapter.id)"
    @dragleave="handlers.onChapterDragLeave"
    @drop="handlers.onChapterDrop($event, chapter.id)"
    @dragend="handlers.onChapterDragEnd"
  >
    <!-- Chapter Card header row -->
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
        <label class="chapter-select-all" :title="allSelected ? 'Deselect all' : 'Select all'">
          <input
            type="checkbox"
            :checked="allSelected"
            :indeterminate="!allSelected && someSelected"
            :aria-label="`Select all recipes in ${chapter.name}`"
            @change="handlers.onSelectAll(chapter.id)"
          />
          <span>Select all</span>
        </label>
        <!-- Sort A–Z -->
        <button
          type="button"
          class="chapter-action-btn"
          :aria-label="`Sort recipes in ${chapter.name} A–Z`"
          @click="handlers.onSortAZ(chapter.id)"
        >
          Sort A–Z
        </button>
        <!-- Move up/down (non-default chapters) -->
        <template v-if="!chapter.isDefault">
          <button
            type="button"
            class="chapter-action-btn"
            :aria-label="`Move chapter '${chapter.name}' up`"
            @click="handlers.onMoveChapter(chapter, -1)"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
          </button>
          <button
            type="button"
            class="chapter-action-btn"
            :aria-label="`Move chapter '${chapter.name}' down`"
            @click="handlers.onMoveChapter(chapter, 1)"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          <button
            type="button"
            class="chapter-action-btn chapter-action-btn--danger"
            :aria-label="`Delete chapter '${chapter.name}'`"
            @click="handlers.onDeleteChapter(chapter)"
          >
            Delete
          </button>
          <button
            type="button"
            class="chapter-action-btn"
            :aria-label="`Rename chapter '${chapter.name}'`"
            @click="handlers.onRenameChapter(chapter.id, chapter.name)"
          >
            Rename
          </button>
        </template>
      </div>
    </div>

    <!-- Recipe list drop zone -->
    <ul
      class="recipe-list"
      :class="{ 'recipe-list--drop-active': dragState.dropChapterId === chapter.id }"
      @dragover="handlers.onRecipeDragOver($event, chapter.id)"
      @dragleave="handlers.onChapterAreaDragLeave"
      @drop="handlers.onRecipeDrop($event, chapter.id)"
    >
      <li v-if="!recipes.length" class="recipe-list__empty">
        No recipes yet. Add from the library →
      </li>

      <!-- Recipe Row -->
      <li
        v-for="({ pr, recipe }, recipeIndex) in recipes"
        :key="pr.id"
        class="recipe-row"
        :class="{
          'recipe-row--selected': selectedIds.has(pr.id),
          'recipe-row--dragging': dragState.dragRecipePrId === pr.id,
          'recipe-row--drop-line-above': dropLineAbove(recipeIndex),
          'recipe-row--drop-line-below': dropLineBelow(pr),
        }"
        draggable="true"
        @dragstart="handlers.onRecipeDragStart($event, pr)"
        @dragover="handlers.onRecipeDragOver($event, chapter.id, pr)"
        @dragend="handlers.onRecipeDragEnd"
      >
        <!-- Checkbox -->
        <input
          type="checkbox"
          class="recipe-row__check"
          :checked="selectedIds.has(pr.id)"
          :aria-label="`Select '${recipe.title}'`"
          @click="handlers.onToggleSelect(pr.id, chapter.id, $event)"
        />
        <!-- Drag handle -->
        <span class="drag-handle recipe-row__drag" aria-hidden="true" title="Drag to reorder">
          <svg width="10" height="16" viewBox="0 0 10 16" fill="currentColor"><circle cx="2.5" cy="2.5" r="1.5"/><circle cx="7.5" cy="2.5" r="1.5"/><circle cx="2.5" cy="8" r="1.5"/><circle cx="7.5" cy="8" r="1.5"/><circle cx="2.5" cy="13.5" r="1.5"/><circle cx="7.5" cy="13.5" r="1.5"/></svg>
        </span>
        <!-- Keyboard/screen-reader equivalent of the drag handle above -->
        <span class="recipe-row__move" @click.stop>
          <button
            type="button"
            class="recipe-row__move-btn"
            :aria-label="`Move '${recipe.title}' up`"
            :disabled="recipeIndex === 0"
            @click="handlers.onMoveRecipe(pr, recipe, -1)"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
          </button>
          <button
            type="button"
            class="recipe-row__move-btn"
            :aria-label="`Move '${recipe.title}' down`"
            :disabled="recipeIndex === recipes.length - 1"
            @click="handlers.onMoveRecipe(pr, recipe, 1)"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
        </span>
        <!-- Thumbnail -->
        <div class="recipe-row__thumb">
          <RecipeThumbnail :image="recipe.image" :title="recipe.title" />
        </div>
        <!-- Title -->
        <a href="#" class="recipe-row__title" @click.prevent="handlers.onOpenPreview(recipe, chapter.id)">
          {{ recipe.title }}
          <RecipeFitWarningBadge v-if="recipe.fitsOnPage === false" />
        </a>
        <!-- Overflow menu -->
        <div class="recipe-row__menu-wrap" @click.stop>
          <button
            type="button"
            class="recipe-row__menu-btn"
            :aria-label="`Actions for '${recipe.title}'`"
            :aria-expanded="openMenuPrId === pr.id"
            @click="handlers.onToggleMenu(pr.id)"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>
          </button>
          <div v-if="openMenuPrId === pr.id" class="overflow-menu" role="menu">
            <button
              type="button"
              role="menuitem"
              @click="() => { handlers.onToggleMenu(null); handlers.onRenameChapter(chapter.id, chapter.name) }"
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
                @click="() => { handlers.onToggleMenu(null); handlers.onMoveRecipeToChapter(pr, c.id) }"
              >
                Move to: {{ c.name }}
              </button>
            </div>
            <hr />
            <router-link
              role="menuitem"
              :to="`/projects/${projectId}/recipes/${recipe.id}/print`"
              @click="handlers.onToggleMenu(null)"
            >
              Print recipe
            </router-link>
            <button
              type="button"
              role="menuitem"
              class="overflow-menu__danger"
              @click="() => { handlers.onToggleMenu(null); handlers.onOpenRemoveRecipe(pr, recipe.title) }"
            >
              Remove from cookbook
            </button>
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.chapter-card {
  position: relative;
  background: var(--gray-99);
  border: 1px solid var(--gray-88);
  border-radius: 14px;
  margin-bottom: 20px;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.chapter-card--dragging {
  opacity: 0.5;
}

/* Insertion-line indicators for chapter drag-and-drop: a line between two
   existing chapters, not a highlight around a whole chapter, so it's clear
   the drop repositions rather than swaps/merges. */
.chapter-card--drop-line-above::before,
.chapter-card--drop-line-below::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--color-focus);
  border-radius: 2px;
  z-index: 5;
}

.chapter-card--drop-line-above::before { top: -12px; }
.chapter-card--drop-line-below::after { bottom: -12px; }

.chapter-card__header {
  padding: 16px 20px 12px;
  border-bottom: 1px solid var(--gray-93);
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
  color: var(--gray-20);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chapter-badge {
  font-size: 11px;
  font-weight: 600;
  color: var(--gray-52);
  background: var(--gray-93);
  border: 1px solid var(--gray-84);
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
  color: var(--gray-46);
  cursor: pointer;
  user-select: none;
}

.chapter-select-all input[type='checkbox'] {
  width: 15px;
  height: 15px;
  cursor: pointer;
  accent-color: var(--color-focus);
}

.chapter-action-btn {
  background: var(--gray-96);
  border: 1px solid var(--gray-84);
  border-radius: 7px;
  padding: 5px 10px;
  font-size: 12px;
  font-weight: 600;
  color: var(--gray-30);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  transition: background 0.12s;
}

.chapter-action-btn:hover { background: var(--gray-93); }

.chapter-action-btn--danger {
  background: none;
  border-color: oklch(82% 0.06 25);
  color: oklch(45% 0.12 25);
}

.chapter-action-btn--danger:hover { background: oklch(95% 0.04 25); }

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
  color: var(--gray-52);
  font-style: italic;
  font-size: 14px;
}

.recipe-row {
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid var(--gray-93);
  cursor: grab;
  border-radius: 6px;
  transition: background 0.1s;
}

.recipe-row:last-child { border-bottom: none; }

.recipe-row--selected {
  background: oklch(95% 0.04 250 / 40%);
}

.recipe-row--dragging {
  opacity: 0.5;
}

.recipe-row:active { cursor: grabbing; }

/* Insertion-line indicators for recipe drag-and-drop, mirroring the chapter
   ones above: a line between two existing rows, at the exact spot the
   recipe will be dropped, rather than shading the whole list. */
.recipe-row--drop-line-above::before,
.recipe-row--drop-line-below::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--color-focus);
  border-radius: 2px;
  z-index: 2;
}

.recipe-row--drop-line-above::before { top: -1px; }
.recipe-row--drop-line-below::after { bottom: -1px; }

.recipe-row__check {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  accent-color: var(--color-focus);
  cursor: pointer;
}

.recipe-row__drag {
  flex-shrink: 0;
  color: var(--gray-78);
  cursor: grab;
}

.recipe-row__move {
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  gap: 1px;
}

.recipe-row__move-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 14px;
  padding: 0;
  border: none;
  border-radius: 3px;
  background: transparent;
  color: var(--gray-52);
  cursor: pointer;
}

.recipe-row__move-btn:hover:not(:disabled) {
  background: var(--gray-93);
}

.recipe-row__move-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
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
  color: var(--gray-20);
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
  color: var(--gray-52);
  cursor: pointer;
  transition: background 0.12s, border-color 0.12s;
}

.recipe-row__menu-btn:hover {
  background: var(--gray-93);
  border-color: var(--gray-84);
}

.overflow-menu {
  position: absolute;
  right: 0;
  top: calc(100% + 4px);
  background: var(--gray-99);
  border: 1px solid var(--gray-88);
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
  color: var(--gray-20);
  background: none;
  border: none;
  cursor: pointer;
  text-decoration: none;
  transition: background 0.1s;
}

.overflow-menu button:hover,
.overflow-menu a:hover {
  background: var(--gray-93);
}

.overflow-menu hr {
  border: none;
  border-top: 1px solid var(--gray-93);
  margin: 4px 0;
}

.overflow-menu__danger {
  color: oklch(45% 0.12 25) !important;
}

.overflow-menu__danger:hover {
  background: oklch(95% 0.04 25) !important;
}

.drag-handle {
  display: inline-flex;
  align-items: center;
  color: var(--gray-78);
  cursor: grab;
  flex-shrink: 0;
}
</style>
