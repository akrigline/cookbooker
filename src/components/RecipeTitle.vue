<script setup>
defineProps({
  title: {
    type: String,
    required: true,
  },
})
</script>

<template>
  <header class="recipe-title">
    <h2>{{ title }}</h2>
  </header>
</template>

<style scoped>
.recipe-title {
  border-bottom: 3px solid var(--recipe-accent);
  padding-bottom: var(--space-sm);
}

.recipe-title h2 {
  margin: 0;
  font-size: 1.75rem;
  color: var(--recipe-accent);
}
</style>
