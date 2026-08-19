<script setup>
import { computed } from 'vue'
import FavoriteBadge from './FavoriteBadge.vue'

const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  favorite: {
    type: Boolean,
    default: false,
  },
  // { icon, prefix } from getFavoriteSettings(project) - see src/js/favorites.js
  favoriteSettings: {
    type: Object,
    default: () => ({ icon: 'heart', prefix: '' }),
  },
  // The cookbook's accent color (project.accentColor). Colors the favorite
  // badge instead of its default; null lets FavoriteBadge fall back to its
  // own default (e.g. outside any cookbook context).
  accentColor: {
    type: String,
    default: null,
  },
})

const displayTitle = computed(() =>
  props.favorite && props.favoriteSettings.prefix
    ? `${props.favoriteSettings.prefix} ${props.title}`
    : props.title,
)
</script>

<template>
  <header class="recipe-title-container">
    <h2 class="text-recipe-title">
      <FavoriteBadge v-if="favorite" :icon="favoriteSettings.icon" :color="accentColor" />
      <span class="recipe-title-text">{{ displayTitle }}</span>
    </h2>
  </header>
</template>

<style scoped>
.text-recipe-title {
  margin: 0;
  color: var(--recipe-primary); /* Overrides global text-recipe-title if needed, or just sets margin */
  display: flex;
  align-items: center;
}

.text-recipe-title :deep(.favorite-badge) {
  order: 1;
  margin-left: auto;
}
</style>
