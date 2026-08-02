<script setup>
import { computed } from 'vue'
import { renderChefNotes } from '../js/richtext'

const props = defineProps({
  notes: {
    type: String,
    default: '',
  },
})

const notesHtml = computed(() => renderChefNotes(props.notes))
</script>

<template>
  <div class="recipe-notes-container">
    <h3 class="text-section-header notes-title">Chef's Notes</h3>
    <div class="text-chef-note notes-content" v-html="notesHtml"></div>
  </div>
</template>

<style scoped>
.recipe-notes-container {
  background: var(--recipe-surface-container-low);
  padding: 1rem;
  border: 1px solid var(--recipe-outline-variant);
}

.notes-title {
  margin: 0 0 0.5rem 0;
  border-bottom: 1px solid var(--recipe-outline-variant);
  padding-bottom: 0.25rem;
}

.notes-content {
  line-height: 1.6;
}

:deep(.notes-content p) {
  margin: 0 0 0.5rem 0;
}
:deep(.notes-content p:last-child) {
  margin: 0;
}
</style>
