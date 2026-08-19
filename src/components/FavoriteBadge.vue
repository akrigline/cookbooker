<script setup>
defineProps({
  icon: {
    type: String,
    default: 'star',
    validator: (v) => ['sock', 'star', 'heart'].includes(v),
  },
  label: {
    type: String,
    default: 'Favorite',
  },
})
</script>

<template>
  <span class="favorite-badge" :title="label">
    <svg v-if="icon === 'heart'" viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true" focusable="false">
      <path
        d="M12 20.5 3.6 12.4a5.4 5.4 0 0 1 0-7.8 5.7 5.7 0 0 1 8-.1L12 5l.4-.5a5.7 5.7 0 0 1 8 .1 5.4 5.4 0 0 1 0 7.8L12 20.5Z"
        fill="currentColor"
        stroke="currentColor"
        stroke-width="1"
        stroke-linejoin="round"
      />
    </svg>
    <svg v-else-if="icon === 'star'" viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true" focusable="false">
      <path
        d="M12 2.5 15 9l7 1-5.2 4.8L18.2 22 12 18.4 5.8 22l1.4-7.2L2 10l7-1 3-6.5Z"
        fill="currentColor"
        stroke="currentColor"
        stroke-width="1"
        stroke-linejoin="round"
      />
    </svg>
    <svg v-else viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true" focusable="false">
      <path
        d="M7 2h7l1 5.5c.6.8 1 1.9 1 3.2 0 3.9-1.4 8-1.4 8a1 1 0 0 1-1 .8H8.4a1 1 0 0 1-1-.8S6 15.6 6 11.7c0-1.3.4-2.4 1-3.2L7 2Z"
        fill="none"
        stroke="currentColor"
        stroke-width="1.6"
        stroke-linejoin="round"
      />
      <path
        d="M6.3 12.5c1.7.9 3.6.9 5.4 0"
        fill="none"
        stroke="currentColor"
        stroke-width="1.4"
        stroke-linecap="round"
      />
    </svg>
    <span class="favorite-badge__sr-only">{{ label }}</span>
  </span>
</template>

<style scoped>
.favorite-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: oklch(55% 0.19 20);
  line-height: 0;
  vertical-align: middle;
}

.favorite-badge__sr-only {
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
