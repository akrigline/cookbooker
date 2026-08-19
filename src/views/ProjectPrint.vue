<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useProjectsStore } from '../stores/projects'
import { useRecipesStore } from '../stores/recipes'
import { useSettingsStore } from '../stores/settings'
import { buildChapterPlan, layoutBookPages } from '../js/compileBook'
import { measureTocLayout } from '../js/tocLayout'
import { getFavoriteSettings } from '../js/favorites'
import { PAGE_GUTTER, PAGE_MARGIN } from '../js/pageDimensions'
import { applyPageSizeOverride, clearPageSizeOverride } from '../js/pageSizeOverride'
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
const settingsStore = useSettingsStore()

onMounted(async () => {
  if (!projectsStore.loaded) await projectsStore.load()
  if (!recipesStore.loaded) await recipesStore.load()
})

const pageSize = computed(() => settingsStore.pageSize)

const projectIdNum = computed(() => Number(props.projectId))
const project = computed(() => projectsStore.projects.find((p) => p.id === projectIdNum.value))
const favoriteSettings = computed(() => getFavoriteSettings(project.value))
const recipesById = computed(() => new Map(recipesStore.recipes.map((r) => [r.id, r])))

const chapterPlan = computed(() =>
  buildChapterPlan({
    chapters: projectsStore.chapters,
    projectRecipes: projectsStore.projectRecipes,
    recipesById: recipesById.value,
    projectId: projectIdNum.value,
  }),
)

const hasFavorites = computed(() =>
  chapterPlan.value.some((entry) => entry.recipes.some((recipe) => recipe.favorite)),
)
const showToc = computed(() => Boolean(project.value?.pageNumbersEnabled))
const doubleSided = computed(() => Boolean(project.value?.doubleSidedEnabled))
const chaptersById = computed(() => new Map(chapterPlan.value.map((e) => [e.chapter.id, e.chapter])))

// The table of contents can span more than one physical page, and how many
// it needs depends on real rendered row heights (title wrapping) that only
// exist after a DOM mount - see tocLayout.js's measureTocLayout. Every
// chapter/recipe page number below depends on that count, so this can't be
// a plain synchronous computed; the template gates all page rendering on
// `tocReady` so a stale/undercounted TOC page count is never shown, even
// briefly. `tocMeasureToken` drops the result of a superseded async run if
// the chapter plan changes again before a previous measurement resolves.
// `doubleSided` is a real dependency here, not just a rendering flag: it changes
// the page's content width via the binding gutter below, so toggling it has to
// re-measure or the TOC keeps a split computed for the other width. `pageSize`
// is the same story - it changes the content box's width AND height, so a
// paper-size change has to re-measure too.
const tocPages = ref([])
const tocNumberDigits = ref(2)
const tocReady = ref(false)
let tocMeasureToken = 0
watch(
  [chapterPlan, showToc, doubleSided, pageSize, favoriteSettings],
  async ([plan, enabled, isDoubleSided, size, favSettings]) => {
    const token = ++tocMeasureToken
    tocReady.value = false
    const result = enabled
      ? await measureTocLayout(plan, { doubleSided: isDoubleSided, pageSize: size, favoriteSettings: favSettings })
      : { pages: [], numberDigits: 2 }
    if (token !== tocMeasureToken) return
    tocPages.value = result.pages
    // Render with the value the split was measured with, rather than
    // recomputing - a mismatch would reintroduce measured-vs-rendered drift.
    tocNumberDigits.value = result.numberDigits
    tocReady.value = true
    if (import.meta.env.DEV) nextTick(() => warnOnClippedTocRows())
  },
  { immediate: true },
)

// TOC pages set `hide-overflow-warning` (correctly - they pack right to the
// column edge, which trips PagePreview's own scrollHeight heuristic as a false
// positive), so a genuinely over-filled TOC page has no visible symptom at all:
// PagePreview just clips it. Every TOC clipping bug found so far was silent for
// exactly that reason. This is the replacement signal - dev-only, since it costs
// a layout read per row.
function warnOnClippedTocRows() {
  for (const page of document.querySelectorAll('.print-project__pages .page-preview')) {
    const content = page.querySelector('.page-preview__content')
    const rows = page.querySelectorAll('.toc-rows > *')
    if (!content || rows.length === 0) continue
    const box = content.getBoundingClientRect()
    const clipped = Array.from(rows).filter((row) => {
      const r = row.getBoundingClientRect()
      return r.bottom > box.bottom + 0.5 || r.right > box.right + 0.5
    })
    if (clipped.length > 0) {
      console.warn(
        `[toc] ${clipped.length} row(s) assigned to a TOC page that cannot display them - ` +
          'measured page geometry disagrees with rendered geometry (see tocLayout.js).',
        clipped.map((el) => el.textContent.trim()),
      )
    }
  }
}

