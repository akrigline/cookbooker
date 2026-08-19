<script setup>
import TocChapterRow from './TocChapterRow.vue'
import TocRecipeRow from './TocRecipeRow.vue'
import FavoriteBadge from './FavoriteBadge.vue'
import { DEFAULT_ACCENT_COLOR } from '../js/templates'

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
    default: DEFAULT_ACCENT_COLOR,
  },
  // Digits to reserve for the page-number column (compileBook.js's
  // maxPageNumberDigits). Must be the same value when tocLayout.js measures
  // this component and when ProjectPrint.vue renders it - see TocRecipeRow.vue
  // for what goes wrong otherwise.
  numberDigits: {
    type: Number,
    default: 2,
  },
  // { icon, prefix } from getFavoriteSettings(project) - a single value for
  // the whole page, since favorites display is configured per-cookbook, not
  // per-row. See src/js/favorites.js.
  favoriteSettings: {
    type: Object,
    default: () => ({ icon: 'heart', prefix: '' }),
  },
  // Whether any recipe in the whole book is favorited - not derivable from
  // `rows` alone, since that's only this physical page's slice. Gates the
  // heading-row legend explaining the favorite icon; must be passed
  // identically at measurement (tocLayout.js) and render (ProjectPrint.vue)
  // time since it changes the heading row's height.
  hasFavorites: {
    type: Boolean,
    default: false,
  },
})
</script>

<template>
  <div
    class="toc-page"
    :style="{ '--toc-accent': accentColor, '--toc-number-width': `${numberDigits}ch` }"
  >
    <h2 v-if="showHeading" class="toc-heading">
      <span>Table of Contents</span>
      <span v-if="hasFavorites" class="toc-legend">
        <FavoriteBadge :icon="favoriteSettings.icon" :color="accentColor" />
        means {{ favoriteSettings.prefix || 'favorite' }}
      </span>
    </h2>
    <ul class="toc-rows">
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
        :favorite="row.type === 'recipe' ? !!row.recipe.favorite : false"
        :favorite-settings="favoriteSettings"
      />
    </ul>
  </div>
</template>

<style scoped>
/* Grid rather than plain block so the rows track gets exactly the height the
   heading leaves over. This used to be a hand-tuned `calc(100% - 60px)` on
   .toc-rows, which was wrong by 3px (the heading really occupies 63px) and,
   worse, was a constant that had to be re-derived by hand whenever the heading's
   type or spacing changed. `auto 1fr` is correct by construction and resolves
   identically off-screen (tocLayout.js's measurement container) and on the real
   page. It must stay a *definite* height: `column-fill: auto` on .toc-rows is
   only honored by Chrome/WebKit when the multicol container's height resolves
   (W3C csswg-drafts #4689), and a 1fr track in a fixed-height grid does. */
.toc-page {
  --toc-accent: #d97742;
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-rows: auto 1fr;
}

.toc-page h2 {
  margin: 0 0 var(--space-lg) 0;
  color: var(--toc-accent);
  border-bottom: 3px solid var(--toc-accent);
  padding-bottom: var(--space-sm);
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-md);
}

.toc-legend {
  display: inline-flex;
  align-items: center;
  gap: 0.3em;
  font-size: 14px;
  font-weight: 400;
  color: var(--recipe-on-surface, currentColor);
  white-space: nowrap;
}

.toc-legend :deep(.favorite-badge) {
  font-size: 1.1em;
}

/* Pinned to row 2 so continuation pages (no <h2>) still get the 1fr track
   rather than falling into the `auto` one and collapsing to content height.
   With no heading rendered, row 1 simply has no items and sizes to 0.
   min-height: 0 stops the default `min-height: auto` on a grid item from
   letting the column content push the track taller than the page. */
.toc-rows {
  grid-row: 2;
  min-height: 0;
  columns: 2;
  column-fill: auto;
  column-gap: var(--space-lg);
  list-style: none;
  margin: 0;
  padding: 0;
}
</style>
