<script setup>
import { toRef } from 'vue'
import { useObjectUrl } from '../js/useObjectUrl'

const props = defineProps({
  image: {
    type: [Blob, String],
    default: null,
  },
  aspectRatio: {
    type: String,
    default: 'auto',
  },
})

const ASPECT_RATIO_CSS = {
  '1:1': '1 / 1',
  '4:3': '4 / 3',
  '3:4': '3 / 4',
  '16:9': '16 / 9',
}

const imageUrl = useObjectUrl(toRef(() => props.image))
</script>

<template>
  <div
    class="recipe-image"
    :class="{ 'is-empty': !imageUrl }"
    :style="ASPECT_RATIO_CSS[aspectRatio] ? { aspectRatio: ASPECT_RATIO_CSS[aspectRatio], height: 'auto' } : null"
  >
    <img v-if="imageUrl" :src="imageUrl" alt="" />
  </div>
</template>

<style scoped>
.recipe-image {
  width: 100%;
  height: 100%;
  border-radius: 4px;
  background: var(--bg-secondary, #f7f4ef);
  overflow: hidden;
}

.recipe-image.is-empty {
  border: 1px dashed var(--border-color, #e0ddd6);
}

.recipe-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  display: block;
}
</style>
