<script setup>
defineProps({
  title: {
    type: String,
    required: true,
  },
  pageNumber: {
    type: Number,
    default: null,
  },
})
</script>

<template>
  <li class="toc-recipe-row">
    <span class="toc-title">{{ title }}</span>
    <span v-if="pageNumber !== null" class="toc-leader" aria-hidden="true"></span>
    <span v-if="pageNumber !== null" class="toc-page-number">{{ pageNumber }}</span>
  </li>
</template>

<style scoped>
.toc-recipe-row {
  display: flex;
  align-items: flex-end;
  gap: var(--space-xs);
  padding: 2px 0 2px var(--space-md);
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

/* Fixed-width number column (see TableOfContentsPage.vue's --toc-number-width).
   Not cosmetic: with an auto-width number, a 3-digit page number is wider than
   a 1-digit one, which shrinks .toc-title and can tip a borderline title onto a
   second line. tocLayout.js has to measure this row before real page numbers
   exist (they depend on the TOC's own length), so it measures with a
   placeholder - and any value-dependent width makes the measured row shorter
   than the rendered one, silently over-filling the page. Reserving the column
   makes row height independent of the number's value, which is what lets that
   placeholder be correct. tabular-nums because `ch` is the width of "0" and
   proportional digits aren't all that wide. */
.toc-page-number {
  flex: 0 0 auto;
  min-width: var(--toc-number-width, 2ch);
  text-align: right;
  font-variant-numeric: tabular-nums;
}
</style>
