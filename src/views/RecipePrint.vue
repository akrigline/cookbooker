<script setup>
import { computed, onMounted } from 'vue'
import { useProjectsStore } from '../stores/projects'
import { useRecipesStore } from '../stores/recipes'
import PagePreview from '../components/PagePreview.vue'
import RecipeSheet from '../components/RecipeSheet.vue'

const props = defineProps({
  projectId: {
    type: String,
    required: true,
  },
  recipeId: {
    type: String,
    required: true,
  },
})

const projectsStore = useProjectsStore()
const recipesStore = useRecipesStore()

onMounted(async () => {
  if (!projectsStore.loaded) await projectsStore.load()
  if (!recipesStore.loaded) await recipesStore.load()
})

const project = computed(() =>
  projectsStore.projects.find((p) => p.id === Number(props.projectId)),
)
const recipe = computed(() =>
  recipesStore.recipes.find((r) => r.id === Number(props.recipeId)),
)

function printPage() {
  window.print()
}
</script>

<template>
  <div v-if="project && recipe">
    <div class="no-print toolbar">
      <h1>Print: {{ recipe.title }}</h1>
      <button type="button" @click="printPage">Print / Save as PDF</button>
    </div>

    <!-- Single recipe exports carry no cover, TOC, or page number - just the
         parent project's margins, template fidelity, and accent color. -->
    <PagePreview named="single">
      <RecipeSheet :recipe="recipe" :accent-color="project.accentColor" />
    </PagePreview>
  </div>
  <div v-else class="view">
    <p>Recipe or project not found.</p>
  </div>
</template>

<style scoped>
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-lg);
  padding: 0 var(--space-lg);
}

.toolbar button {
  background: var(--accent-color);
  color: white;
  border: none;
  padding: var(--space-sm) var(--space-lg);
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
}
</style>
