<script setup>
import { computed } from 'vue'

const props = defineProps({
  instructions: {
    type: String,
    default: '',
  },
})

const steps = computed(() =>
  (props.instructions ?? '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean),
)
</script>

<template>
  <section class="recipe-instructions">
    <h2>Instructions</h2>
    <ol>
      <li v-for="(step, idx) in steps" :key="idx">{{ step }}</li>
    </ol>
  </section>
</template>

<style scoped>
.recipe-instructions h2 {
  font-size: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--recipe-accent);
  margin: 0 0 var(--space-sm);
}

.recipe-instructions ol {
  margin: 0;
  padding-left: 1.25rem;
}

.recipe-instructions li {
  margin-bottom: var(--space-xs);
  font-size: 0.95rem;
  line-height: 1.4;
}
</style>
