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

.modal-btn--primary {
  background: oklch(20% 0.015 75);
  color: oklch(98% 0.004 75);
}

.modal-btn--primary:hover:not(:disabled) { background: oklch(28% 0.02 75); }

.modal-btn--ghost {
  background: oklch(93% 0.006 75);
  color: oklch(25% 0.01 75);
  border: 1px solid oklch(86% 0.008 75);
}

.modal-btn--ghost:hover:not(:disabled) { background: oklch(88% 0.008 75); }

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
  color: oklch(48% 0.01 75);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.form-input {
  font: inherit;
  font-size: 14px;
  padding: 9px 12px;
  border: 1px solid oklch(85% 0.008 75);
  border-radius: 8px;
  background: oklch(99.3% 0.002 75);
  color: oklch(18% 0.01 75);
}

.form-input:focus-visible {
  outline: 2px solid oklch(52% 0.16 250);
  outline-offset: 1px;
  border-color: oklch(52% 0.16 250);
}
</style>
