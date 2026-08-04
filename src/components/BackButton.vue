<script setup>
defineProps({
  to: { type: [String, Object], required: true },
})
</script>

<template>
  <router-link :to="to" class="cm-back-link">
    <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
    <slot />
  </router-link>
</template>

<style scoped>
.cm-back-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  color: var(--gray-52);
  margin-bottom: 20px;
  transition: color 0.12s;
}

.cm-back-link:hover { color: var(--gray-20); }
</style>
