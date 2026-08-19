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
})

const displayTitle = computed(() =>
  props.favorite && props.favoriteSettings.prefix
    ? `${props.favoriteSettings.prefix}: ${props.title}`
    : props.title,
)
</script>

<template>
  <header class="recipe-title-container">
    <h2 class="text-recipe-title">
      <FavoriteBadge v-if="favorite" :icon="favoriteSettings.icon" />
      {{ displayTitle }}
    </h2>
  </header>
</template>

<style scoped>
.text-recipe-title {
  margin: 0;
  color: var(--recipe-primary); /* Overrides global text-recipe-title if needed, or just sets margin */
  display: flex;
  align-items: baseline;
  gap: 0.3em;
}
</style>
