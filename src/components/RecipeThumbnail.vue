<script setup>
import { toRef } from 'vue'
import { useObjectUrl } from '../js/useObjectUrl'

const props = defineProps({
  image: {
    type: Blob,
    default: null,
  },
  title: {
    type: String,
    default: '',
  },
})

const url = useObjectUrl(toRef(props, 'image'))
</script>

<template>
  <div class="recipe-thumb" :class="{ 'is-empty': !url }">
    <img v-if="url" :src="url" :alt="title ? `Photo of ${title}` : 'Recipe photo'" />
  </div>
</template>

<style scoped>
.recipe-thumb {
  width: 100%;
  height: 100%;
  background: var(--bg-secondary);
}

.recipe-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
</style>
