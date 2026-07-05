<script setup>
import { computed, onMounted } from 'vue'
import { useRecipesStore } from '../stores/recipes'

const props = defineProps({
  recipeId: {
    type: String,
    required: true,
  },
})

const recipesStore = useRecipesStore()

onMounted(() => {
  if (!recipesStore.loaded) recipesStore.load()
})

const recipe = computed(() =>
  recipesStore.recipes.find((r) => r.id === Number(props.recipeId)),
)
</script>

<template>
  <div class="view">
    <h1>{{ recipe ? recipe.title : `Recipe ${recipeId}` }}</h1>
  </div>
</template>
