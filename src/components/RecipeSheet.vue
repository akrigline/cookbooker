<script setup>
import { computed } from 'vue'
import { DEFAULT_LAYOUT_TEMPLATE } from '../js/templates'
import RecipeLayoutHeroSplitBalanced from './RecipeLayoutHeroSplitBalanced.vue'
import RecipeLayoutHeroSplitAsymmetric from './RecipeLayoutHeroSplitAsymmetric.vue'
import RecipeLayoutAsymmetricSidebar from './RecipeLayoutAsymmetricSidebar.vue'
import RecipeLayoutColumnOptimized from './RecipeLayoutColumnOptimized.vue'
import RecipeLayoutBalancedHeader from './RecipeLayoutBalancedHeader.vue'
import RecipeLayoutDualColumnBottomSplit from './RecipeLayoutDualColumnBottomSplit.vue'
import RecipeLayoutTextOnly from './RecipeLayoutTextOnly.vue'

const LAYOUT_COMPONENTS = {
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
})

const activeLayout = computed(
  () => LAYOUT_COMPONENTS[props.recipe.layoutTemplate] ?? LAYOUT_COMPONENTS[DEFAULT_LAYOUT_TEMPLATE],
)
</script>

<template>
  <article class="recipe-sheet" :style="{ '--recipe-accent': accentColor }">
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
</style>
