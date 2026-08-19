<script setup>
import { computed } from 'vue'
import { convertIngredient, formatQuantityRange } from '../js/conversions'
import RecipeQRCode from './RecipeQRCode.vue'

const props = defineProps({
  recipe: {
    type: Object,
    default: null,
  },
  ingredients: {
    type: Array,
    default: () => [],
  },
  columns: {
    type: Number,
    default: 1,
  },
})

function getIngredientParts(parsed) {
  const converted = convertIngredient(parsed)
  const name = parsed.ingredient ?? ''
  if (!converted) {
    const qty = formatQuantityRange(parsed.minQty ?? parsed.quantity, parsed.maxQty ?? parsed.quantity)
    const unit = parsed.unit ?? ''
    const primary = [qty, unit].filter(Boolean).join(' ')
    return { primary, secondary: '', name }
  }
  const secondary = converted.metric ? `(${converted.metric})` : ''
  return { primary: converted.us, secondary, name }
}

const parsedIngredients = computed(() => props.ingredients.map(getIngredientParts))
</script>

<template>
  <div class="recipe-ingredients">
    <h3 class="text-section-header ingredients-title">
      <span class="material-symbols-outlined title-icon">shopping_basket</span>
      Ingredients
    </h3>
    
    <ul class="ingredients-list text-ingredient-list" :style="{ columnCount: columns }">
      <li
        v-for="(parts, idx) in parsedIngredients"
        :key="idx"
        class="ingredient-item"
      >
        <div class="ingredient-qty">
          <div class="qty-primary">{{ parts.primary }}</div>
          <div v-if="parts.secondary" class="qty-secondary">{{ parts.secondary }}</div>
        </div>
        <div class="ingredient-name">{{ parts.name }}</div>
      </li>
      <li v-if="recipe" class="ingredient-item qr-item">
        <RecipeQRCode :recipe="recipe" />
      </li>
    </ul>
  </div>
</template>

<style scoped>
.ingredients-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 0.75rem 0;
}

.title-icon {
  font-size: 16px;
}

.ingredients-list {
  list-style: none;
  margin: 0;
  padding: 0;
  column-gap: var(--recipe-column-gap);
}

.ingredient-item {
  display: flex;
  align-items: flex-start;
  padding: 0.25rem 0;
  break-inside: avoid;
}

.ingredient-qty {
  flex: 0 0 33%;
  padding-right: 0.5rem;
  white-space: nowrap;
  text-align: var(--recipe-qty-align, right);
}

.qty-primary {
  font-weight: 700;
}

.qty-secondary {
  font-size: 14px;
  font-weight: 600;
  color: var(--recipe-on-surface-variant);
}

.ingredient-name {
  flex: 1;
}

.qr-item {
  display: flex;
  justify-content: center;
}
</style>
