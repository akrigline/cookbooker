<script setup>
import TocChapterRow from './TocChapterRow.vue'
import TocRecipeRow from './TocRecipeRow.vue'

defineProps({
  // Flat, ordered row descriptors ({ type: 'chapter', chapter } |
  // { type: 'recipe', chapter, recipe }) for THIS physical TOC page, as
  // produced by tocLayout.js's measureTocLayout. A long table of contents
  // spans several of these pages - one TableOfContentsPage instance per
  // page, each getting only the rows real CSS column-fill layout measured
  // as fitting on it. The actual 2-column split within a page is real CSS
  // (`.toc-rows`'s `columns: 2; column-fill: auto`), not pre-split arrays.
  rows: {
    type: Array,
    required: true,
  },
  // Only the first TOC page shows the "Table of Contents" heading;
  // continuation pages skip it so their rows get the full page height.
  showHeading: {
    type: Boolean,
    default: true,
  },
  // { dividerPages: Map<chapterId, number>, recipePages: Map<"chapterId:recipeId", number> }
  // from compileBook.js's layoutBookPages, or null when the project has
  // page numbers toggled off.
  pageNumbers: {
    type: Object,
    default: null,
  },
  accentColor: {
    type: String,
    default: '#d97742',
  },
})
</script>

<template>
  <div class="toc-page" :style="{ '--toc-accent': accentColor }">
    <h2 v-if="showHeading">Table of Contents</h2>
    <ul class="toc-rows" :class="{ 'toc-rows--with-heading': showHeading }">
      <component
        :is="row.type === 'chapter' ? TocChapterRow : TocRecipeRow"
        v-for="row in rows"
        :key="row.type === 'chapter' ? `c${row.chapter.id}` : `r${row.recipe.id}`"
        :title="row.type === 'chapter' ? row.chapter.name : row.recipe.title"
        :page-number="
          row.type === 'chapter'
            ? pageNumbers
              ? pageNumbers.dividerPages.get(row.chapter.id)
              : null
            : pageNumbers
              ? pageNumbers.recipePages.get(`${row.chapter.id}:${row.recipe.id}`)
              : null
        "
      />
    </ul>
  </div>
</template>

<style scoped>
.toc-page {
  --toc-accent: #d97742;
  width: 100%;
  height: 100%;
}

.toc-page h2 {
  margin: 0 0 var(--space-lg) 0;
  color: var(--toc-accent);
  border-bottom: 3px solid var(--toc-accent);
  padding-bottom: var(--space-sm);
}

.toc-rows {
  height: 100%;
  columns: 2;
  column-fill: auto;
  column-gap: var(--space-lg);
  list-style: none;
  margin: 0;
  padding: 0;
}

/* Leaves room for the "Table of Contents" heading above it, which only
   page 1 renders - see tocLayout.js for why this is a plain constant
   rather than a JS-measured heading height. */
.toc-rows--with-heading {
  height: calc(100% - 60px);
}
</style>
