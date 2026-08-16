<script setup>
import { DEFAULT_ACCENT_COLOR } from '../js/templates'

defineProps({
  chapterName: {
    type: String,
    required: true,
  },
  accentColor: {
    type: String,
    default: DEFAULT_ACCENT_COLOR,
  },
})
</script>

<template>
  <div class="chapter-divider" :style="{ '--divider-accent': accentColor }">
    <h2>{{ chapterName }}</h2>
  </div>
</template>

<style scoped>
.chapter-divider {
  --divider-accent: #d97742;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.chapter-divider h2 {
  font-size: 2.5rem;
  color: var(--divider-accent);
  border-top: 4px solid var(--divider-accent);
  border-bottom: 4px solid var(--divider-accent);
  padding: 1.5rem 3rem;
}
</style>
