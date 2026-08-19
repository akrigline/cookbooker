<script setup>
import RecipeTitle from './RecipeTitle.vue'
import RecipeImage from './RecipeImage.vue'
import RecipeIngredients from './RecipeIngredients.vue'
import RecipeInstructions from './RecipeInstructions.vue'
import RecipeNotes from './RecipeNotes.vue'
import RecipeQRCode from './RecipeQRCode.vue'

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
  <div class="layout-default">
    <div v-if="recipe.image" class="layout-default__top">
      <div class="layout-default__top-text">
        <RecipeTitle :title="recipe.title" :favorite="recipe.favorite" :favorite-settings="favoriteSettings" :accent-color="accentColor" />
        <RecipeNotes v-if="recipe.notes" :notes="recipe.notes" />
      </div>
      <RecipeImage
        class="layout-default__image"
        :image="recipe.image"
        :aspect-ratio="recipe.imageAspectRatio"
        :title="recipe.title"
      />
    </div>
    <template v-else>
      <RecipeTitle :title="recipe.title" :favorite="recipe.favorite" :favorite-settings="favoriteSettings" :accent-color="accentColor" />
      <RecipeNotes v-if="recipe.notes" :notes="recipe.notes" />
    </template>

    <div class="layout-default__middle">
      <RecipeIngredients
        class="layout-default__ingredients"
        :ingredients="recipe.ingredients"
        :columns="recipe.ingredientColumns"
      />
      <RecipeQRCode class="layout-default__qr" :recipe="recipe" />
    </div>

    <RecipeInstructions class="layout-default__instructions" :instructions="recipe.instructions" />
  </div>
</template>

<style scoped>
.layout-default {
  display: flex;
  flex-direction: column;
  gap: var(--recipe-section-stack);
  height: 100%;
}

.layout-default__top {
  display: flex;
  flex-direction: row;
  gap: var(--recipe-column-gap);
}

.layout-default__top-text {
  flex: 0 0 58%;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--recipe-element-stack);
}

.layout-default__image {
  flex: 0 0 40%;
  min-width: 0;
}

.layout-default__middle {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: var(--recipe-column-gap);
}

.layout-default__ingredients {
  flex: 1 1 auto;
  min-width: 0;
}

.layout-default__qr {
  flex: 0 0 auto;
}

.layout-default__instructions {
  flex: 1;
  min-height: 0;
}
</style>
