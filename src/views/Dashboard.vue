<script setup>
import { onMounted } from 'vue'
import { useProjectsStore } from '../stores/projects'

const projectsStore = useProjectsStore()

onMounted(() => {
  if (!projectsStore.loaded) projectsStore.load()
})
</script>

<template>
  <div class="view">
    <h1>Dashboard</h1>
    <ul>
      <li v-for="project in projectsStore.projects" :key="project.id">
        <router-link :to="`/projects/${project.id}`">{{ project.name }}</router-link>
      </li>
    </ul>
  </div>
</template>
