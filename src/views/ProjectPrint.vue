<script setup>
import { computed, onBeforeUnmount, onMounted, watch } from 'vue'
import { useProjectsStore } from '../stores/projects'
import { useRecipesStore } from '../stores/recipes'
import { buildChapterPlan, layoutBookPages } from '../js/compileBook'
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
const doubleSided = computed(() => Boolean(project.value?.doubleSidedEnabled))
const chaptersById = computed(() => new Map(chapterPlan.value.map((e) => [e.chapter.id, e.chapter])))

// Numbering begins at 1 on the first chapter divider (the Title Page and
// Table of Contents are unnumbered front matter, per print-and-export
// spec's "System Print Integration" requirement) - null when the project
// has page numbers toggled off entirely. Also drives blank-page insertion
// for recto-forced TOC/chapter starts when double-sided printing is on.
const bookLayout = computed(() =>
  layoutBookPages(chapterPlan.value, { doubleSided: doubleSided.value, showToc: showToc.value }),
)
const pageNumbers = computed(() =>
  showToc.value ? { dividerPages: bookLayout.value.dividerPages, recipePages: bookLayout.value.recipePages } : null,
)

function printPage() {
  window.print()
}

// Real print margins for double-sided books: @page is a top-level at-rule
// and can't be written inside this SFC's own <style> block scoped to a
// class (Vue's compiler also rejects a <style> tag placed directly in
// <template> - "tags with side effect are ignored"). So this manages a
// plain <style> element in document.head imperatively, matching the
// toggle exactly. :first pins the Title Page symmetric, overriding
// :right's gutter for that one page.
let gutterStyleEl = null
watch(
  doubleSided,
  (enabled) => {
    if (enabled && !gutterStyleEl) {
      gutterStyleEl = document.createElement('style')
      gutterStyleEl.textContent = `
        @page :right { margin-left: 0.75in; margin-right: 0.5in; }
        @page :left { margin-left: 0.5in; margin-right: 0.75in; }
        @page :first { margin: 0.5in; }
      `
      document.head.appendChild(gutterStyleEl)
    } else if (!enabled && gutterStyleEl) {
      gutterStyleEl.remove()
      gutterStyleEl = null
    }
  },
  { immediate: true },
)
onBeforeUnmount(() => gutterStyleEl?.remove())
</script>

<template>
  <div v-if="project" class="print-project" :class="{ 'print-project--double-sided': doubleSided }">
    <PrintToolbar :title="`Print Preview: ${project.title}`" @print="printPage" />

    <!-- Dedicated wrapper so every `.page-preview` sibling's nth-of-type
         position among *this* parent's children is exactly its physical
         page position - PrintToolbar (and anything else outside this
         wrapper) renders its own root <div>, which would otherwise count
         toward the same "div" nth-of-type sequence and throw off parity. -->
    <div class="print-project__pages">
      <PagePreview>
        <CoverPage :project="project" />
      </PagePreview>

      <template v-for="entry in bookLayout.pages" :key="`${entry.type}-${entry.page}`">
        <PagePreview v-if="entry.type === 'blank'" />

        <PagePreview v-else-if="entry.type === 'toc'">
          <TableOfContentsPage
            :chapters="chapterPlan"
            :page-numbers="pageNumbers"
            :accent-color="project.accentColor"
          />
        </PagePreview>

        <PagePreview v-else-if="entry.type === 'divider'" :page-number="entry.printedNumber">
          <ChapterDividerPage
            :chapter-name="chaptersById.get(entry.chapterId).name"
            :accent-color="project.accentColor"
          />
        </PagePreview>

        <PagePreview v-else :page-number="entry.printedNumber">
          <RecipeSheet :recipe="recipesById.get(entry.recipeId)" :accent-color="project.accentColor" />
        </PagePreview>
      </template>
    </div>
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

/* Screen-preview mirror of the double-sided gutter/page-number position:
   DOM order among .print-project__pages's .page-preview children is
   physical page order (one child per physical page, blanks included), so
   nth-of-type parity is exactly page parity - no JS-computed prop needed.
   The dedicated wrapper matters: nth-of-type counts by tag name among ALL
   siblings, not just elements matching the rest of the selector, so
   without it PrintToolbar's own root <div> would occupy a "div" sibling
   slot and shift every page's parity by one. :not(:first-of-type)
   excludes the Title Page (always position 1), which stays symmetric.
   :deep() reaches into PagePreview.vue's own scoped elements. */
.print-project--double-sided
  :deep(.print-project__pages .page-preview:not(:first-of-type):nth-of-type(odd) .page-preview__margin) {
  padding-left: 0.75in;
  padding-right: 0.5in;
}
.print-project--double-sided
  :deep(.print-project__pages .page-preview:nth-of-type(even) .page-preview__margin) {
  padding-left: 0.5in;
  padding-right: 0.75in;
}
.print-project--double-sided
  :deep(.print-project__pages .page-preview:nth-of-type(even) .page-preview__page-number) {
  right: auto;
  left: 0.3in;
}
</style>
