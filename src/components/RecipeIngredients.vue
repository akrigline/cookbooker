<script setup>
import { convertIngredient, formatQuantity } from '../js/conversions'
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
  qtyAlign: {
    type: String,
    default: 'right',
  },
})

function getIngredientParts(parsed) {
  const converted = convertIngredient(parsed)
  const name = parsed.ingredient ?? ''
  let quantityText = ''
  if (!converted) {
    const qty = parsed.quantity ? formatQuantity(Number(parsed.quantity)) : ''
    const unit = parsed.unit ?? ''
    quantityText = [qty, unit].filter(Boolean).join(' ')
  } else {
    quantityText = `${converted.us} (${converted.metric})`
  }
  return { quantity: quantityText, name }
}
</script>

<template>
  <div class="recipe-ingredients">
    <h3 class="text-section-header ingredients-title">
      <span class="material-symbols-outlined title-icon">shopping_basket</span>
      Ingredients
    </h3>
    
    <ul class="ingredients-list text-ingredient-list" :style="{ columnCount: columns }">
      <li
        v-for="(ing, idx) in ingredients"
        :key="idx"
        class="ingredient-item"
      >
        <div class="ingredient-qty" :style="{ textAlign: qtyAlign }">{{ getIngredientParts(ing).quantity }}</div>
        <div class="ingredient-name">{{ getIngredientParts(ing).name }}</div>
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
  padding: 0.375rem 0;
  break-inside: avoid;
}

.ingredient-qty {
  flex: 0 0 25%;
  font-weight: 700;
  padding-right: 0.5rem;
}

.ingredient-name {
  flex: 1;
}

.qr-item {
  display: flex;
  justify-content: center;
  margin-top: 1rem;
}
</style>
