<script setup>
import { ref } from 'vue'
import Sidebar from './components/Sidebar.vue'

const drawerOpen = ref(false)
</script>

<template>
  <div class="shell">
    <Sidebar :open="drawerOpen" @toggle="drawerOpen = !drawerOpen" @navigate="drawerOpen = false" />
    <main class="content">
      <router-view />
    </main>
  </div>
</template>

<style scoped>
.shell {
  display: flex;
  min-height: 100%;
}

.content {
  flex: 1;
  min-width: 0;
  padding: var(--space-lg);
}

@media (max-width: 768px) {
  .content {
    padding: var(--space-md);
  }
}
</style>
