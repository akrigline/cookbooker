<script setup>
defineProps({
  project: {
    type: Object,
    required: true,
  },
})
</script>

<template>
  <div
    class="cover-page"
    :class="`cover-page--${project.coverTemplate || 'classic'}`"
    :style="{ '--cover-accent': project.accentColor || '#d97742' }"
  >
    <div class="cover-page__frame">
      <h1 class="cover-page__title">{{ project.title }}</h1>
      <p v-if="project.subtitle" class="cover-page__subtitle">{{ project.subtitle }}</p>
      <p v-if="project.author" class="cover-page__author">{{ project.author }}</p>
    </div>
  </div>
</template>

<style scoped>
.cover-page {
  --cover-accent: #d97742;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.cover-page__frame {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.cover-page__title {
  font-size: 3rem;
  margin: 0;
  color: var(--cover-accent);
}

.cover-page__subtitle {
  font-size: 1.5rem;
  margin: 0;
  color: var(--text-secondary, #5f5b53);
  font-style: italic;
}

.cover-page__author {
  font-size: 1.1rem;
  margin-top: var(--space-lg);
}

.cover-page--classic .cover-page__frame {
  border: 3px solid var(--cover-accent);
  padding: 2.5rem 3rem;
}

.cover-page--modern .cover-page__frame {
  border-top: 8px solid var(--cover-accent);
  border-bottom: 8px solid var(--cover-accent);
  padding: 2rem 0;
}

.cover-page--modern .cover-page__title {
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.cover-page--minimal .cover-page__title {
  font-weight: 300;
}
</style>
