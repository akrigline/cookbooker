<script setup>
defineProps({
  named: {
    type: String,
    default: null,
  },
})
</script>

<template>
  <div class="page-preview" :class="named ? `page--${named}` : null">
    <div class="page-preview__margin">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.page-preview {
  width: 8.5in;
  height: 11in;
  flex-shrink: 0;
  background: #fff;
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.18);
  margin: 0 auto var(--space-lg);
  overflow: hidden;
  color: #232323;
}

.page-preview__margin {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  padding: 0.75in;
}

@media print {
  .page-preview {
    box-shadow: none;
    margin: 0;
    width: auto;
    height: auto;
    break-after: page;
  }

  .page-preview:last-child {
    break-after: auto;
  }

  .page-preview__margin {
    padding: 0;
  }
}
</style>
