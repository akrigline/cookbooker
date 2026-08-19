<script setup>
import { computed, onBeforeUnmount, onMounted, watch } from 'vue'
import { useProjectsStore } from '../stores/projects'
import { useRecipesStore } from '../stores/recipes'
import { useSettingsStore } from '../stores/settings'
import { applyPageSizeOverride, clearPageSizeOverride } from '../js/pageSizeOverride'
import PagePreview from '../components/PagePreview.vue'
import PrintToolbar from '../components/PrintToolbar.vue'
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
const settingsStore = useSettingsStore()

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
const pageSize = computed(() => settingsStore.pageSize)

watch(pageSize, applyPageSizeOverride, { immediate: true })
onBeforeUnmount(clearPageSizeOverride)

function printPage() {
  window.print()
}
</script>

<template>
  <div v-if="project && recipe">
    <PrintToolbar :title="`Print Recipe: ${recipe.title}`" @print="printPage" />

    <!-- Single recipe exports carry no cover, TOC, or page number - just the
         parent project's margins and template fidelity. -->
    <PagePreview :paper-size="pageSize">
      <RecipeSheet :recipe="recipe" :project="project" />
    </PagePreview>
  </div>
  <main id="cm-main" style="max-width:1160px; margin:0 auto; padding:40px 32px 80px;" v-else>
    <p>Recipe or project not found.</p>
  </main>
</template>
