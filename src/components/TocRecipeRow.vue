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

.toc-page-number {
  flex: 0 0 auto;
  text-align: right;
}
</style>
