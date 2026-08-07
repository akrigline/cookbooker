<script setup>
defineProps({
  title: {
    type: String,
    required: true,
  },
})
</script>

<template>
  <header class="recipe-title-container">
    <h2 class="text-recipe-title">{{ title }}</h2>
  </header>
</template>

<style scoped>
.text-recipe-title {
  margin: 0;
  color: var(--recipe-primary); /* Overrides global text-recipe-title if needed, or just sets margin */
}
</style>
