<script setup>
import Modal from './Modal.vue'

const emit = defineEmits(['close'])
</script>

<template>
  <Modal title-id="about-modal-title" @close="emit('close')">
    <h2 id="about-modal-title" class="modal-title">About Cookbooker</h2>
    <p class="modal-body">
      Cookbooker runs entirely on your machine — all recipe and cookbook data
      lives in your browser's local storage. No server, account, or network
      connection is involved, and you keep full rights to any content you
      create or import.
    </p>
    <p class="modal-body">
      Cookbooker is open source under the MIT license.
      <a href="https://github.com/akrigline/cookbooker" target="_blank" rel="noopener noreferrer">
        View the repository on GitHub
      </a>.
    </p>
    <div class="modal-actions">
      <button type="button" class="modal-btn modal-btn--ghost" @click="emit('close')">Close</button>
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
  margin: 0 0 16px;
}

.modal-body a {
  color: oklch(45% 0.15 250);
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

.modal-btn--ghost {
  background: var(--ink-93);
  color: var(--ink-20);
  border: 1px solid var(--ink-84);
}

.modal-btn--ghost:hover {
  background: var(--ink-88);
}
</style>
