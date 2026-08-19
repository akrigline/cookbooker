<script setup>
import { computed } from 'vue'
import FavoriteBadge from './FavoriteBadge.vue'

const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  pageNumber: {
    type: Number,
    default: null,
  },
  favorite: {
    type: Boolean,
    default: false,
  },
  // { icon, prefix } from getFavoriteSettings(project) - see src/js/favorites.js
  favoriteSettings: {
    type: Object,
    default: () => ({ icon: 'heart', prefix: '' }),
  },
})

const displayTitle = computed(() =>
  props.favorite && props.favoriteSettings.prefix
    ? `${props.favoriteSettings.prefix} ${props.title}`
    : props.title,
)
</script>

<template>
  <li class="toc-recipe-row">
    <span class="toc-title" :class="{ 'toc-title--favorite': favorite }">
      {{ displayTitle }}
      <FavoriteBadge v-if="favorite" :icon="favoriteSettings.icon" />
      <span v-if="pageNumber !== null" class="toc-leader" aria-hidden="true"></span>
    </span>
    <span v-if="pageNumber !== null" class="toc-page-number">{{ pageNumber }}</span>
  </li>
</template>

<style scoped>
/* Grid, not flex: the leader dots have to be part of the title's own inline
   text flow (see .toc-leader below for why), which only works if the title
   column's width is resolved independently of the leader/page-number being
   flex siblings competing for space on one un-wrapped line. */
.toc-recipe-row {
  display: grid;
  grid-template-columns: auto max-content;
  align-items: end;
  column-gap: var(--space-xs);
  padding: 2px 0 2px var(--space-md);
  break-inside: avoid;
}

/* overflow: hidden crops the leader's oversized dot content (below) down to
   whatever actually fits after the title's real text - including on a
   wrapped title, where that's only the tail end of the last line. */
.toc-title {
  position: relative;
  overflow: hidden;
}

.toc-title--favorite {
  font-weight: 700;
}

.toc-title :deep(.favorite-badge) {
  margin-left: 0.3em;
}

/* Dot leader that survives title wrapping (h/t css-tricks.com/a-perfect-
   table-of-contents-with-html-css). The trick: .toc-leader is a real, empty
   inline span sitting right after the title text/badge in normal flow, so
   it lands whereever the title actually wrapped to (mid-line for a short
   title, after the last word of a wrapped one). Its ::after is
   `position: absolute` with every inset left `auto`, which resolves to the
   CSS static-position rule: the box starts exactly at .toc-leader's in-flow
   position and (since width is also auto) shrink-to-fits into whatever
   space remains to .toc-title's right edge. The content is a many-times-
   repeated dot string specifically so it overflows that available width -
   an empty/short ::after would just collapse to 0 width instead of
   stretching to fill it. The repeated content wraps onto further lines
   within its own box, but since it's out-of-flow it doesn't grow
   .toc-title's height, so `.toc-title`'s overflow: hidden crops every line
   past the first - leaving only the one row of dots that lines up with the
   title's real last line. */
.toc-leader::after {
  position: absolute;
  padding-left: 0.25ch;
  content: ' . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . '
    '. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . '
    '. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . '
    '. . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . . ';
  text-align: right;
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
  min-width: var(--toc-number-width, 2ch);
  text-align: right;
  font-variant-numeric: tabular-nums;
}
</style>
