<script setup>
import RecipeTitle from './RecipeTitle.vue'
import RecipeImage from './RecipeImage.vue'
import RecipeIngredients from './RecipeIngredients.vue'
import RecipeInstructions from './RecipeInstructions.vue'
import RecipeNotes from './RecipeNotes.vue'

defineProps({
  recipe: {
    type: Object,
    required: true,
  },
})
</script>

<template>
  <div class="layout-asymmetric-sidebar">
    <div class="layout-asymmetric-sidebar__aside">
      <RecipeTitle :title="recipe.title" />
      <RecipeImage :image="recipe.image" :aspect-ratio="recipe.imageAspectRatio ?? 'auto'" />
      <RecipeNotes v-if="recipe.notes" :notes="recipe.notes" />
    </div>
    <div class="layout-asymmetric-sidebar__main">
      <RecipeIngredients :ingredients="recipe.ingredients" :columns="recipe.ingredientColumns ?? 1" />
      <RecipeInstructions :instructions="recipe.instructions" />
    </div>
  </div>
</template>

<style scoped>
.layout-asymmetric-sidebar {
  display: flex;
  flex-direction: row;
  gap: var(--space-lg);
  height: 100%;
}

.layout-asymmetric-sidebar__aside {
  flex: 0 0 33%;
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.layout-asymmetric-sidebar__main {
  flex: 1 1 67%;
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
  min-width: 0;
}
</style>
