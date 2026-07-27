<script setup>
import { computed, onMounted } from 'vue'
import { useProjectsStore } from '../stores/projects'
import { useRecipesStore } from '../stores/recipes'
import { buildChapterPlan } from '../js/compileBook'
import PagePreview from '../components/PagePreview.vue'
import CoverPage from '../components/CoverPage.vue'
import TableOfContentsPage from '../components/TableOfContentsPage.vue'
import ChapterDividerPage from '../components/ChapterDividerPage.vue'
import RecipeSheet from '../components/RecipeSheet.vue'

const props = defineProps({
  projectId: {
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

const projectIdNum = computed(() => Number(props.projectId))
const project = computed(() => projectsStore.projects.find((p) => p.id === projectIdNum.value))
const recipesById = computed(() => new Map(recipesStore.recipes.map((r) => [r.id, r])))

const chapterPlan = computed(() =>
  buildChapterPlan({
    chapters: projectsStore.chapters,
    projectRecipes: projectsStore.projectRecipes,
    recipesById: recipesById.value,
    projectId: projectIdNum.value,
  }),
)

const showToc = computed(() => Boolean(project.value?.pageNumbersEnabled))

function printPage() {
  window.print()
}
</script>

<template>
  <div v-if="project" class="print-project">
    <div class="no-print toolbar">
      <h1>Print Preview: {{ project.title }}</h1>
      <button type="button" @click="printPage">Print / Save as PDF</button>
    </div>

    <PagePreview named="cover">
      <CoverPage :project="project" />
    </PagePreview>

    <PagePreview v-if="showToc" named="toc">
      <TableOfContentsPage :chapters="chapterPlan" :accent-color="project.accentColor" />
    </PagePreview>

    <template v-for="(entry, index) in chapterPlan" :key="entry.chapter.id">
      <PagePreview :class="{ 'reset-page-counter': index === 0 }">
        <ChapterDividerPage :chapter-name="entry.chapter.name" :accent-color="project.accentColor" />
      </PagePreview>
      <PagePreview v-for="recipe in entry.recipes" :key="recipe.id">
        <RecipeSheet :recipe="recipe" :accent-color="project.accentColor" />
      </PagePreview>
    </template>
  </div>
  <div v-else class="view">
    <p>Project not found.</p>
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
