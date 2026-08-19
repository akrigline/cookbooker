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
  favoriteSettings: {
    type: Object,
    required: true,
  },
})
</script>

<template>
  <div class="layout-asymmetric-sidebar">
    <div class="layout-asymmetric-sidebar__aside">
      <RecipeTitle :title="recipe.title" :favorite="recipe.favorite" :favorite-settings="favoriteSettings" />
      <RecipeImage :image="recipe.image" :aspect-ratio="recipe.imageAspectRatio" :title="recipe.title" />
      <RecipeNotes v-if="recipe.notes" :notes="recipe.notes" />
    </div>
    <div class="layout-asymmetric-sidebar__main">
      <RecipeIngredients :recipe="recipe" :ingredients="recipe.ingredients" :columns="recipe.ingredientColumns" />
      <RecipeInstructions :instructions="recipe.instructions" />
    </div>
  </div>
</template>

<style scoped>
.layout-asymmetric-sidebar {
  display: flex;
  flex-direction: row;
  gap: var(--recipe-column-gap);
  height: 100%;
}

.layout-asymmetric-sidebar__aside {
  flex: 0 0 33.333%;
  display: flex;
  flex-direction: column;
  gap: var(--recipe-element-stack);
}

.layout-asymmetric-sidebar__main {
  flex: 1 1 66.667%;
  display: flex;
  flex-direction: column;
  gap: var(--recipe-section-stack);
  min-width: 0;
}
</style>
