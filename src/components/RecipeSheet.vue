<script setup>
import { computed, toRef } from 'vue'
import { formatIngredientLine } from '../js/conversions'
import { renderChefNotes } from '../js/richtext'
import { useObjectUrl } from '../js/useObjectUrl'

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

const imageUrl = useObjectUrl(toRef(() => props.recipe.image))

const template = computed(() => props.recipe.layoutTemplate || 'standard')
const hasImageSlot = computed(() => template.value !== 'text-only')

const instructionSteps = computed(() =>
  (props.recipe.instructions ?? '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean),
)

const notesHtml = computed(() => renderChefNotes(props.recipe.notes))
</script>

<template>
  <article
    class="recipe-sheet"
    :class="`recipe-sheet--${template}`"
    :style="{ '--recipe-accent': accentColor }"
  >
    <header class="recipe-sheet__header">
      <h1>{{ recipe.title }}</h1>
    </header>

    <div v-if="hasImageSlot" class="recipe-sheet__image" :class="{ 'is-empty': !imageUrl }">
      <img v-if="imageUrl" :src="imageUrl" alt="" />
    </div>

    <section class="recipe-sheet__ingredients">
      <h2>Ingredients</h2>
      <ul>
        <li v-for="(ing, idx) in recipe.ingredients" :key="idx">
          {{ formatIngredientLine(ing) }}
        </li>
      </ul>
    </section>

    <section class="recipe-sheet__instructions">
      <h2>Instructions</h2>
      <ol>
        <li v-for="(step, idx) in instructionSteps" :key="idx">{{ step }}</li>
      </ol>
    </section>

    <footer v-if="recipe.notes" class="recipe-sheet__notes" v-html="notesHtml" />
  </article>
</template>

<style scoped>
.recipe-sheet {
  --recipe-accent: #d97742;
  display: grid;
  grid-template-areas:
    'header header'
    'image image'
    'ingredients instructions'
    'notes notes';
  grid-template-rows: auto auto 1fr auto;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-md);
  height: 100%;
  padding: var(--space-lg);
  box-sizing: border-box;
  background: var(--bg-primary, #fff);
  color: var(--text-primary, #232323);
  font-family: var(--font-main, serif);
  position: relative;
}

.recipe-sheet--text-only {
  grid-template-areas:
    'header header'
    'ingredients instructions'
    'notes notes';
  grid-template-rows: auto 1fr auto;
}

.recipe-sheet--image-heavy {
  grid-template-areas:
    'header header'
    'image ingredients'
    'image instructions'
    'notes notes';
  grid-template-rows: auto 1fr 1fr auto;
  grid-template-columns: 38% 1fr;
}

.recipe-sheet__header {
  grid-area: header;
  border-bottom: 3px solid var(--recipe-accent);
  padding-bottom: var(--space-sm);
}

.recipe-sheet__header h1 {
  margin: 0;
  font-size: 1.75rem;
  color: var(--recipe-accent);
}

.recipe-sheet__image {
  grid-area: image;
  width: 100%;
  height: 100%;
  min-height: 8rem;
  border-radius: 4px;
  background: var(--bg-secondary, #f7f4ef);
  overflow: hidden;
}

.recipe-sheet__image.is-empty {
  border: 1px dashed var(--border-color, #e0ddd6);
}

.recipe-sheet__image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  display: block;
}

.recipe-sheet--image-heavy .recipe-sheet__image {
  grid-row: span 2;
}

.recipe-sheet__ingredients {
  grid-area: ingredients;
}

.recipe-sheet__instructions {
  grid-area: instructions;
}

.recipe-sheet__ingredients h2,
.recipe-sheet__instructions h2 {
  font-size: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--recipe-accent);
  margin: 0 0 var(--space-sm);
}

.recipe-sheet__ingredients ul,
.recipe-sheet__instructions ol {
  margin: 0;
  padding-left: 1.25rem;
}

.recipe-sheet__ingredients li,
.recipe-sheet__instructions li {
  margin-bottom: var(--space-xs);
  font-size: 0.95rem;
  line-height: 1.4;
}

.recipe-sheet__notes {
  grid-area: notes;
  font-size: 0.9rem;
  font-style: italic;
  border-top: 1px solid var(--border-color, #e0ddd6);
  padding-top: var(--space-sm);
}
</style>
