<script setup>
import Modal from './Modal.vue'

defineProps({
  titleId: { type: String, required: true },
  heading: { type: String, required: true },
  confirmLabel: { type: String, required: true },
  busyLabel: { type: String, required: true },
  busy: { type: Boolean, default: false },
})

const emit = defineEmits(['close', 'confirm'])
</script>

<template>
  <Modal role="alertdialog" :title-id="titleId" @close="emit('close')">
    <h2 :id="titleId" class="modal-title">{{ heading }}</h2>
    <p class="modal-body"><slot /></p>
    <div class="modal-actions">
      <button type="button" class="modal-btn modal-btn--ghost" :disabled="busy" @click="emit('close')">
        Cancel
      </button>
      <button type="button" class="modal-btn modal-btn--danger" :disabled="busy" @click="emit('confirm')">
        {{ busy ? busyLabel : confirmLabel }}
      </button>
    </div>
  </Modal>
</template>

<style scoped>
.modal-title {
  font-family: 'Newsreader', Georgia, serif;
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 12px;
  color: oklch(18% 0.01 75);
}

.modal-body {
  font-size: 14px;
  color: oklch(35% 0.01 75);
  line-height: 1.6;
  margin: 0 0 20px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 20px;
}

.modal-btn {
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: background 0.12s;
}

.modal-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.modal-btn--ghost {
  background: oklch(93% 0.006 75);
  color: oklch(25% 0.01 75);
  border: 1px solid oklch(86% 0.008 75);
}

.modal-btn--ghost:hover:not(:disabled) { background: oklch(88% 0.008 75); }

.modal-btn--danger {
  background: oklch(45% 0.18 25);
  color: oklch(98% 0.004 75);
}

.modal-btn--danger:hover:not(:disabled) { background: oklch(38% 0.18 25); }
</style>
