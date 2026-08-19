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
  // Overrides the default badge color, e.g. with a cookbook's accentColor.
  // Falls back to the CSS default when not supplied.
  color: {
    type: String,
    default: null,
  },
})
</script>

<template>
  <span class="favorite-badge" :title="label" :style="color ? { color } : undefined">
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
    <svg v-else viewBox="49 20 177 209" width="1em" height="1em" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M131 23c2.31.36 4.56.78 6.84 1.27.72.14 1.45.29 2.2.45 2.44.5 4.89 1.02 7.34 1.53 1.71.36 3.42.71 5.14 1.07 4.77 1 9.54 2 14.31 3.01l9.99 2.1c5.85 1.23 11.69 2.47 17.54 3.71 2.3.49 4.61.98 6.91 1.46 3.25.69 6.5 1.38 9.75 2.08.98.2 1.96.41 2.97.62.9.2 1.8.39 2.72.59.78.17 1.57.33 2.38.51C221 42 221 42 223 44c-.33 2.49-.77 4.8-1.34 7.24-.09.37-.09.37-.5 2.25-.36 1.62-.72 3.23-1.09 4.84-.97 4.32-1.9 8.64-2.82 12.97-.19.89-.38 1.77-.58 2.69-4.35 20.47-8.08 41.06-8.6 62.02-.49 13.19-3.61 27.26-13.07 36.99-6.77 5.55-14.23 9.15-22.18 12.71-12.12 5.48-22.18 11.77-32.06 20.74-14.44 12.68-30.42 19.97-49.65 18.78-11.85-1.31-21.5-8.62-28.92-17.54-8.56-11.66-10.35-23.6-9.19-37.69.83-3.99 2.14-7.38 4-11 .21-.42.21-.42 1.29-2.54 8.19-14.77 21.91-24.85 35.1-34.89 21.76-16.65 23.87-39.49 29.38-64.88 1.26-5.79 2.53-11.58 3.8-17.37.44-2.01.88-4.02 1.31-6.04.26-1.2.53-2.41.8-3.65.23-1.07.46-2.13.7-3.23C130 24 130 24 131 23m0 43c-.54 2-1.09 4-1.62 6-.18.65-.36 1.3-.54 1.97-1.16 4.33-2.24 8.68-3.27 13.05-.12.53-.12.53-.75 3.18-.5 2.07-.98 4.15-1.45 6.23-4.21 17.55-16.17 27.38-30.07 37.78C83.26 141.74 74.49 149.85 67 160c1.58 3.15 4.79 3.59 7.94 4.75 14.22 5.5 26.23 13.14 33.06 27.25 2.79 6.52 4.63 13.06 6 20 8.76-3.28 15.87-8.74 22.81-14.88 10.23-8.96 20.79-15.36 33.41-20.47 1.96-.81 3.88-1.72 5.78-2.65 1-3 1-3 .24-4.77-.4-.65-.81-1.3-1.22-1.96-.45-.72-.89-1.44-1.34-2.19-.47-.75-.94-1.5-1.43-2.27-8.25-13.2-8.25-13.2-8.25-19.69 1-2.12 1-2.12 3.15-3.2 3.19-1.03 6.13-1.44 9.46-1.77 1.25-.13 2.5-.26 3.78-.39 1.3-.13 2.59-.25 3.92-.38.66-.07.66-.07 3.98-.41 3.24-.33 6.47-.65 9.71-.97.86-4.04 1.13-7.8 1.25-11.94.43-10.12 2.27-20.03 4.02-29.99.22-1.26.44-2.52.67-3.81.2-1.14.41-2.27.62-3.44C205 84 205 84 205 81c-17.56-3.96-35.14-7.88-52.77-11.54-1.48-.3-2.97-.61-4.45-.92-2.07-.44-4.14-.86-6.22-1.29-1.17-.24-2.35-.48-3.56-.73-3-.52-3-.52-7-.52"
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
