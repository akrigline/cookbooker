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
  <footer class="recipe-notes" v-html="notesHtml" />
</template>

<style scoped>
.recipe-notes {
  font-size: 0.9rem;
  font-style: italic;
  border-top: 1px solid var(--border-color, #e0ddd6);
  padding-top: var(--space-sm);
}
</style>
