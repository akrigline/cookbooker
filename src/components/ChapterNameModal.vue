<script setup>
import Modal from './Modal.vue'

defineProps({
  heading: { type: String, required: true },
  subheading: { type: String, default: '' },
  busy: { type: Boolean, default: false },
})

const value = defineModel('value', { type: String, default: '' })

const emit = defineEmits(['close', 'submit'])
</script>

<template>
  <Modal title-id="modal-chapter-name-title" @close="emit('close')">
    <h2 id="modal-chapter-name-title" class="modal-title">{{ heading }}</h2>
    <p v-if="subheading" class="modal-body">{{ subheading }}</p>
    <form class="modal-form" @submit.prevent="emit('submit')">
      <label class="form-field">
        <span class="form-label">Chapter name</span>
        <input
          v-model="value"
          type="text"
          class="form-input"
          placeholder="e.g. Breakfast & Brunch"
          required
          autofocus
        />
      </label>
      <div class="modal-actions">
        <button type="button" class="modal-btn modal-btn--ghost" :disabled="busy" @click="emit('close')">
          Cancel
        </button>
        <button
          type="submit"
          class="modal-btn modal-btn--primary"
          :disabled="busy || !value.trim()"
        >
          {{ busy ? 'Saving…' : heading }}
        </button>
      </div>
    </form>
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

.modal-btn--primary {
  background: var(--ink-20);
  color: var(--ink-99);
}

.modal-btn--primary:hover:not(:disabled) { background: var(--ink-30); }

.modal-btn--ghost {
  background: var(--ink-93);
  color: var(--ink-20);
  border: 1px solid var(--ink-84);
}

.modal-btn--ghost:hover:not(:disabled) { background: var(--ink-88); }

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.form-label {
  font-size: 12px;
  font-weight: 700;
  color: var(--ink-52);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.form-input {
  font: inherit;
  font-size: 14px;
  padding: 9px 12px;
  border: 1px solid var(--ink-84);
  border-radius: 8px;
  background: var(--ink-99);
  color: var(--ink-20);
}

.form-input:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 1px;
  border-color: var(--color-focus);
}
</style>
