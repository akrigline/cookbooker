<script setup>
defineProps({
  title: {
    type: String,
    required: true,
  },
})

const emit = defineEmits(['print'])
</script>

<template>
  <div class="no-print toolbar-container">
    <div class="toolbar">
      <h1>{{ title }}</h1>
      <button type="button" class="btn-print" @click="emit('print')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v8H6z"/></svg>
        Print / Save as PDF
      </button>
    </div>
  </div>
</template>

<style scoped>
.toolbar-container {
  max-width: 8.5in;
  margin: 24px auto;
  padding: 0 16px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.toolbar h1 {
  font-family: 'Newsreader', Georgia, serif;
  font-size: 24px;
  font-weight: 600;
  margin: 0;
  color: var(--ink-20);
}

.btn-print {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: var(--ink-20);
  color: var(--ink-99);
  border: none;
  padding: 10px 18px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-print:hover {
  background: var(--ink-30);
}

.btn-print:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}
</style>
