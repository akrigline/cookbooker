<script setup>
defineProps({
  chapters: {
    // [{ chapter, recipes: [recipe, ...] }]
    type: Array,
    required: true,
  },
  accentColor: {
    type: String,
    default: '#d97742',
  },
})
</script>

<template>
  <div class="toc-page" :style="{ '--toc-accent': accentColor }">
    <h2>Table of Contents</h2>
    <ol class="toc-chapters">
      <li v-for="entry in chapters" :key="entry.chapter.id">
        <span class="toc-chapter-name">{{ entry.chapter.name }}</span>
        <ul class="toc-recipes">
          <li v-for="recipe in entry.recipes" :key="recipe.id">{{ recipe.title }}</li>
        </ul>
      </li>
    </ol>
  </div>
</template>

<style scoped>
.toc-page {
  --toc-accent: #d97742;
  width: 100%;
  height: 100%;
}

.toc-page h2 {
  color: var(--toc-accent);
  border-bottom: 3px solid var(--toc-accent);
  padding-bottom: var(--space-sm);
}

.toc-chapters {
  list-style: none;
  margin: var(--space-lg) 0 0;
  padding: 0;
}

.toc-chapters > li {
  margin-bottom: var(--space-md);
}

.toc-chapter-name {
  font-weight: 700;
  font-size: 1.1rem;
  color: var(--toc-accent);
}

.toc-recipes {
  list-style: none;
  margin: var(--space-xs) 0 0;
  padding-left: var(--space-md);
}

.toc-recipes li {
  padding: 2px 0;
}
</style>