// Numbering begins at 1 on the first chapter divider (the Title Page and
// Table of Contents are unnumbered front matter, per print-and-export
// spec's "System Print Integration" requirement) - null when the project
// has page numbers toggled off entirely. Also drives blank-page insertion
// for recto-forced TOC/chapter starts when double-sided printing is on.
const bookLayout = computed(() =>
  layoutBookPages(chapterPlan.value, { doubleSided: doubleSided.value, tocPageCount: tocPages.value.length }),
)
const pageNumbers = computed(() =>
  showToc.value ? { dividerPages: bookLayout.value.dividerPages, recipePages: bookLayout.value.recipePages } : null,
)

function printPage() {
  window.print()
}

// Symmetric create/update in the watcher, teardown on unmount - see
// pageSizeOverride.js for why this is a `<style>` injection rather than a
// CSS variable.
watch(pageSize, applyPageSizeOverride, { immediate: true })
onBeforeUnmount(clearPageSizeOverride)
</script>

<template>
  <!-- The gutter/margin widths come from pageDimensions.js rather than being
       re-typed as literals in the CSS below, because tocLayout.js has to
       measure against the exact same numbers - see pageContentBox(). -->
  <div
    v-if="project"
    class="print-project"
    :class="{ 'print-project--double-sided': doubleSided }"
    :style="{ '--page-gutter': PAGE_GUTTER, '--page-margin': PAGE_MARGIN }"
  >
    <PrintToolbar :title="`Print Preview: ${project.title}`" @print="printPage" />

    <p v-if="!tocReady" class="print-project__preparing">Preparing print preview…</p>

    <!-- Dedicated wrapper so every `.page-preview` sibling's nth-of-type
         position among *this* parent's children is exactly its physical
         page position - PrintToolbar (and anything else outside this
         wrapper) renders its own root <div>, which would otherwise count
         toward the same "div" nth-of-type sequence and throw off parity. -->
    <div v-else class="print-project__pages">
      <PagePreview :paper-size="pageSize">
        <CoverPage :project="project" />
      </PagePreview>

      <template v-for="entry in bookLayout.pages" :key="`${entry.type}-${entry.page}`">
        <PagePreview v-if="entry.type === 'blank'" :paper-size="pageSize" />

        <PagePreview v-else-if="entry.type === 'toc'" :paper-size="pageSize" hide-overflow-warning>
          <TableOfContentsPage
            :rows="tocPages[entry.tocPageIndex].rows"
            :show-heading="entry.tocPageIndex === 0"
            :page-numbers="pageNumbers"
            :accent-color="project.accentColor"
            :number-digits="tocNumberDigits"
            :favorite-settings="favoriteSettings"
            :has-favorites="hasFavorites"
          />
        </PagePreview>

        <PagePreview v-else-if="entry.type === 'divider'" :paper-size="pageSize" :page-number="entry.printedNumber">
          <ChapterDividerPage
            :chapter-name="chaptersById.get(entry.chapterId).name"
            :accent-color="project.accentColor"
          />
        </PagePreview>

        <PagePreview v-else :paper-size="pageSize" :page-number="entry.printedNumber">
          <RecipeSheet :recipe="recipesById.get(entry.recipeId)" :project="project" />
        </PagePreview>
      </template>
    </div>
  </div>
  <main id="cm-main" style="max-width:1160px; margin:0 auto; padding:40px 32px 80px;" v-else>
    <p>Project not found.</p>
  </main>
</template>

<style scoped>
.print-project__preparing {
  text-align: center;
  padding: var(--space-xl, 3rem) 0;
  color: var(--ink-46, #757575);
}

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

/* The real double-sided gutter/page-number mechanism, in both screen
   preview and print - not a screen-only approximation of something else
   real print uses, since PagePreview.vue's margin is now the same
   .page-preview__margin padding in both modes (print.css sets @page's own
   margin to 0, so there's no second, @page-based gutter to keep in sync
   with this one). DOM order among .print-project__pages's .page-preview
   children is physical page order (one child per physical page, blanks
   included), so nth-of-type parity is exactly page parity - no
   JS-computed prop needed. The dedicated wrapper matters: nth-of-type
   counts by tag name among ALL siblings, not just elements matching the
   rest of the selector, so without it PrintToolbar's own root <div> would
   occupy a "div" sibling slot and shift every page's parity by one.
   :not(:first-of-type) excludes the Title Page (always position 1), which
   stays symmetric. :deep() reaches into PagePreview.vue's own scoped
   elements. */
.print-project--double-sided
  :deep(.print-project__pages .page-preview:not(:first-of-type):nth-of-type(odd) .page-preview__margin) {
  padding-left: var(--page-gutter);
  padding-right: var(--page-margin);
}
.print-project--double-sided
  :deep(.print-project__pages .page-preview:nth-of-type(even) .page-preview__margin) {
  padding-left: var(--page-margin);
  padding-right: var(--page-gutter);
}
.print-project--double-sided
  :deep(.print-project__pages .page-preview:nth-of-type(even) .page-preview__page-number) {
  right: auto;
  left: var(--page-margin);
}
</style>
