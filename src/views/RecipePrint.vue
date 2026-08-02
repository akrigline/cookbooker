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
    <div class="no-print toolbar-container">
      <div class="toolbar">
        <h1>Print Recipe: {{ recipe.title }}</h1>
        <button type="button" class="btn-print" @click="printPage">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v8H6z"/></svg>
          Print / Save as PDF
        </button>
      </div>
    </div>

    <!-- Single recipe exports carry no cover, TOC, or page number - just the
         parent project's margins, template fidelity, and accent color. -->
    <PagePreview named="single">
      <RecipeSheet :recipe="recipe" :accent-color="project.accentColor" />
    </PagePreview>
  </div>
  <main id="cm-main" style="max-width:1160px; margin:0 auto; padding:40px 32px 80px;" v-else>
    <p>Recipe or project not found.</p>
  </main>
</template>

<style scoped>
.toolbar-container {
  max-width: 8.5in;
  margin: 24px auto;
  padding: 0 16px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.toolbar h1 {
  font-family: 'Newsreader', Georgia, serif;
  font-size: 24px;
  font-weight: 600;
  margin: 0;
  color: oklch(20% 0.015 75);
}

.btn-print {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: oklch(20% 0.015 75);
  color: oklch(98% 0.004 75);
  border: none;
  padding: 10px 18px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-print:hover {
  background: oklch(28% 0.02 75);
}

.btn-print:focus-visible {
  outline: 2px solid oklch(52% 0.16 250);
  outline-offset: 2px;
}
</style>
