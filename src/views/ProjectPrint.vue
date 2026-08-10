<script setup>
import { computed, onMounted } from 'vue'
import { useProjectsStore } from '../stores/projects'
import { useRecipesStore } from '../stores/recipes'
import { assignPageNumbers, buildChapterPlan } from '../js/compileBook'
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
// Numbering begins at 1 on the first chapter divider (the Cover and Table of
// Contents are unnumbered front matter, per print-and-export spec's "System
// Print Integration" requirement) - null when the project has page numbers
// toggled off entirely.
const pageNumbers = computed(() =>
  showToc.value ? assignPageNumbers(chapterPlan.value) : null,
)

function printPage() {
  window.print()
}
</script>

<template>
  <div v-if="project" class="print-project">
    <PrintToolbar :title="`Print Preview: ${project.title}`" @print="printPage" />

    <PagePreview>
      <CoverPage :project="project" />
    </PagePreview>

    <PagePreview v-if="showToc">
      <TableOfContentsPage
        :chapters="chapterPlan"
        :page-numbers="pageNumbers"
        :accent-color="project.accentColor"
      />
    </PagePreview>

    <template v-for="entry in chapterPlan" :key="entry.chapter.id">
      <PagePreview :page-number="pageNumbers?.dividerPages.get(entry.chapter.id) ?? null">
        <ChapterDividerPage :chapter-name="entry.chapter.name" :accent-color="project.accentColor" />
      </PagePreview>
      <PagePreview
        v-for="recipe in entry.recipes"
        :key="recipe.id"
        :page-number="pageNumbers?.recipePages.get(`${entry.chapter.id}:${recipe.id}`) ?? null"
      >
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
