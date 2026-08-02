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
  <div class="layout-dual-column-bottom-split">
    <RecipeTitle class="layout-dual-column-bottom-split__title" :title="recipe.title" />
    <RecipeIngredients :recipe="recipe" :ingredients="recipe.ingredients" :columns="recipe.ingredientColumns" :qty-align="recipe.ingredientQtyAlign" />
    <div class="layout-dual-column-bottom-split__split">
      <div class="layout-dual-column-bottom-split__col">
        <RecipeImage :image="recipe.image" :aspect-ratio="recipe.imageAspectRatio" :title="recipe.title" />
        <RecipeNotes v-if="recipe.notes" :notes="recipe.notes" />
      </div>
      <RecipeInstructions
        class="layout-dual-column-bottom-split__instructions"
        :instructions="recipe.instructions"
      />
    </div>
  </div>
</template>

<style scoped>
.layout-dual-column-bottom-split {
  display: flex;
  flex-direction: column;
  gap: var(--recipe-section-stack);
  height: 100%;
}

.layout-dual-column-bottom-split__title {
  text-align: center;
}

.layout-dual-column-bottom-split__split {
  display: flex;
  flex-direction: row;
  gap: var(--recipe-section-stack);
  flex: 1;
}

.layout-dual-column-bottom-split__col {
  flex: 0 0 38%;
  display: flex;
  flex-direction: column;
  gap: var(--recipe-element-stack);
}

.layout-dual-column-bottom-split__instructions {
  flex: 1 1 62%;
  min-width: 0;
}
</style>
