<script setup>
// favorite/favoriteSettings aren't rendered here - chapters can't be
// favorited - but are declared so TableOfContentsPage.vue's dynamic
// `:is="row.type === 'chapter' ? TocChapterRow : TocRecipeRow"` can pass
// the same prop set to both without either leaking onto the root <li> as a
// non-standard HTML attribute.
defineProps({
  title: {
    type: String,
    required: true,
  },
  pageNumber: {
    type: Number,
    default: null,
  },
  favorite: {
    type: Boolean,
    default: false,
  },
  favoriteSettings: {
    type: Object,
    default: () => ({ icon: 'heart', prefix: '' }),
  },
})
</script>

<template>
  <li class="toc-chapter-row">
    <span class="toc-title">
      {{ title }}
      <span v-if="pageNumber !== null" class="toc-leader" aria-hidden="true"></span>
    </span>
    <span v-if="pageNumber !== null" class="toc-page-number">{{ pageNumber }}</span>
  </li>
</template>

<style scoped>
/* Grid, not flex - see the same rule in TocRecipeRow.vue for why the leader
   dots need to live inside the title's own inline flow rather than as a
   flex sibling. */
.toc-chapter-row {
  display: grid;
  grid-template-columns: auto max-content;
  align-items: end;
  column-gap: var(--space-xs);
  font-weight: 700;
  font-size: 1.1rem;
  color: var(--toc-accent);
  padding-top: var(--space-md);
  break-inside: avoid;
}

.toc-title {
  position: relative;
  overflow: hidden;
}

/* Dot leader that survives title wrapping - see the full explanation on the
   same rule in TocRecipeRow.vue. */
.toc-leader::after {
  position: absolute;
  padding-left: 0.25ch;
  content: ' . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . '
    '. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . '
    '. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . '
    '. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . ';
  text-align: right;
  opacity: 0.5;
}

/* Fixed-width number column - see the same rule in TocRecipeRow.vue for why
   this must not depend on the number's digit count. */
.toc-page-number {
  min-width: var(--toc-number-width, 2ch);
  text-align: right;
  font-variant-numeric: tabular-nums;
}
</style>
