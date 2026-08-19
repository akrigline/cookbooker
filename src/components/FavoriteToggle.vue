<script setup>
import FavoriteBadge from './FavoriteBadge.vue'
import { OUTSIDE_CONTEXT_ICON } from '../js/favorites'

const props = defineProps({
  icon: {
    type: String,
    default: OUTSIDE_CONTEXT_ICON,
  },
  favorite: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['toggle'])

function onClick() {
  emit('toggle')
}
</script>

<template>
  <button
    type="button"
    class="favorite-toggle"
    :class="{ 'favorite-toggle--active': props.favorite }"
    :aria-pressed="props.favorite"
    :title="props.favorite ? 'Remove from favorites' : 'Mark as favorite'"
    @click="onClick"
  >
    <FavoriteBadge :icon="props.icon" :label="props.favorite ? 'Favorited' : 'Not favorited'" />
  </button>
</template>

<style scoped>
.favorite-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: none;
  padding: 2px;
  cursor: pointer;
  font-size: 1.1rem;
  color: var(--ink-46, #999);
  opacity: 0.45;
}

.favorite-toggle:hover {
  opacity: 0.75;
}

.favorite-toggle--active {
  opacity: 1;
}
</style>
