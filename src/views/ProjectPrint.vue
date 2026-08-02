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
// When page numbers are toggled off, recipe/divider pages must suppress the
// footer counter too, not just omit the Table of Contents (see
// print-and-export spec: "Page Number Configuration Toggle").
const pageNumberName = computed(() => (showToc.value ? null : 'no-numbers'))

function printPage() {
  window.print()
}
</script>

<template>
  <div v-if="project" class="print-project">
    <div class="no-print toolbar-container">
      <div class="toolbar">
        <h1>Print Preview: {{ project.title }}</h1>
        <button type="button" class="btn-print" @click="printPage">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v8H6z"/></svg>
          Print / Save as PDF
        </button>
      </div>
    </div>

    <PagePreview named="cover">
      <CoverPage :project="project" />
    </PagePreview>

    <PagePreview v-if="showToc" named="toc">
      <TableOfContentsPage :chapters="chapterPlan" :accent-color="project.accentColor" />
    </PagePreview>

    <template v-for="(entry, index) in chapterPlan" :key="entry.chapter.id">
      <PagePreview :named="pageNumberName" :class="{ 'reset-page-counter': index === 0 }">
        <ChapterDividerPage :chapter-name="entry.chapter.name" :accent-color="project.accentColor" />
      </PagePreview>
      <PagePreview v-for="recipe in entry.recipes" :key="recipe.id" :named="pageNumberName">
        <RecipeSheet :recipe="recipe" :accent-color="project.accentColor" />
      </PagePreview>
    </template>
  </div>
  <main id="cm-main" style="max-width:1160px; margin:0 auto; padding:40px 32px 80px;" v-else>
    <p>Project not found.</p>
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
