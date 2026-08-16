<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'

defineProps({
  // Printed page number to display in the bottom-right corner. null/undefined
  // renders no badge at all (cover, TOC, chapter-divider/recipe pages when
  // the project has page numbers toggled off, single-recipe exports).
  pageNumber: {
    type: Number,
    default: null,
  },
  // TOC pages are intentionally packed to fill their column height as
  // closely as possible (see tocLayout.js's measureTocLayout), which can
  // trip this component's own overflow heuristic right at the boundary -
  // a false positive there, not a real clipping bug, so ProjectPrint.vue
  // sets this for every TOC page.
  hideOverflowWarning: {
    type: Boolean,
    default: false,
  },
})

// Fixed page height clips overflowing content with no other visual sign
// anything was cut off. .page-preview__content is itself height-clamped
// (max-height: 100% + overflow: hidden, below), so its own scrollHeight vs
// clientHeight is a direct self-overflow check - screen only because JS
// can't observe print-media layout, but print now clips exactly the same
// way (.page-preview keeps the same fixed box in both modes), so this
// warning is a true preview of what print will do, not just a screen-only
// approximation of a different print behavior.
const contentEl = ref(null)
const isOverflowing = ref(false)

function checkOverflow() {
  if (!contentEl.value) return
  isOverflowing.value = contentEl.value.scrollHeight > contentEl.value.clientHeight
}

let resizeObserver = null
let mutationObserver = null

onMounted(() => {
  checkOverflow()
  if (!contentEl.value) return
  // ResizeObserver alone only catches contentEl's own box changing size (e.g.
  // the page shrinking under max-width:100% on a narrow screen) - it does NOT
  // fire when a descendant's content grows/shrinks, because contentEl itself
  // is height-clamped (max-height:100% + overflow:hidden, see above) so its
  // own box never resizes as content is edited. That left this warning stuck
  // at whatever it was at mount time while the user kept typing. A
  // MutationObserver on the slotted content catches exactly that case.
  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(checkOverflow)
    resizeObserver.observe(contentEl.value)
  }
  if (typeof MutationObserver !== 'undefined') {
    mutationObserver = new MutationObserver(checkOverflow)
    // attributes:true matters as much as childList/characterData here - some
    // layout-affecting changes (e.g. the ingredient column-count picker) are
    // applied as a `style`/`class` attribute change on an existing element,
    // not a change to its children or text, and would otherwise be missed.
    mutationObserver.observe(contentEl.value, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
    })
  }
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  mutationObserver?.disconnect()
})
</script>

<template>
  <div class="page-preview">
    <div class="page-preview__margin">
      <div class="page-preview__content" ref="contentEl">
        <slot />
      </div>
    </div>
    <span v-if="pageNumber != null" class="page-preview__page-number">{{ pageNumber }}</span>
    <p v-if="isOverflowing && !hideOverflowWarning" class="page-preview__overflow-warning" role="status">
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
  padding: 0.5in;
  outline: 1px dashed oklch(65% 0.18 25 / 0.35);
  outline-offset: -0.5in;
}

.page-preview__content {
  height: 100%;
  max-height: 100%;
  overflow: hidden;
}

/* Flush with the bottom-right corner of the page's own 0.5in margin band -
   right at the same edge .page-preview__content's padding stops at, not
   floating within the band, so it lines up with the printed text block's
   corner. ProjectPrint.vue mirrors this to the bottom-left for even
   (left-hand) pages of a double-sided book, matching that side's gutter. */
.page-preview__page-number {
  position: absolute;
  bottom: 0.5in;
  right: 0.5in;
  font-size: 10pt;
  font-family: var(--font-main, serif);
  color: inherit;
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
  /* Width/height/padding are NOT overridden here - .page-preview and
     .page-preview__margin keep the exact same 8.5in/11in/0.5in box model as
     the screen mockup. @page's own margin is 0 (print.css), so there's no
     second margin source left to double up with; the one real source is
     this padding, in both modes. Only the screen-only chrome (drop shadow,
     rounded corners, the centering margin between stacked previews, and
     the dashed margin-guide outline) needs zeroing for print. */
  .page-preview {
    box-shadow: none;
    border-radius: 0;
    margin: 0;
    break-after: page;
  }

  .page-preview__margin {
    outline: none;
  }

  .page-preview:last-child {
    break-after: auto;
  }

  .page-preview__overflow-warning {
    display: none;
  }
}
</style>
