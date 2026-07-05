<script setup>
import { computed, onMounted } from 'vue'
import { useProjectsStore } from '../stores/projects'

const props = defineProps({
  projectId: {
    type: String,
    required: true,
  },
})

const projectsStore = useProjectsStore()

onMounted(() => {
  if (!projectsStore.loaded) projectsStore.load()
})

const project = computed(() =>
  projectsStore.projects.find((p) => p.id === Number(props.projectId)),
)

const chapters = computed(() =>
  projectsStore.chapters
    .filter((c) => c.projectId === Number(props.projectId))
    .sort((a, b) => a.order - b.order),
)
</script>

<template>
  <div class="view">
    <h1>{{ project ? project.name : `Project ${projectId}` }}</h1>
    <ul>
      <li v-for="chapter in chapters" :key="chapter.id">{{ chapter.name }}</li>
    </ul>
  </div>
</template>
