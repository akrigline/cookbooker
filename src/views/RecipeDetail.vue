<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useRecipesStore } from '../stores/recipes'
import RecipeSheet from '../components/RecipeSheet.vue'
import PagePreview from '../components/PagePreview.vue'

const props = defineProps({
  recipeId: {
    type: String,
    required: true,
  },
})

const router = useRouter()
const recipesStore = useRecipesStore()

onMounted(() => {
  if (!recipesStore.loaded) recipesStore.load()
})

const recipe = computed(() =>
  recipesStore.recipes.find((r) => r.id === Number(props.recipeId)),
)

async function handleDelete() {
  if (!recipe.value) return
  if (!confirm(`Permanently delete "${recipe.value.title}" from the Global Recipe Library?`)) return
  await recipesStore.removeRecipe(recipe.value.id)
  router.push('/library')
}
</script>

<template>
  <div class="view" v-if="recipe">
    <div class="toolbar">
      <h1>{{ recipe.title }}</h1>
      <div class="actions">
        <router-link :to="`/library/${recipe.id}/edit`">Edit</router-link>
        <button type="button" class="danger" @click="handleDelete">Delete</button>
      </div>
    </div>

    <PagePreview>
      <RecipeSheet :recipe="recipe" />
    </PagePreview>
  </div>
  <div class="view" v-else>
    <p>Recipe not found.</p>
  </div>
</template>

<style scoped>
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-sm);
  margin-bottom: var(--space-lg);
}

.actions {
  display: flex;
  gap: var(--space-md);
  align-items: center;
}

.actions a {
  color: var(--accent-color);
  text-decoration: none;
  font-weight: 600;
}

button.danger {
  background: none;
  border: 1px solid #c0392b;
  color: #c0392b;
  border-radius: 6px;
  padding: var(--space-xs) var(--space-sm);
  cursor: pointer;
}
</style>
