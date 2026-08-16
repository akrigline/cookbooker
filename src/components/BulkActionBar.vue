<script setup>
import { computed } from 'vue'

const props = defineProps({
  count: { type: Number, required: true },
  orderedChapters: { type: Array, required: true },
  layoutTemplates: { type: Array, required: true },
  handlers: { type: Object, required: true },
})

const bulkMoveTarget = defineModel('bulkMoveTarget', { type: [String, Number], default: '' })
const bulkLayoutTarget = defineModel('bulkLayoutTarget', { type: String, default: '' })

const recommendedTemplates = computed(() => props.layoutTemplates.filter((tpl) => tpl.tier === 'recommended'))
const legacyTemplates = computed(() => props.layoutTemplates.filter((tpl) => tpl.tier === 'legacy'))
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
        <label for="bulk-layout-select" class="bulk-bar__label">Apply layout:</label>
        <select
          id="bulk-layout-select"
          v-model="bulkLayoutTarget"
          class="bulk-bar__select"
          aria-label="Select layout to apply"
          @change="handlers.onApplyLayout"
        >
          <option value="">Choose layout…</option>
          <optgroup label="Recommended">
            <option v-for="tpl in recommendedTemplates" :key="tpl.id" :value="tpl.id">{{ tpl.label }}</option>
          </optgroup>
          <optgroup label="More layouts">
            <option v-for="tpl in legacyTemplates" :key="tpl.id" :value="tpl.id">{{ tpl.label }}</option>
          </optgroup>
        </select>
        <button type="button" class="bulk-bar__btn bulk-bar__btn--ghost" @click="handlers.onClear">
          Cancel
        </button>
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
  background: var(--ink-20);
  color: var(--ink-96);
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
  color: var(--ink-78);
  white-space: nowrap;
}

.bulk-bar__select {
  font: inherit;
  font-size: 13px;
  padding: 7px 10px;
  border: 1px solid var(--ink-52);
  border-radius: 8px;
  background: var(--ink-20);
  color: var(--ink-96);
}

.bulk-bar__btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px; /* compact tier: this is a fixed toolbar, not a modal — see visual-qa-report.md */
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  border: 1px solid var(--ink-52);
  background: var(--ink-30);
  color: var(--ink-96);
  cursor: pointer;
  transition: background 0.12s;
  white-space: nowrap;
}

.bulk-bar__btn:hover { background: var(--ink-30); }

.bulk-bar__btn--danger {
  background: none;
  border-color: oklch(65% 0.15 25);
  color: oklch(80% 0.1 25);
}

.bulk-bar__btn--danger:hover { background: oklch(30% 0.08 25); }

.bulk-bar__btn--ghost {
  background: none;
  border-color: var(--ink-52);
  color: var(--ink-78);
}

.bulk-bar__btn--ghost:hover { background: var(--ink-30); }

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
