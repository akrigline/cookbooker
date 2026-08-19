<script setup>
import { computed } from 'vue'
import { DEFAULT_LAYOUT_TEMPLATE, DEFAULT_ACCENT_COLOR } from '../js/templates'
import { getFavoriteSettings } from '../js/favorites'
import { useSettingsStore } from '../stores/settings'
import RecipeLayoutDefault from './RecipeLayoutDefault.vue'
import RecipeLayoutTwoColumn from './RecipeLayoutTwoColumn.vue'
import RecipeLayoutHeroSplitBalanced from './RecipeLayoutHeroSplitBalanced.vue'
import RecipeLayoutHeroSplitAsymmetric from './RecipeLayoutHeroSplitAsymmetric.vue'
import RecipeLayoutAsymmetricSidebar from './RecipeLayoutAsymmetricSidebar.vue'
import RecipeLayoutColumnOptimized from './RecipeLayoutColumnOptimized.vue'
import RecipeLayoutBalancedHeader from './RecipeLayoutBalancedHeader.vue'
import RecipeLayoutDualColumnBottomSplit from './RecipeLayoutDualColumnBottomSplit.vue'
import RecipeLayoutTextOnly from './RecipeLayoutTextOnly.vue'

const LAYOUT_COMPONENTS = {
  default: RecipeLayoutDefault,
  'two-column': RecipeLayoutTwoColumn,
  'hero-split-balanced': RecipeLayoutHeroSplitBalanced,
  'hero-split-asymmetric': RecipeLayoutHeroSplitAsymmetric,
  'asymmetric-sidebar': RecipeLayoutAsymmetricSidebar,
  'column-optimized': RecipeLayoutColumnOptimized,
  'balanced-header': RecipeLayoutBalancedHeader,
  'dual-column-bottom-split': RecipeLayoutDualColumnBottomSplit,
  'text-only': RecipeLayoutTextOnly,
}

const props = defineProps({
  recipe: {
    type: Object,
    required: true,
  },
  // Not required: undefined lets the app-wide default through. Kept as a prop
  // (rather than reading the store directly in the leaf) so a future
  // per-cookbook override stays a one-line change at call sites that hold a
  // project, with no re-threading through the layout wrappers.
  qtyAlign: {
    type: String,
    default: undefined,
  },
  // The active cookbook project, when rendering within one (null/undefined
  // outside any cookbook context, e.g. the standalone editor preview) - see
  // getFavoriteSettings in src/js/favorites.js for the resulting icon rule.
  project: {
    type: Object,
    default: null,
  },
})

const settingsStore = useSettingsStore()

const activeLayout = computed(
  () => LAYOUT_COMPONENTS[props.recipe.layoutTemplate] ?? LAYOUT_COMPONENTS[DEFAULT_LAYOUT_TEMPLATE],
)
const resolvedQtyAlign = computed(() => props.qtyAlign ?? settingsStore.ingredientQtyAlign)
const favoriteSettings = computed(() => getFavoriteSettings(props.project))
const accentColor = computed(() => props.project?.accentColor || DEFAULT_ACCENT_COLOR)
</script>

<template>
  <article
    class="recipe-sheet"
    :data-qty-align="resolvedQtyAlign"
    :style="{ '--recipe-qty-align': resolvedQtyAlign }"
  >
    <component :is="activeLayout" :recipe="recipe" :favorite-settings="favoriteSettings" :accent-color="accentColor" />
  </article>
</template>

<style scoped>
.recipe-sheet {
  background: var(--recipe-bg);
  color: var(--recipe-on-surface);
  position: relative;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
}

/* Inline flow mode: qty + name run together as normal left-aligned text */
.recipe-sheet[data-qty-align="inline"] :deep(.ingredient-item) {
  display: block;
}

.recipe-sheet[data-qty-align="inline"] :deep(.ingredient-qty) {
  display: inline;
  flex: none;
  padding-right: 0.25em;
  white-space: normal;
}

.recipe-sheet[data-qty-align="inline"] :deep(.ingredient-name) {
  display: inline;
  flex: none;
}

.recipe-sheet[data-qty-align="inline"] :deep(.qty-primary) {
  display: inline;
}

.recipe-sheet[data-qty-align="inline"] :deep(.qty-secondary) {
  display: inline;
  margin-left: 0.2em;
}

</style>
