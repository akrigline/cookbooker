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
  accentColor: {
    type: String,
    default: null,
  },
})
</script>

<template>
  <div class="layout-balanced-header">
    <div class="layout-balanced-header__row">
      <RecipeTitle class="layout-balanced-header__title" :title="recipe.title" :favorite="recipe.favorite" :favorite-settings="favoriteSettings" :accent-color="accentColor" />
      <RecipeImage
        class="layout-balanced-header__image"
        :image="recipe.image"
        :aspect-ratio="recipe.imageAspectRatio"
        :title="recipe.title"
      />
    </div>
    <RecipeNotes v-if="recipe.notes" :notes="recipe.notes" />
    <RecipeIngredients :recipe="recipe" :ingredients="recipe.ingredients" :columns="recipe.ingredientColumns" />
    <RecipeInstructions :instructions="recipe.instructions" />
  </div>
</template>

<style scoped>
.layout-balanced-header {
  display: flex;
  flex-direction: column;
  gap: var(--recipe-section-stack);
  height: 100%;
}

.layout-balanced-header__row {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: var(--recipe-section-stack);
}

.layout-balanced-header__title {
  flex: 1 1 auto;
  min-width: 0;
}

.layout-balanced-header__image {
  flex: 0 0 38%;
}
</style>
