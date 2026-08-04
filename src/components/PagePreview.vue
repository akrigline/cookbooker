<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'

defineProps({
  named: {
    type: String,
    default: null,
  },
})

// Fixed page height clips overflowing content with no other visual sign
// anything was cut off. Compare the natural content height against the
// available (margin-adjusted) height and surface a warning when it doesn't
// fit — screen only, since print switches to height:auto and never clips.
const marginEl = ref(null)
const contentEl = ref(null)
const isOverflowing = ref(false)

function checkOverflow() {
  if (!marginEl.value || !contentEl.value) return
  isOverflowing.value = contentEl.value.scrollHeight > marginEl.value.clientHeight
}

let observer = null

onMounted(() => {
  checkOverflow()
  if (typeof ResizeObserver !== 'undefined' && contentEl.value) {
    observer = new ResizeObserver(checkOverflow)
    observer.observe(contentEl.value)
  }
})

onBeforeUnmount(() => {
  observer?.disconnect()
})
</script>

<template>
  <div class="page-preview" :class="named ? `page--${named}` : null">
    <div class="page-preview__margin" ref="marginEl">
      <div class="page-preview__content" ref="contentEl">
        <slot />
      </div>
    </div>
    <p v-if="isOverflowing" class="page-preview__overflow-warning" role="status">
      Content is taller than one page and may be clipped or split across pages when printed
    </p>
  </div>
</template>

<style scoped>
.page-preview {
  width: 8.5in;
  height: 11in;
  max-width: 100%;
  flex-shrink: 0;
  background: #fff;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.12), 0 1px 4px rgba(0, 0, 0, 0.06);
  border-radius: 4px;
  margin: 0 auto;
  overflow: hidden;
  color: #232323;
  position: relative;
}

.page-preview__margin {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  padding: 0.75in;
}

.page-preview__overflow-warning {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  margin: 0;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 600;
  text-align: center;
  color: oklch(35% 0.14 25);
  background: oklch(92% 0.08 60 / 0.95);
  border-top: 1px solid oklch(70% 0.14 40);
}

@media print {
  .page-preview {
    box-shadow: none;
    border-radius: 0;
    margin: 0;
    width: auto;
    height: auto;
    break-after: page;
  }

  .page-preview:last-child {
    break-after: auto;
  }

  .page-preview__overflow-warning {
    display: none;
  }
}
</style>
