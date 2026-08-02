<script setup>
defineProps({
  count: { type: Number, required: true },
  orderedChapters: { type: Array, required: true },
  handlers: { type: Object, required: true },
})

const bulkMoveTarget = defineModel('bulkMoveTarget', { type: [String, Number], default: '' })
</script>

<template>
  <Transition name="slide-up">
    <div v-if="count > 0" class="bulk-bar" role="toolbar" aria-label="Bulk recipe actions">
      <span class="bulk-bar__count">
        {{ count }} recipe{{ count !== 1 ? 's' : '' }} selected
      </span>
      <div class="bulk-bar__actions">
        <label for="bulk-move-select" class="bulk-bar__label">Move to:</label>
        <select
          id="bulk-move-select"
          v-model="bulkMoveTarget"
          class="bulk-bar__select"
          aria-label="Select chapter to move to"
          @change="handlers.onMove"
        >
          <option value="">Choose chapter…</option>
          <option v-for="c in orderedChapters" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
        <button
          type="button"
          class="bulk-bar__btn"
          @click="handlers.onNewChapterFromSelection"
        >
          New chapter from these
        </button>
        <button
          type="button"
          class="bulk-bar__btn bulk-bar__btn--danger"
          @click="handlers.onBulkRemove"
        >
          Remove from cookbook
        </button>
        <button type="button" class="bulk-bar__btn bulk-bar__btn--ghost" @click="handlers.onClear">
          Cancel
        </button>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.bulk-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: oklch(20% 0.015 75);
  color: oklch(97% 0.004 75);
  padding: 14px 32px;
  display: flex;
  align-items: center;
  gap: 16px;
  z-index: 500;
  box-shadow: 0 -4px 24px oklch(10% 0.01 75 / 25%);
  flex-wrap: wrap;
}

.bulk-bar__count {
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
}

.bulk-bar__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  flex-wrap: wrap;
}

.bulk-bar__label {
  font-size: 13px;
  font-weight: 600;
  color: oklch(80% 0.008 75);
  white-space: nowrap;
}

.bulk-bar__select {
  font: inherit;
  font-size: 13px;
  padding: 7px 10px;
  border: 1px solid oklch(50% 0.012 75);
  border-radius: 8px;
  background: oklch(25% 0.015 75);
  color: oklch(97% 0.004 75);
}

.bulk-bar__btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  border: 1px solid oklch(50% 0.012 75);
  background: oklch(28% 0.018 75);
  color: oklch(97% 0.004 75);
  cursor: pointer;
  transition: background 0.12s;
  white-space: nowrap;
}

.bulk-bar__btn:hover { background: oklch(34% 0.018 75); }

.bulk-bar__btn--danger {
  background: none;
  border-color: oklch(65% 0.15 25);
  color: oklch(80% 0.1 25);
}

.bulk-bar__btn--danger:hover { background: oklch(30% 0.08 25); }

.bulk-bar__btn--ghost {
  background: none;
  border-color: oklch(50% 0.01 75);
  color: oklch(75% 0.008 75);
}

.bulk-bar__btn--ghost:hover { background: oklch(28% 0.01 75); }

.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.22s ease, opacity 0.22s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}
</style>
