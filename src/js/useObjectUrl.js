import { ref, watch, onBeforeUnmount } from 'vue'

/**
 * Turns a reactive Blob/File source into an auto-revoked object URL,
 * so <img> tags can render directly from IndexedDB-stored Blobs.
 */
export function useObjectUrl(source) {
  const url = ref(null)

  watch(
    source,
    (blob) => {
      if (url.value) URL.revokeObjectURL(url.value)
      url.value = blob ? URL.createObjectURL(blob) : null
    },
    { immediate: true },
  )

  onBeforeUnmount(() => {
    if (url.value) URL.revokeObjectURL(url.value)
  })

  return url
}
