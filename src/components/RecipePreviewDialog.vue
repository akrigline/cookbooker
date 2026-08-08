<script setup>
import { onMounted, onUnmounted } from 'vue'
import Modal from './Modal.vue'
import RecipeSheet from './RecipeSheet.vue'
import PagePreview from './PagePreview.vue'

const props = defineProps({
  recipe: {
    type: Object,
    required: true,
  },
  accentColor: {
    type: String,
    default: '#d97742',
  },
  hasPrev: {
    type: Boolean,
    default: false,
  },
  hasNext: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['close', 'edit', 'navigate'])

function onKeydown(event) {
  if (event.target.matches('input, textarea, [contenteditable]')) return
  if (event.key === 'ArrowRight') {
    if (props.hasNext) emit('navigate', 1)
  } else if (event.key === 'ArrowLeft') {
    if (props.hasPrev) emit('navigate', -1)
  }
}

onMounted(() => {
  document.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <Modal box-class="recipe-preview-modal" title-id="modal-title" @close="emit('close')">
    <div class="rpd-container">
      <header class="rpd-header">
        <h2 id="modal-title" class="rpd-title text-h2">{{ recipe.title || 'Recipe' }}</h2>
        <div class="rpd-actions">
          <button
            type="button"
            class="rpd-nav-btn"
            aria-label="Previous recipe"
            :disabled="!hasPrev"
            @click="emit('navigate', -1)"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <button
            type="button"
            class="rpd-nav-btn"
            aria-label="Next recipe"
            :disabled="!hasNext"
            @click="emit('navigate', 1)"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
          <button type="button" class="rpd-edit-btn" @click="emit('edit')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Edit Recipe
          </button>
          <button type="button" class="rpd-close" aria-label="Close preview" @click="emit('close')">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      </header>
      <div class="rpd-content">
        <PagePreview>
          <RecipeSheet :recipe="recipe" :accent-color="accentColor" />
        </PagePreview>
      </div>
    </div>
  </Modal>
</template>

<style>
/* Global class so Modal can use it */
.modal-box.recipe-preview-modal {
  width: fit-content;
  max-width: calc(100vw - 48px);
  padding: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-height: 90vh;
}
</style>

<style scoped>
.rpd-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  max-height: 90vh;
}

.rpd-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 24px;
  border-bottom: 1px solid var(--gray-88);
  background: var(--gray-99);
}

.rpd-title {
  margin: 0;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rpd-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.rpd-edit-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 20px;
  border-radius: 8px;
  border: none;
  background: var(--gray-20);
  color: var(--gray-99);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.12s;
}

.rpd-nav-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  background: var(--gray-93);
  color: var(--gray-20);
  cursor: pointer;
  transition: background 0.12s;
}

.rpd-nav-btn:hover:not(:disabled) { background: var(--gray-88); }
.rpd-nav-btn:focus-visible { outline: 2px solid var(--color-focus); outline-offset: 2px; }
.rpd-nav-btn:disabled { opacity: 0.35; cursor: default; }

.rpd-edit-btn:hover { background: var(--gray-30); }
.rpd-edit-btn:focus-visible { outline: 2px solid var(--color-focus); outline-offset: 2px; }

.rpd-close {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--gray-42);
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

.rpd-close:hover {
  background: var(--gray-93);
  color: var(--gray-20);
}

.rpd-close:focus-visible { outline: 2px solid var(--color-focus); outline-offset: 2px; }

.rpd-content {
  flex: 1;
  overflow-y: auto;
}
</style>
