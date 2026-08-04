<script setup>
import { computed, onMounted } from 'vue'
import { useProjectsStore } from '../stores/projects'
import { useRecipesStore } from '../stores/recipes'
import { buildChapterPlan } from '../js/compileBook'
import PagePreview from '../components/PagePreview.vue'
import PrintToolbar from '../components/PrintToolbar.vue'
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
    <PrintToolbar :title="`Print Preview: ${project.title}`" @print="printPage" />

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
/* PagePreview itself carries no inter-page spacing (a single preview,
   e.g. RecipePreviewDialog, shouldn't have to cancel out a margin it
   never wanted). This view stacks many pages on screen, so it owns the
   gap between them — print already breaks each page via `break-after`,
   so this is screen-only. */
@media screen {
  .print-project :deep(.page-preview) {
    margin-bottom: var(--space-lg);
  }
}
</style>
