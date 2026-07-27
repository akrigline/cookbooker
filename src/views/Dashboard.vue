<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useProjectsStore } from '../stores/projects'

const projectsStore = useProjectsStore()
const router = useRouter()
const newProjectTitle = ref('')

onMounted(() => {
  if (!projectsStore.loaded) projectsStore.load()
})

async function createProject() {
  const title = newProjectTitle.value.trim()
  if (!title) return
  const id = await projectsStore.createProject({ title })
  newProjectTitle.value = ''
  router.push(`/projects/${id}`)
}

async function deleteProject(project) {
  if (!confirm(`Delete "${project.title}"? Recipes stay in the Global Recipe Library.`)) return
  await projectsStore.removeProject(project.id)
}
</script>

<template>
  <div class="view">
    <h1>Your Cookbooks</h1>

    <form class="new-project" @submit.prevent="createProject">
      <input v-model="newProjectTitle" type="text" placeholder="New cookbook title..." />
      <button type="submit" class="primary">+ Create Cookbook</button>
    </form>

    <p v-if="!projectsStore.projects.length" class="empty">
      No cookbooks yet. Create one to start curating recipes.
    </p>

    <ul class="project-grid">
      <li v-for="project in projectsStore.projects" :key="project.id" class="project-card">
        <router-link :to="`/projects/${project.id}`" class="project-card__link">
          <span class="project-card__swatch" :style="{ background: project.accentColor }" />
          <span class="project-card__title">{{ project.title || 'Untitled Cookbook' }}</span>
          <span v-if="project.subtitle" class="project-card__subtitle">{{ project.subtitle }}</span>
        </router-link>
        <div class="project-card__actions">
          <router-link :to="`/projects/${project.id}/print`">Print Preview</router-link>
          <button type="button" class="danger" @click="deleteProject(project)">Delete</button>
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.new-project {
  display: flex;
  gap: var(--space-sm);
  margin-bottom: var(--space-lg);
}

.new-project input {
  flex: 1;
  max-width: 24rem;
  padding: var(--space-sm);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font: inherit;
}

.primary {
  background: var(--accent-color);
  color: white;
  border: none;
  padding: var(--space-sm) var(--space-md);
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
}

.empty {
  color: var(--text-secondary);
}

.project-grid {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: var(--space-md);
}

.project-card {
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: var(--space-md);
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.project-card__link {
  text-decoration: none;
  color: var(--text-primary);
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.project-card__swatch {
  width: 2rem;
  height: 0.4rem;
  border-radius: 2px;
}

.project-card__title {
  font-weight: 700;
  font-size: 1.1rem;
}

.project-card__subtitle {
  color: var(--text-secondary);
  font-style: italic;
}

.project-card__actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.project-card__actions a {
  color: var(--accent-color);
  font-size: var(--font-size-sm);
}

button.danger {
  background: none;
  border: 1px solid #c0392b;
  color: #c0392b;
  border-radius: 6px;
  padding: 2px var(--space-sm);
  cursor: pointer;
  font-size: var(--font-size-sm);
}
</style>
