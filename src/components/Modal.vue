<script setup>
import { onMounted, onUnmounted, ref } from 'vue'

const props = defineProps({
  /** 'dialog' for confirmations/forms, 'alertdialog' for destructive confirms */
  role: { type: String, default: 'dialog' },
  titleId: { type: String, default: 'modal-title' },
  boxClass: { type: String, default: '' },
})
const emit = defineEmits(['close'])

const wrapEl = ref(null)
let previousFocus = null

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ')

function getFocusable() {
  return Array.from(wrapEl.value?.querySelectorAll(FOCUSABLE) ?? [])
}

function handleKey(e) {
  if (e.key === 'Escape') {
    emit('close')
    return
  }
  if (e.key === 'Tab') {
    const els = getFocusable()
    if (!els.length) return
    const first = els[0]
    const last = els[els.length - 1]
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault()
        last.focus()
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
  }
}

onMounted(() => {
  previousFocus = document.activeElement
  document.addEventListener('keydown', handleKey)
  // Focus first focusable element in modal
  const els = getFocusable()
  if (els.length) els[0].focus()
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKey)
  previousFocus?.focus()
})
</script>

<template>
  <div class="modal-backdrop" @click.self="emit('close')" aria-hidden="false">
    <div
      ref="wrapEl"
      class="modal-box"
      :class="boxClass"
      :role="role"
      aria-modal="true"
      :aria-labelledby="titleId"
    >
      <slot />
    </div>
  </div>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: oklch(10% 0.01 75 / 55%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9000;
  padding: 24px;
}

.modal-box {
  background: var(--ink-99);
  border: 1px solid var(--ink-88);
  border-radius: 16px;
  padding: 28px 32px;
  width: 100%;
  max-width: 440px;
  box-shadow:
    0 20px 60px oklch(10% 0.01 75 / 22%),
    0 4px 16px oklch(10% 0.01 75 / 10%);
}
</style>
