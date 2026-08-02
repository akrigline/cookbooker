<script setup>
import Modal from './Modal.vue'
import { ACCENT_COLORS, COVER_TEMPLATES } from '../js/templates'

defineProps({
  coverTemplate: { type: String, default: null },
  pageNumbersEnabled: { type: Boolean, default: false },
  busy: { type: Boolean, default: false },
})

const title = defineModel('title', { type: String, default: '' })
const subtitle = defineModel('subtitle', { type: String, default: '' })
const accent = defineModel('accent', { type: String, default: '' })

const emit = defineEmits(['update-field', 'close', 'save'])
</script>

<template>
  <Modal title-id="modal-edit-cookbook-title" @close="emit('close')">
    <h2 id="modal-edit-cookbook-title" class="modal-title">Edit Cookbook Details</h2>
    <div class="modal-form">
      <label class="form-field">
        <span class="form-label">Title</span>
        <input v-model="title" type="text" class="form-input" placeholder="Cookbook title" />
      </label>
      <label class="form-field">
        <span class="form-label">Subtitle</span>
        <input v-model="subtitle" type="text" class="form-input" placeholder="Optional subtitle" />
      </label>
      <div class="form-field">
        <span class="form-label">Accent Color</span>
        <div class="swatches">
          <button
            v-for="color in ACCENT_COLORS"
            :key="color.id"
            type="button"
            class="swatch"
            :class="{ 'swatch--active': accent === color.value }"
            :style="{ background: color.value }"
            :title="color.label"
            :aria-pressed="accent === color.value"
            @click="accent = color.value"
          />
        </div>
      </div>
      <!-- Cover layout stays in-line edit for now; design only specified title/subtitle/accent in modal -->
      <label class="form-field">
        <span class="form-label">Cover Layout</span>
        <select
          :value="coverTemplate"
          class="form-input"
          @change="emit('update-field', 'coverTemplate', $event.target.value)"
        >
          <option v-for="tpl in COVER_TEMPLATES" :key="tpl.id" :value="tpl.id">{{ tpl.label }}</option>
        </select>
      </label>
      <label class="form-field form-field--checkbox">
        <input
          type="checkbox"
          :checked="pageNumbersEnabled"
          @change="emit('update-field', 'pageNumbersEnabled', $event.target.checked)"
        />
        <span>Page numbers &amp; Table of Contents</span>
      </label>
    </div>
    <div class="modal-actions">
      <button type="button" class="modal-btn modal-btn--ghost" :disabled="busy" @click="emit('close')">
        Cancel
      </button>
      <button type="button" class="modal-btn modal-btn--primary" :disabled="busy" @click="emit('save')">
        {{ busy ? 'Saving…' : 'Save changes' }}
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

.form-field--checkbox {
  flex-direction: row;
  align-items: center;
  gap: 10px;
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

.swatches {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  padding: 4px 0;
}

.swatch {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  box-shadow: 0 0 0 2px oklch(99% 0 0);
  transition: transform 0.15s;
}

.swatch--active {
  border-color: oklch(20% 0.015 75);
  transform: scale(1.15);
}

.swatch:focus-visible { outline: 2px solid oklch(52% 0.16 250); outline-offset: 2px; }
</style>
