<script setup>
defineProps({
  open: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['toggle', 'navigate'])
</script>

<template>
  <button class="hamburger" type="button" aria-label="Toggle navigation" @click="$emit('toggle')">
    ☰
  </button>
  <div v-if="open" class="scrim" @click="$emit('toggle')" />
  <aside class="sidebar" :class="{ 'sidebar--open': open }">
    <p class="brand">Cookbooker</p>
    <nav>
      <router-link to="/" @click="$emit('navigate')">Dashboard</router-link>
      <router-link to="/library" @click="$emit('navigate')">Recipe Library</router-link>
      <router-link to="/settings" @click="$emit('navigate')">Settings</router-link>
    </nav>
  </aside>
</template>

<style scoped>
.sidebar {
  width: var(--sidebar-width);
  flex-shrink: 0;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border-color);
  padding: var(--space-lg) var(--space-md);
}

.brand {
  font-size: var(--font-size-lg);
  margin: 0 0 var(--space-lg);
}

nav {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

nav a {
  color: var(--text-primary);
  text-decoration: none;
  padding: var(--space-sm);
  border-radius: 4px;
  transition: background var(--transition-base);
}

nav a:hover {
  background: var(--border-color);
}

nav a.router-link-active {
  color: var(--sidebar-accent);
  font-weight: 600;
}

.hamburger {
  display: none;
}

.scrim {
  display: none;
}

@media (max-width: 768px) {
  .hamburger {
    display: block;
    position: fixed;
    top: var(--space-sm);
    left: var(--space-sm);
    z-index: 20;
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 4px;
    font-size: var(--font-size-lg);
    line-height: 1;
    padding: var(--space-xs) var(--space-sm);
  }

  .scrim {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    z-index: 9;
  }

  .sidebar {
    position: fixed;
    inset: 0 auto 0 0;
    z-index: 10;
    transform: translateX(-100%);
    transition: transform var(--transition-base);
  }

  .sidebar--open {
    transform: translateX(0);
  }
}
</style>
