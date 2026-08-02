<script setup>
import { computed } from 'vue'
import RecipeTitle from './RecipeTitle.vue'
import RecipeImage from './RecipeImage.vue'
import RecipeIngredients from './RecipeIngredients.vue'
import RecipeInstructions from './RecipeInstructions.vue'
import RecipeNotes from './RecipeNotes.vue'

const props = defineProps({
  recipe: {
    type: Object,
    required: true,
  },
  accentColor: {
    type: String,
    default: '#d97742',
  },
})

const template = computed(() => props.recipe.layoutTemplate || 'standard')
const hasImageSlot = computed(() => template.value !== 'text-only')
const ingredientColumns = computed(() => props.recipe.ingredientColumns ?? 1)
const imageAspectRatio = computed(() => props.recipe.imageAspectRatio ?? 'auto')
</script>

<template>
  <article
    class="recipe-sheet"
    :class="`recipe-sheet--${template}`"
    :style="{ '--recipe-accent': accentColor }"
  >
    <RecipeTitle class="recipe-sheet__header" :title="recipe.title" />

    <RecipeImage
      v-if="hasImageSlot"
      class="recipe-sheet__image"
      :image="recipe.image"
      :aspect-ratio="imageAspectRatio"
    />

    <RecipeIngredients
      class="recipe-sheet__ingredients"
      :ingredients="recipe.ingredients"
      :columns="ingredientColumns"
    />

    <RecipeInstructions class="recipe-sheet__instructions" :instructions="recipe.instructions" />

    <RecipeNotes v-if="recipe.notes" class="recipe-sheet__notes" :notes="recipe.notes" />
  </article>
</template>

<style scoped>
.recipe-sheet {
  --recipe-accent: #d97742;
  display: grid;
  grid-template-areas:
    'header header'
    'image image'
    'ingredients instructions'
    'notes notes';
  grid-template-rows: auto auto 1fr auto;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-md);
  height: 100%;
  padding: var(--space-lg);
  box-sizing: border-box;
  background: var(--bg-primary, #fff);
  color: var(--text-primary, #232323);
  font-family: var(--font-main, serif);
  position: relative;
}

.recipe-sheet--text-only {
  grid-template-areas:
    'header header'
    'ingredients instructions'
    'notes notes';
  grid-template-rows: auto 1fr auto;
}

.recipe-sheet--image-heavy {
  grid-template-areas:
    'header header'
    'image ingredients'
    'image instructions'
    'notes notes';
  grid-template-rows: auto 1fr 1fr auto;
  grid-template-columns: 38% 1fr;
}

.recipe-sheet__header {
  grid-area: header;
}

.recipe-sheet__image {
  grid-area: image;
  min-height: 8rem;
}

.recipe-sheet--image-heavy .recipe-sheet__image {
  grid-row: span 2;
}

.recipe-sheet__ingredients {
  grid-area: ingredients;
}

.recipe-sheet__instructions {
  grid-area: instructions;
}

.recipe-sheet__notes {
  grid-area: notes;
}
</style>
