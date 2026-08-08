<script setup>
import { computed } from 'vue'
import RecipeThumbnail from './RecipeThumbnail.vue'

const props = defineProps({
  orderedChapters: { type: Array, required: true },
  availableRecipes: { type: Array, required: true },
  libSelectedIds: { type: Set, required: true },
  addingRecipeId: { type: [Number, String, null], default: null },
  handlers: { type: Object, required: true },
})

const librarySearch = defineModel('librarySearch', { type: String, default: '' })
const libBulkChapterTarget = defineModel('libBulkChapterTarget', { type: [String, Number], default: '' })

const allSelected = computed(
  () => props.availableRecipes.length > 0
    && props.availableRecipes.every((r) => props.libSelectedIds.has(r.id)),
)
const someSelected = computed(() => props.availableRecipes.some((r) => props.libSelectedIds.has(r.id)))
</script>

<template>
  <aside class="pv-sidebar" aria-label="Recipe Library">
    <!-- New Chapter quick-add form -->
    <section class="sidebar-section sidebar-section--new-chapter">
      <h2 class="sidebar-section__heading">New Chapter</h2>
      <form class="new-chapter-form" @submit.prevent="handlers.onNewChapter">
        <button type="submit" class="sidebar-btn sidebar-btn--full">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New Chapter…
        </button>
      </form>
    </section>

    <div class="sidebar-divider" />

    <!-- Library search -->
    <section class="sidebar-section sidebar-section--library">
      <div class="sidebar-section__header">
        <h2 class="sidebar-section__heading">Global Recipe Library</h2>
        <label
          v-if="availableRecipes.length > 0"
          class="lib-select-all"
          :title="allSelected ? 'Deselect all' : 'Select all'"
        >
          <input
            type="checkbox"
            :checked="allSelected"
            :indeterminate="!allSelected && someSelected"
            aria-label="Select all visible library recipes"
            @change="handlers.onLibSelectAll"
          />
          <span>Select all</span>
        </label>
      </div>
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
          @dragstart="handlers.onLibRecipeDragStart($event, recipe)"
          @dragend="handlers.onRecipeDragEnd"
        >
          <input
            type="checkbox"
            class="lib-row__check"
            :checked="libSelectedIds.has(recipe.id)"
            :aria-label="`Select '${recipe.title}'`"
            @click="handlers.onToggleLibSelect(recipe.id, $event)"
          />
          <div class="lib-row__thumb">
            <RecipeThumbnail :image="recipe.image" :title="recipe.title" />
          </div>
          <span class="lib-row__title">{{ recipe.title }}</span>
          <button
            type="button"
            class="lib-row__add-btn"
            :aria-label="`Add '${recipe.title}' to cookbook`"
            :disabled="addingRecipeId === recipe.id"
            @click="handlers.onQuickAdd(recipe)"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </button>
        </li>
      </ul>
    </section>

    <!-- Library bulk action bar -->
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
            @change="handlers.onLibBulkAddToChapter"
          >
            <option value="">Choose…</option>
            <option v-for="c in orderedChapters" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
          <button type="button" class="sidebar-btn" @click="handlers.onLibBulkAddToMisc">
            Add to Misc.
          </button>
          <button
            type="button"
            class="sidebar-btn"
            @click="handlers.onNewChapterFromLibrary"
          >
            New chapter…
          </button>
        </div>
      </div>
    </Transition>
  </aside>
</template>

<style scoped>
.pv-sidebar {
  background: var(--gray-99);
  border: 1px solid var(--gray-88);
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: sticky;
  top: 24px;
  max-height: calc(100vh - 48px);
}

.sidebar-section {
  padding: 16px 16px 12px;
}

.sidebar-section--library {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding-bottom: 0;
}

.sidebar-section__heading {
  font-family: 'Newsreader', Georgia, serif;
  font-size: 15px;
  font-weight: 600;
  color: var(--gray-30);
  margin: 0;
}

.sidebar-section__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 10px;
}

.lib-select-all {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: var(--gray-46);
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
}

.lib-select-all input[type='checkbox'] {
  width: 14px;
  height: 14px;
  cursor: pointer;
  accent-color: var(--color-focus);
}

.sidebar-divider {
  height: 1px;
  background: var(--gray-88);
  margin: 0 16px;
}

.sidebar-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: var(--gray-20);
  color: var(--gray-99);
  border: none;
  border-radius: 8px;
  padding: 9px 14px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
  white-space: nowrap;
}

.sidebar-btn:hover { background: var(--gray-30); }

.sidebar-btn--full { width: 100%; justify-content: center; }

.sidebar-search {
  font: inherit;
  font-size: 13px;
  padding: 8px 12px;
  border: 1px solid var(--gray-84);
  border-radius: 8px;
  background: var(--gray-99);
  color: var(--gray-20);
  width: 100%;
  margin-bottom: 10px;
}

.sidebar-search:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 1px;
}

.lib-list {
  list-style: none;
  margin: 0;
  padding: 0;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
}

.lib-list__empty {
  padding: 16px 0;
  font-size: 13px;
  color: var(--gray-52);
  font-style: italic;
}

.lib-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  border-bottom: 1px solid var(--gray-93);
  cursor: grab;
}

.lib-row:last-child { border-bottom: none; }

.lib-row--selected { background: oklch(95% 0.04 250 / 40%); border-radius: 6px; }

.lib-row__check {
  width: 15px;
  height: 15px;
  flex-shrink: 0;
  accent-color: var(--color-focus);
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
  color: var(--gray-20);
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
  border: 1px solid var(--gray-84);
  background: var(--gray-96);
  color: var(--gray-30);
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.12s;
}

.lib-row__add-btn:hover { background: var(--gray-93); }
.lib-row__add-btn:disabled { opacity: 0.4; cursor: not-allowed; }

.lib-bulk-bar {
  flex-shrink: 0;
  background: var(--gray-99);
  border-top: 1px solid var(--gray-88);
  padding: 10px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  box-shadow: 0 -4px 14px oklch(10% 0.01 75 / 8%);
}

.lib-bulk-bar__count {
  font-size: 12px;
  font-weight: 600;
  color: var(--gray-46);
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
  color: var(--gray-46);
  white-space: nowrap;
}

.lib-bulk-select {
  font: inherit;
  font-size: 12px;
  padding: 6px 8px;
  border: 1px solid var(--gray-84);
  border-radius: 7px;
  background: var(--gray-99);
  color: var(--gray-20);
  flex: 1;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.22s ease, opacity 0.22s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}
</style>
