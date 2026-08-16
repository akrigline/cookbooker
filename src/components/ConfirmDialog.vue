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
  color: var(--ink-20);
}

.modal-body {
  font-size: 14px;
  color: var(--ink-30);
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
  background: var(--ink-93);
  color: var(--ink-20);
  border: 1px solid var(--ink-84);
}

.modal-btn--ghost:hover:not(:disabled) { background: var(--ink-88); }

.modal-btn--danger {
  background: var(--color-danger);
  color: var(--ink-99);
}

.modal-btn--danger:hover:not(:disabled) { background: var(--color-danger-hover); }
</style>
