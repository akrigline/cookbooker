<script setup>
import RecipeTitle from './RecipeTitle.vue'
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
  <div class="layout-text-only">
    <RecipeTitle :title="recipe.title" :favorite="recipe.favorite" :favorite-settings="favoriteSettings" :accent-color="accentColor" />
    <div class="layout-text-only__split">
      <RecipeIngredients
        class="layout-text-only__col"
        :recipe="recipe"
        :ingredients="recipe.ingredients"
        :columns="recipe.ingredientColumns"
      />
      <RecipeInstructions class="layout-text-only__col" :instructions="recipe.instructions" />
    </div>
    <RecipeNotes v-if="recipe.notes" :notes="recipe.notes" />
  </div>
</template>

<style scoped>
.layout-text-only {
  display: flex;
  flex-direction: column;
  gap: var(--recipe-section-stack);
  height: 100%;
}

.layout-text-only__split {
  display: flex;
  flex-direction: row;
  gap: var(--recipe-section-stack);
  flex: 1;
}

.layout-text-only__col {
  flex: 1 1 50%;
  min-width: 0;
}
</style>
