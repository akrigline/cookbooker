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
    <span class="toc-title">{{ title }}</span>
    <span v-if="pageNumber !== null" class="toc-leader" aria-hidden="true"></span>
    <span v-if="pageNumber !== null" class="toc-page-number">{{ pageNumber }}</span>
  </li>
</template>

<style scoped>
.toc-chapter-row {
  display: flex;
  align-items: flex-end;
  gap: var(--space-xs);
  font-weight: 700;
  font-size: 1.1rem;
  color: var(--toc-accent);
  padding-top: var(--space-md);
  break-inside: avoid;
}

.toc-title {
  flex: 0 1 auto;
  min-width: 0;
}

.toc-leader {
  flex: 1 1 auto;
  border-bottom: 1px dotted currentColor;
  margin-bottom: 3px;
  opacity: 0.5;
}

/* Fixed-width number column - see the same rule in TocRecipeRow.vue for why
   this must not depend on the number's digit count. */
.toc-page-number {
  flex: 0 0 auto;
  min-width: var(--toc-number-width, 2ch);
  text-align: right;
  font-variant-numeric: tabular-nums;
}
</style>
