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

function formatStepNumber(num) {
  return num.toString().padStart(2, '0')
}
</script>

<template>
  <div class="recipe-instructions">
    <h3 class="text-section-header instructions-title">
      <span class="material-symbols-outlined title-icon">menu_book</span>
      Instructions
    </h3>
    
    <div class="steps-container">
      <div v-for="(step, idx) in steps" :key="idx" class="step-item">
        <span class="text-section-header step-number">
          {{ formatStepNumber(idx + 1) }}
        </span>
        <p class="text-instruction-step step-content">{{ step }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.instructions-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 1rem 0;
}

.title-icon {
  font-size: 16px;
}

.steps-container {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.step-item {
  display: flex;
  gap: 1rem;
}

.step-number {
  color: var(--recipe-primary);
  border-right: 1px solid var(--recipe-outline-variant);
  width: calc(2ch + 1rem);
  padding-right: 1rem;
  height: fit-content;
  flex-shrink: 0;
}

.step-content {
  margin: 0;
}
</style>
