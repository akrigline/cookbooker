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
  <div class="layout-hero-split-asymmetric">
    <div class="layout-hero-split-asymmetric__hero">
      <RecipeTitle :title="recipe.title" />
      <RecipeImage :image="recipe.image" :aspect-ratio="recipe.imageAspectRatio ?? 'auto'" />
      <RecipeNotes v-if="recipe.notes" :notes="recipe.notes" />
    </div>
    <div class="layout-hero-split-asymmetric__split">
      <RecipeIngredients
        class="layout-hero-split-asymmetric__ingredients"
        :ingredients="recipe.ingredients"
        :columns="recipe.ingredientColumns ?? 1"
      />
      <RecipeInstructions
        class="layout-hero-split-asymmetric__instructions"
        :instructions="recipe.instructions"
      />
    </div>
  </div>
</template>

<style scoped>
.layout-hero-split-asymmetric {
  display: flex;
  flex-direction: column;
  gap: var(--recipe-section-stack);
  height: 100%;
}

.layout-hero-split-asymmetric__hero {
  display: flex;
  flex-direction: column;
  gap: var(--recipe-element-stack);
}

.layout-hero-split-asymmetric__split {
  display: flex;
  flex-direction: row;
  gap: var(--recipe-section-stack);
  flex: 1;
}

.layout-hero-split-asymmetric__ingredients {
  flex: 0 0 33%;
  min-width: 0;
}

.layout-hero-split-asymmetric__instructions {
  flex: 1 1 67%;
  min-width: 0;
}
</style>
