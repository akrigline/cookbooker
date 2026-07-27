<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRecipesStore } from '../stores/recipes'
import RecipeThumbnail from '../components/RecipeThumbnail.vue'

const recipesStore = useRecipesStore()
const query = ref('')

onMounted(() => {
  if (!recipesStore.loaded) recipesStore.load()
})

function matches(recipe, needle) {
  if (recipe.title?.toLowerCase().includes(needle)) return true
  return (recipe.ingredients ?? []).some((ing) =>
    (ing.ingredient ?? '').toLowerCase().includes(needle),
  )
}

const filteredRecipes = computed(() => {
  const needle = query.value.trim().toLowerCase()
  if (!needle) return recipesStore.recipes
  return recipesStore.recipes.filter((r) => matches(r, needle))
})
</script>

<template>
  <div class="view">
    <div class="toolbar">
      <h1>Recipe Library</h1>
      <div class="toolbar-actions">
        <router-link class="secondary" to="/library/import">Import Recipes</router-link>
        <router-link class="primary" to="/library/new">+ New Recipe</router-link>
      </div>
    </div>

    <input
      v-model="query"
      type="search"
      class="search"
      placeholder="Search by title or ingredient..."
    />

    <p v-if="!filteredRecipes.length" class="empty">No recipes match your search.</p>

    <ul class="recipe-grid">
      <li v-for="recipe in filteredRecipes" :key="recipe.id">
        <router-link :to="`/library/${recipe.id}`" class="recipe-card">
          <div class="recipe-card__thumb">
            <RecipeThumbnail :image="recipe.image" />
          </div>
          <span class="recipe-card__title">{{ recipe.title }}</span>
        </router-link>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-md);
}

.toolbar-actions {
  display: flex;
  gap: var(--space-sm);
}

.toolbar .primary {
  background: var(--accent-color);
  color: white;
  text-decoration: none;
  padding: var(--space-sm) var(--space-md);
  border-radius: 6px;
  font-weight: 600;
}

.toolbar .secondary {
  background: var(--bg-secondary);
  color: var(--text-primary);
  text-decoration: none;
  padding: var(--space-sm) var(--space-md);
  border-radius: 6px;
  font-weight: 600;
  border: 1px solid var(--border-color);
}

.search {
  width: 100%;
  max-width: 24rem;
  padding: var(--space-sm);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  margin-bottom: var(--space-lg);
  font: inherit;
}

.empty {
  color: var(--text-secondary);
}

.recipe-grid {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: var(--space-md);
}

.recipe-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  text-decoration: none;
  color: var(--text-primary);
}

.recipe-card__thumb {
  width: 100%;
  aspect-ratio: 4 / 3;
  border-radius: 6px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  overflow: hidden;
}

.recipe-card__thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.recipe-card__title {
  font-weight: 600;
}
</style>
