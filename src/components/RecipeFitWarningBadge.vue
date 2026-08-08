<script setup>
</script>

<template>
  <span class="recipe-fit-warning-badge" title="This recipe may not fit on a single printed page">
    <svg viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true" focusable="false">
      <path
        d="M12 3.5 22.5 21H1.5L12 3.5Z"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linejoin="round"
      />
      <line x1="12" y1="10" x2="12" y2="15" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
      <circle cx="12" cy="18" r="1.1" fill="currentColor" />
    </svg>
    <span class="recipe-fit-warning-badge__sr-only">This recipe may not fit on a single printed page</span>
  </span>
</template>

<style scoped>
.recipe-fit-warning-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: oklch(60% 0.16 60);
  line-height: 0;
  vertical-align: middle;
}

.recipe-fit-warning-badge__sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
