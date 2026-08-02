<script setup>
import { formatIngredientLine } from '../js/conversions'

defineProps({
  ingredients: {
    type: Array,
    default: () => [],
  },
  columns: {
    type: Number,
    default: 1,
  },
})
</script>

<template>
  <section class="recipe-ingredients">
    <h2>Ingredients</h2>
    <ul :style="{ columnCount: columns }">
      <li v-for="(ing, idx) in ingredients" :key="idx">
        {{ formatIngredientLine(ing) }}
      </li>
    </ul>
  </section>
</template>

<style scoped>
.recipe-ingredients h2 {
  font-size: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--recipe-accent);
  margin: 0 0 var(--space-sm);
}

.recipe-ingredients ul {
  margin: 0;
  padding-left: 1.25rem;
  column-gap: var(--space-md);
}

.recipe-ingredients li {
  margin-bottom: var(--space-xs);
  font-size: 0.95rem;
  line-height: 1.4;
  break-inside: avoid;
}
</style>
