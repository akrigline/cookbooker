<script setup>
import { ref } from 'vue'
import { convertIngredient, formatQuantity } from '../js/conversions'

const props = defineProps({
  ingredients: {
    type: Array,
    default: () => [],
  },
  columns: {
    type: Number,
    default: 1,
  },
})

const checkedState = ref({})

function toggleCheck(idx) {
  checkedState.value[idx] = !checkedState.value[idx]
}

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
    
    <div class="ingredients-header">
      <div class="header-qty text-meta-label">Quantity</div>
      <div class="header-name text-meta-label">Ingredient</div>
    </div>
    
    <ul class="ingredients-list text-ingredient-list" :style="{ columnCount: columns }">
      <li 
        v-for="(ing, idx) in ingredients" 
        :key="idx" 
        class="ingredient-item"
        :class="{ 'is-checked': checkedState[idx] }"
        @click="toggleCheck(idx)"
      >
        <div class="ingredient-qty">{{ getIngredientParts(ing).quantity }}</div>
        <div class="ingredient-name">
          <div class="checkbox"></div>
          {{ getIngredientParts(ing).name }}
        </div>
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

.ingredients-header {
  display: flex;
  border-bottom: 1px solid var(--recipe-primary);
  padding-bottom: 0.25rem;
  margin-bottom: 0.25rem;
}

.header-qty {
  flex: 0 0 25%;
  padding-right: 0.5rem;
}

.header-name {
  flex: 1;
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
  border-bottom: 1px solid var(--recipe-outline-variant);
  cursor: pointer;
  break-inside: avoid;
  transition: opacity 0.2s ease;
}

.ingredient-item.is-checked {
  opacity: 0.4;
}

.ingredient-qty {
  flex: 0 0 25%;
  font-weight: 700;
  padding-right: 0.5rem;
}

.ingredient-name {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.checkbox {
  width: 10px;
  height: 10px;
  border: 1px solid var(--recipe-primary);
  flex-shrink: 0;
  transition: background-color 0.2s ease;
}

.ingredient-item.is-checked .checkbox {
  background-color: var(--recipe-primary);
}
</style>
