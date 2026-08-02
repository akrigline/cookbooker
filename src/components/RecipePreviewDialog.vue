<script setup>
import Modal from './Modal.vue'
import RecipeSheet from './RecipeSheet.vue'

const props = defineProps({
  recipe: {
    type: Object,
    required: true,
  },
  accentColor: {
    type: String,
    default: '#d97742',
  }
})

const emit = defineEmits(['close', 'edit'])
</script>

<template>
  <Modal box-class="recipe-preview-modal" @close="emit('close')">
    <div class="rpd-container">
      <header class="rpd-header">
        <h2 id="modal-title" class="sr-only">Preview of {{ recipe.title || 'Recipe' }}</h2>
        <div class="rpd-actions">
          <button type="button" class="pv-btn-primary" @click="emit('edit')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px;"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Edit Recipe
          </button>
          <button type="button" class="rpd-close" aria-label="Close preview" @click="emit('close')">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      </header>
      <div class="rpd-content">
        <RecipeSheet :recipe="recipe" :accent-color="accentColor" />
      </div>
    </div>
  </Modal>
</template>

<style>
/* Global class so Modal can use it */
.modal-box.recipe-preview-modal {
  max-width: 900px;
  width: 90vw;
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
  justify-content: flex-end;
  padding: 16px 24px;
  border-bottom: 1px solid oklch(90% 0 0);
  background: oklch(98% 0 0);
}

.rpd-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.rpd-close {
  background: none;
  border: none;
  cursor: pointer;
  color: oklch(40% 0 0);
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

.rpd-close:hover {
  background: oklch(90% 0 0);
  color: oklch(20% 0 0);
}

.rpd-content {
  flex: 1;
  overflow-y: auto;
  position: relative;
  /* Add some padding around the sheet for presentation */
  padding: 32px;
  background: oklch(95% 0 0);
}

/* Ensure the sheet has a shadow like paper */
.rpd-content :deep(.recipe-sheet) {
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  margin: 0 auto;
}
</style>
