<script setup>
import { onMounted } from 'vue'
import { useRecipesStore } from '../stores/recipes'

const recipesStore = useRecipesStore()

onMounted(() => {
  if (!recipesStore.loaded) recipesStore.load()
})
</script>

<template>
  <div class="view">
    <h1>Recipe Library</h1>
    <ul>
      <li v-for="recipe in recipesStore.recipes" :key="recipe.id">
        <router-link :to="`/library/${recipe.id}`">{{ recipe.title }}</router-link>
      </li>
    </ul>
  </div>
</template>
