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
  <div class="layout-column-optimized">
    <RecipeTitle :title="recipe.title" />
    <div class="layout-column-optimized__split">
      <div class="layout-column-optimized__col">
        <RecipeNotes v-if="recipe.notes" :notes="recipe.notes" />
        <RecipeIngredients :recipe="recipe" :ingredients="recipe.ingredients" :columns="recipe.ingredientColumns ?? 1" :qty-align="recipe.ingredientQtyAlign ?? 'right'" />
      </div>
      <div class="layout-column-optimized__col">
        <RecipeImage :image="recipe.image" :aspect-ratio="recipe.imageAspectRatio ?? 'auto'" />
        <RecipeInstructions :instructions="recipe.instructions" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.layout-column-optimized {
  display: flex;
  flex-direction: column;
  gap: var(--recipe-section-stack);
  height: 100%;
}

.layout-column-optimized__split {
  display: flex;
  flex-direction: row;
  gap: var(--recipe-section-stack);
  flex: 1;
}

.layout-column-optimized__col {
  flex: 1 1 50%;
  display: flex;
  flex-direction: column;
  gap: var(--recipe-element-stack);
  min-width: 0;
}
</style>
