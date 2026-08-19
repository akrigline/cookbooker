<script setup>
import { computed } from 'vue'
import RecipeTitle from './RecipeTitle.vue'
import RecipeImage from './RecipeImage.vue'
import RecipeIngredients from './RecipeIngredients.vue'
import RecipeInstructions from './RecipeInstructions.vue'
import RecipeNotes from './RecipeNotes.vue'
import RecipeQRCode from './RecipeQRCode.vue'
import { DEFAULT_PLACEMENT } from '../js/templates'

const props = defineProps({
  recipe: {
    type: Object,
    required: true,
  },
  favoriteSettings: {
    type: Object,
    required: true,
  },
})

const imagePlacement = computed(() => props.recipe.imagePlacement ?? DEFAULT_PLACEMENT)
const notesPlacement = computed(() => props.recipe.notesPlacement ?? DEFAULT_PLACEMENT)
</script>

<template>
  <div class="layout-two-column">
    <RecipeTitle :title="recipe.title" :favorite="recipe.favorite" :favorite-settings="favoriteSettings" />

    <div v-if="recipe.image && imagePlacement === 'hero'" class="layout-two-column__hero-image">
      <RecipeImage :image="recipe.image" :aspect-ratio="recipe.imageAspectRatio" :title="recipe.title" />
    </div>
    <RecipeNotes v-if="recipe.notes && notesPlacement === 'hero'" :notes="recipe.notes" />

    <div class="layout-two-column__split">
      <div class="layout-two-column__left">
        <div v-if="recipe.image && imagePlacement === 'left'" class="layout-two-column__column-image">
          <RecipeImage :image="recipe.image" :aspect-ratio="recipe.imageAspectRatio" :title="recipe.title" />
        </div>
        <RecipeNotes v-if="recipe.notes && notesPlacement === 'left'" :notes="recipe.notes" />
        <RecipeIngredients
          class="layout-two-column__ingredients"
          :ingredients="recipe.ingredients"
          :columns="recipe.ingredientColumns"
        />
        <RecipeQRCode class="layout-two-column__qr" :recipe="recipe" />
      </div>
      <div class="layout-two-column__right">
        <div v-if="recipe.image && imagePlacement === 'right'" class="layout-two-column__column-image">
          <RecipeImage :image="recipe.image" :aspect-ratio="recipe.imageAspectRatio" :title="recipe.title" />
        </div>
        <RecipeNotes v-if="recipe.notes && notesPlacement === 'right'" :notes="recipe.notes" />
        <RecipeInstructions class="layout-two-column__instructions" :instructions="recipe.instructions" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.layout-two-column {
  display: flex;
  flex-direction: column;
  gap: var(--recipe-section-stack);
  height: 100%;
}

.layout-two-column__split {
  display: flex;
  flex-direction: row;
  gap: var(--recipe-column-gap);
  flex: 1;
  min-height: 0;
}

.layout-two-column__left {
  flex: 0 0 32%;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--recipe-element-stack);
}

.layout-two-column__right {
  flex: 1 1 65%;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--recipe-element-stack);
}

/* RecipeImage sizes its root to height:100% of its parent - it expects an
   ancestor with a definite height. As a lone flex item in a column-direction
   flex container (no sibling to derive a definite cross-size from, unlike
   the row-based layouts elsewhere in the app) that percentage has nothing
   definite to resolve against and the item balloons to consume the
   container's remaining space. These wrapper divs give RecipeImage a
   definite height via an explicit percentage instead - flexbox resolves
   percentage heights of a flex item against its flex line's already-
   resolved (definite) cross/main size, unlike plain block layout, so this
   is reliable here even though the ancestor chain is several flex levels
   deep. (An `aspect-ratio` on the wrapper was tried first and rejected: its
   interaction with `flex-basis: auto` sizing proved unreliable - the
   wrapper ended up square regardless of the specified ratio.) */
.layout-two-column__hero-image {
  flex: 0 0 auto;
  height: 22%;
}

.layout-two-column__column-image {
  flex: 0 0 auto;
  height: 28%;
}

.layout-two-column__ingredients {
  flex: 1 1 auto;
  min-height: 0;
}

.layout-two-column__qr {
  flex: 0 0 auto;
  align-self: center;
}

.layout-two-column__instructions {
  flex: 1 1 auto;
  min-height: 0;
}
</style>
