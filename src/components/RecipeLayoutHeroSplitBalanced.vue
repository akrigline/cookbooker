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
  <div class="layout-hero-split-balanced">
    <div class="layout-hero-split-balanced__hero">
      <RecipeTitle :title="recipe.title" />
      <RecipeImage :image="recipe.image" :aspect-ratio="recipe.imageAspectRatio ?? 'auto'" />
      <RecipeNotes v-if="recipe.notes" :notes="recipe.notes" />
    </div>
    <div class="layout-hero-split-balanced__split">
      <RecipeIngredients
        class="layout-hero-split-balanced__col"
        :ingredients="recipe.ingredients"
        :columns="recipe.ingredientColumns ?? 1"
      />
      <RecipeInstructions class="layout-hero-split-balanced__col" :instructions="recipe.instructions" />
    </div>
  </div>
</template>

<style scoped>
.layout-hero-split-balanced {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
  height: 100%;
}

.layout-hero-split-balanced__hero {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.layout-hero-split-balanced__split {
  display: flex;
  flex-direction: row;
  gap: var(--space-lg);
  flex: 1;
}

.layout-hero-split-balanced__col {
  flex: 1 1 50%;
  min-width: 0;
}
</style>
