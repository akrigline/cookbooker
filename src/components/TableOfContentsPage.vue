<script setup>
defineProps({
  chapters: {
    // [{ chapter, recipes: [recipe, ...] }]
    type: Array,
    required: true,
  },
  // { dividerPages: Map<chapterId, number>, recipePages: Map<"chapterId:recipeId", number> }
  // from compileBook.js's assignPageNumbers, or null when the project has
  // page numbers toggled off.
  pageNumbers: {
    type: Object,
    default: null,
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
        <span class="toc-chapter-name">
          <span class="toc-title">{{ entry.chapter.name }}</span>
          <span v-if="pageNumbers" class="toc-leader" aria-hidden="true"></span>
          <span v-if="pageNumbers" class="toc-page-number">{{
            pageNumbers.dividerPages.get(entry.chapter.id)
          }}</span>
        </span>
        <ul class="toc-recipes">
          <li v-for="recipe in entry.recipes" :key="recipe.id">
            <span class="toc-title">{{ recipe.title }}</span>
            <span v-if="pageNumbers" class="toc-leader" aria-hidden="true"></span>
            <span v-if="pageNumbers" class="toc-page-number">{{
              pageNumbers.recipePages.get(`${entry.chapter.id}:${recipe.id}`)
            }}</span>
          </li>
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
  margin-top: 0;
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
  display: flex;
  align-items: flex-end;
  gap: var(--space-xs);
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
  display: flex;
  align-items: flex-end;
  gap: var(--space-xs);
  padding: 2px 0;
}

.toc-title {
  flex: 0 0 auto;
}

.toc-leader {
  flex: 1 1 auto;
  border-bottom: 1px dotted currentColor;
  margin-bottom: 3px;
  opacity: 0.5;
}

.toc-page-number {
  flex: 0 0 auto;
  text-align: right;
}
</style>
