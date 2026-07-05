<script setup>
defineProps({
  projectId: {
    type: String,
    required: true,
  },
})
</script>

<template>
  <div class="view">
    <h1>Print Preview: Project {{ projectId }}</h1>
  </div>
</template>
