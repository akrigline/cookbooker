<script setup>
import { computed } from 'vue'
import { DEFAULT_LAYOUT_TEMPLATE } from '../js/templates'
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
  accentColor: {
    type: String,
    default: '#d97742',
  },
  // Not required: undefined lets the app-wide default through. Kept as a prop
  // (rather than reading the store directly in the leaf) so a future
  // per-cookbook override stays a one-line change at call sites that hold a
  // project, with no re-threading through the layout wrappers.
  qtyAlign: {
    type: String,
    default: undefined,
  },
})

const settingsStore = useSettingsStore()

const activeLayout = computed(
  () => LAYOUT_COMPONENTS[props.recipe.layoutTemplate] ?? LAYOUT_COMPONENTS[DEFAULT_LAYOUT_TEMPLATE],
)
const resolvedQtyAlign = computed(() => props.qtyAlign ?? settingsStore.ingredientQtyAlign)
</script>

<template>
  <article
    class="recipe-sheet"
    :data-qty-align="resolvedQtyAlign"
    :style="{ '--recipe-accent': accentColor, '--recipe-qty-align': resolvedQtyAlign }"
  >
    <component :is="activeLayout" :recipe="recipe" />
  </article>
</template>

<style scoped>
.recipe-sheet {
  --recipe-accent: #d97742;
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
