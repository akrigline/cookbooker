<script setup>
import { onMounted, ref, computed, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useProjectsStore } from '../stores/projects'
import { ACCENT_COLORS, DEFAULT_ACCENT_COLOR } from '../js/templates'
import EditCookbookModal from '../components/EditCookbookModal.vue'

// ── Constants ────────────────────────────────────────────────────────────────

const ACCENT_MAP = Object.fromEntries(ACCENT_COLORS.map(a => [a.id, a]))

const LAYOUTS = [
  { id: 'classic', name: 'Classic',       description: 'Centered title, rule line' },
  { id: 'modern',  name: 'Modern Border', description: 'Left-aligned, framed edge' },
]

// ── Store / router ────────────────────────────────────────────────────────────

const projectsStore = useProjectsStore()
const router = useRouter()

// ── UI state ─────────────────────────────────────────────────────────────────

const modal = ref(null)            // null | {type:'create'} | {type:'edit',id} | {type:'delete',id}
const form = ref({ title: '', subtitle: '', accentId: 'terracotta', layoutId: 'classic' })
const titleTouched = ref(false)
const submitting = ref(false)
// Persistence failures (a cookbook deleted in another tab) surface here rather
// than as an unhandled rejection behind a dialog stuck in its busy state.
const error = ref(null)
const lastTrigger = ref(null)
const firstFieldEl = ref(null)

// Edit modal - shares EditCookbookModal with ProjectView.vue so both entry
// points offer the same options (cover layout, page numbers/TOC, double-sided).
const editTitle = ref('')
const editSubtitle = ref('')
const editAccent = ref('')
const editingProject = computed(() =>
  modal.value?.type === 'edit' ? projectsStore.projects.find((p) => p.id === modal.value.id) : null,
)

// ── Computed ──────────────────────────────────────────────────────────────────

const projectCountLabel = computed(() => {
  const len = projectsStore.projects.length
  return `${len} cookbook${len === 1 ? '' : 's'}`
})

const showFormModal = computed(() => modal.value?.type === 'create')
const showEditModal = computed(() => modal.value?.type === 'edit')
const showDeleteModal = computed(() => !!modal.value && modal.value.type === 'delete')

const formHeading = computed(() => 'New cookbook')
const formSubmitLabel = computed(() => 'Create cookbook')

const titleInvalid = computed(() => titleTouched.value && !form.value.title.trim())

const accentOptions = computed(() =>
  ACCENT_COLORS.map(a => ({
    ...a,
    selected: form.value.accentId === a.id,
    ringColor: form.value.accentId === a.id ? a.value : 'transparent',
  }))
)

const layoutOptions = computed(() =>
  LAYOUTS.map(l => ({
    ...l,
    selected: form.value.layoutId === l.id,
    bg:     form.value.layoutId === l.id ? 'oklch(93% 0.02 250)' : 'var(--ink-96)',
    border: form.value.layoutId === l.id ? 'var(--color-focus)' : 'var(--ink-84)',
  }))
)

const deleteTarget = computed(() =>
  modal.value?.type === 'delete'
    ? projectsStore.projects.find(p => p.id === modal.value.id)
    : null
)

// ── Helpers ───────────────────────────────────────────────────────────────────

function accentColorFromId(id) {
  return (ACCENT_MAP[id] || ACCENT_COLORS[0]).value
}

function recipeCountLabel(project) {
  const chapters = projectsStore.chaptersForProject(project.id)
  const count = projectsStore.projectRecipesForProject(project.id).length
  const chapterCount = chapters.filter(c => !c.isDefault).length
  return {
    recipes: `${count} recipe${count === 1 ? '' : 's'}`,
    chapters: `${chapterCount} chapter${chapterCount === 1 ? '' : 's'}`,
  }
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────

onMounted(() => {
  if (!projectsStore.loaded) projectsStore.load()
})

// ── Modal open/close ──────────────────────────────────────────────────────────

function openCreate(e) {
  lastTrigger.value = e?.currentTarget ?? null
  form.value = { title: '', subtitle: '', accentId: 'terracotta', layoutId: 'classic' }
  titleTouched.value = false
  modal.value = { type: 'create' }
  focusFirstField()
}

function openEdit(project, e) {
  lastTrigger.value = e?.currentTarget ?? null
  editTitle.value = project.title
  editSubtitle.value = project.subtitle || ''
  editAccent.value = project.accentColor || ''
  modal.value = { type: 'edit', id: project.id }
}

function openDelete(project, e) {
  lastTrigger.value = e?.currentTarget ?? null
  modal.value = { type: 'delete', id: project.id }
  focusFirstField()
}

function closeModal() {
  modal.value = null
  error.value = null
  nextTick(() => {
    if (lastTrigger.value?.focus) lastTrigger.value.focus()
    lastTrigger.value = null
  })
}

function focusFirstField() {
  nextTick(() => firstFieldEl.value?.focus())
}

// ── Form handlers ─────────────────────────────────────────────────────────────

async function handleFormSubmit() {
  titleTouched.value = true
  if (!form.value.title.trim() || submitting.value) return
  submitting.value = true
  error.value = null
  try {
    const payload = {
      title:         form.value.title.trim(),
      subtitle:      form.value.subtitle.trim(),
      accentColor:   accentColorFromId(form.value.accentId),
      coverTemplate: form.value.layoutId,
    }
    const id = await projectsStore.createProject(payload)
    closeModal()
    router.push(`/projects/${id}`)
  } catch (err) {
    // `createProject` rejects on a genuine write failure. Without this the
    // dialog stays open, never leaves its "Saving…" state, and the
    // rejection is only visible in the console.
    error.value = `Could not save this cookbook: ${err.message}`
  } finally {
    submitting.value = false
  }
}

// EditCookbookModal has no error slot of its own (it's shared with
// ProjectView.vue, which reports failures into a page-level banner rather
// than inside the dialog) - `editBannerError` mirrors that here: the dialog
// closes on failure and this banner, shown above the project grid, says
// what did not happen.
const editBannerError = ref('')

async function saveEditCookbook() {
  if (!modal.value || modal.value.type !== 'edit' || submitting.value) return
  submitting.value = true
  editBannerError.value = ''
  try {
    await projectsStore.editProject(modal.value.id, {
      title: editTitle.value.trim(),
      subtitle: editSubtitle.value.trim(),
      accentColor: editAccent.value,
    })
    closeModal()
  } catch (err) {
    // `editProject` rejects when the cookbook is already gone (deleted in
    // another tab). Without this the dialog stays open, never leaves its
    // "Saving…" state, and the rejection is only visible in the console.
    editBannerError.value = `Could not save this cookbook: ${err.message}`
    closeModal()
  } finally {
    submitting.value = false
  }
}

async function updateField(field, value) {
  if (!modal.value || modal.value.type !== 'edit') return
  try {
    await projectsStore.editProject(modal.value.id, { [field]: value })
  } catch (err) {
    editBannerError.value = `Could not save this cookbook: ${err.message}`
    closeModal()
  }
}

async function confirmDelete() {
  if (!deleteTarget.value || submitting.value) return
  submitting.value = true
  error.value = null
  try {
    await projectsStore.removeProject(modal.value.id)
    closeModal()
  } catch (err) {
    // Not a live path today: `db.deleteProject` only issues plain Dexie
    // `delete()` calls, which resolve rather than reject for a row that's
    // already gone. Kept for a genuine write failure (storage/quota) - the
    // dialog stays open, since "Delete cookbook" is still the correct retry.
    error.value = `Could not delete this cookbook: ${err.message}`
  } finally {
    submitting.value = false
  }
}

// ── Keyboard trap ─────────────────────────────────────────────────────────────

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

function handleModalKeyDown(e) {
  if (e.key === 'Escape') { e.stopPropagation(); closeModal(); return }
  if (e.key === 'Tab') {
    const nodes = [...e.currentTarget.querySelectorAll(FOCUSABLE)]
    if (!nodes.length) return
    const first = nodes[0], last = nodes[nodes.length - 1]
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
  }
}
</script>

<template>
  <main id="cm-main" class="cm-page-main">

    <p
      v-if="editBannerError"
      role="alert"
      style="margin:0 0 20px; padding:12px 16px; border-radius:8px; background:oklch(95% 0.045 25); border:1px solid oklch(82% 0.07 25); color:oklch(38% 0.12 25); font-size:14px; font-weight:600;"
    >
      {{ editBannerError }}
    </p>

    <!-- Header row -->
    <div style="display:flex; align-items:flex-end; justify-content:space-between; gap:16px; margin-bottom:32px; flex-wrap:wrap;">
      <div>
        <h1 class="text-page-title">Cookbooks</h1>
        <p class="text-subtitle" style="margin:0;">{{ projectCountLabel }}</p>
      </div>
      <div style="display:flex; gap:10px; flex-wrap:wrap;">
        <router-link to="/import-cookbook" class="btn-secondary-header">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          Import Cookbook
        </router-link>
        <button type="button" @click="openCreate" class="btn-new" :disabled="submitting">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
          New Cookbook
        </button>
      </div>
    </div>

    <!-- Project grid -->
    <div v-if="projectsStore.projects.length" role="list" aria-label="Cookbook projects" style="display:grid; grid-template-columns:repeat(auto-fill, minmax(300px, 1fr)); gap:24px;">
      <article
        v-for="project in projectsStore.projects"
        :key="project.id"
        role="listitem"
        :aria-labelledby="`cm-title-${project.id}`"
        class="card"
      >
        <!-- Cover area -->
        <div style="position:relative; min-height:156px; background:var(--ink-99);">

          <!-- Classic layout: centered title + rule lines -->
          <template v-if="(project.coverTemplate || 'classic') !== 'modern'">
            <div style="height:100%; box-sizing:border-box; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding:24px 20px; gap:9px;">
              <div aria-hidden="true" :style="{ width:'34px', height:'2px', background: project.accentColor || DEFAULT_ACCENT_COLOR }"></div>
              <h2 :id="`cm-title-${project.id}`" class="text-item-title" style="overflow-wrap:break-word;">{{ project.title || 'Untitled Cookbook' }}</h2>
              <p v-if="project.subtitle" style="margin:0; font-size:13px; font-style:italic; color:var(--ink-46);">{{ project.subtitle }}</p>
              <div aria-hidden="true" :style="{ width:'34px', height:'2px', background: project.accentColor || DEFAULT_ACCENT_COLOR }"></div>
            </div>
          </template>

          <!-- Modern layout: left-aligned, framed border -->
          <template v-else>
            <div aria-hidden="true" :style="{ position:'absolute', inset:'10px', border:`1.5px solid ${project.accentColor || DEFAULT_ACCENT_COLOR}` }"></div>
            <div aria-hidden="true" :style="{ position:'absolute', left:'10px', top:'10px', bottom:'10px', width:'5px', background: project.accentColor || DEFAULT_ACCENT_COLOR }"></div>
            <div style="position:relative; height:100%; box-sizing:border-box; display:flex; flex-direction:column; justify-content:center; padding:26px 30px; gap:7px;">
              <h2 :id="`cm-title-${project.id}`" class="text-item-title" style="overflow-wrap:break-word;">{{ project.title || 'Untitled Cookbook' }}</h2>
              <p v-if="project.subtitle" style="margin:0; font-size:13px; font-style:italic; color:var(--ink-46);">{{ project.subtitle }}</p>
            </div>
          </template>
        </div>

        <!-- Stats row -->
        <div style="border-top:1px solid var(--ink-88); padding:11px 22px; display:flex; align-items:center; justify-content:space-between; font-size:13px; color:var(--ink-46);">
          <span>{{ recipeCountLabel(project).recipes }} · {{ recipeCountLabel(project).chapters }}</span>
        </div>

        <!-- Action row -->
        <div style="padding:12px 22px 18px; display:flex; align-items:center; gap:10px;">
          <router-link :to="`/projects/${project.id}`" class="btn-open">
            Open cookbook
          </router-link>
          <button type="button" :aria-label="`Edit ${project.title} details`" @click="openEdit(project, $event)" class="btn-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
          </button>
          <button type="button" :aria-label="`Delete ${project.title}`" @click="openDelete(project, $event)" class="btn-icon-danger">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
          </button>
        </div>
      </article>
    </div>

    <!-- Empty state -->
    <div v-else style="border:1px dashed var(--ink-80); border-radius:14px; padding:64px 32px; text-align:center; background:var(--ink-99);">
      <p style="font-family:'Newsreader',Georgia,serif; font-size:22px; font-weight:600; margin:0 0 8px;">No cookbooks yet</p>
      <p class="text-subtitle" style="margin:0 0 20px;">Create your first cookbook project to start organizing recipes into chapters.</p>
      <button type="button" @click="openCreate" class="btn-new">New Cookbook</button>
    </div>
  </main>

  <!-- ── Create modal ─────────────────────────────────────────────────────── -->
  <Teleport to="body">
    <div v-if="showFormModal" @click="closeModal" @keydown="handleModalKeyDown" class="modal-backdrop">
      <div role="dialog" aria-modal="true" aria-labelledby="cm-form-heading" @click.stop class="modal-box">

        <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:16px; margin-bottom:20px;">
          <h2 id="cm-form-heading" class="text-h2" style="margin:0;">{{ formHeading }}</h2>
          <button type="button" aria-label="Close dialog" @click="closeModal" class="btn-close">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <form @submit.prevent="handleFormSubmit">
          <div style="display:flex; flex-direction:column; gap:16px;">

            <!-- Title -->
            <div>
              <label for="cm-field-title" style="display:block; font-size:13px; font-weight:600; margin-bottom:6px;">
                Title <span aria-hidden="true" style="color:oklch(45% 0.05 25);">*</span>
              </label>
              <input
                ref="firstFieldEl"
                id="cm-field-title"
                type="text"
                required
                v-model="form.title"
                @blur="titleTouched = true"
                :aria-invalid="titleInvalid || undefined"
                :aria-describedby="titleInvalid ? 'cm-title-error' : undefined"
                class="form-input"
                :class="{ 'form-input-error': titleInvalid }"
              />
              <p v-if="titleInvalid" id="cm-title-error" role="alert" style="margin:6px 0 0; font-size:13px; color:var(--color-danger);">Title is required.</p>
            </div>

            <!-- Subtitle -->
            <div>
              <label for="cm-field-subtitle" style="display:block; font-size:13px; font-weight:600; margin-bottom:6px;">Subtitle</label>
              <input id="cm-field-subtitle" type="text" v-model="form.subtitle" class="form-input" />
            </div>

            <!-- Accent color -->
            <div role="group" aria-label="Accent color">
              <p style="font-size:13px; font-weight:600; margin:0 0 8px;">Accent color</p>
              <div style="display:flex; gap:10px; flex-wrap:wrap;">
                <button
                  v-for="opt in accentOptions"
                  :key="opt.id"
                  type="button"
                  :aria-pressed="opt.selected"
                  :aria-label="opt.label"
                  @click="form.accentId = opt.id"
                  class="btn-swatch"
                  :style="{
                    background: opt.value,
                    boxShadow: `0 0 0 2px oklch(99% 0 0), 0 0 0 ${opt.selected ? '4px' : '0px'} ${opt.value}`
                  }"
                ></button>
              </div>
            </div>

            <!-- Cover layout -->
            <div role="group" aria-label="Cover layout">
              <p style="font-size:13px; font-weight:600; margin:0 0 8px;">Cover layout</p>
              <div style="display:flex; gap:10px;">
                <button
                  v-for="lopt in layoutOptions"
                  :key="lopt.id"
                  type="button"
                  :aria-pressed="lopt.selected"
                  @click="form.layoutId = lopt.id"
                  class="btn-layout"
                  :style="{ background: lopt.bg, borderColor: lopt.border }"
                >
                  {{ lopt.name }}
                  <span style="display:block; font-weight:400; font-size:12px; color:var(--ink-46); margin-top:2px;">{{ lopt.description }}</span>
                </button>
              </div>
            </div>

          </div>

          <p v-if="error" role="alert" style="margin:20px 0 0; font-size:14px; font-weight:600; color:var(--color-danger);">{{ error }}</p>

          <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:26px;">
            <button type="button" @click="closeModal" class="btn-cancel">Cancel</button>
            <button type="submit" class="btn-submit" :disabled="submitting">{{ formSubmitLabel }}</button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>

  <!-- ── Edit modal (shared with ProjectView.vue's cookbook edit button) ──── -->
  <EditCookbookModal
    v-if="showEditModal"
    v-model:title="editTitle"
    v-model:subtitle="editSubtitle"
    v-model:accent="editAccent"
    :cover-template="editingProject?.coverTemplate"
    :page-numbers-enabled="editingProject?.pageNumbersEnabled"
    :double-sided-enabled="editingProject?.doubleSidedEnabled"
    :busy="submitting"
    @update-field="updateField"
    @close="closeModal"
    @save="saveEditCookbook"
  />

  <!-- ── Delete confirmation modal ───────────────────────────────────────── -->
  <Teleport to="body">
    <div v-if="showDeleteModal" @click="closeModal" @keydown="handleModalKeyDown" class="modal-backdrop">
      <div role="alertdialog" aria-modal="true" aria-labelledby="cm-delete-heading" aria-describedby="cm-delete-desc" @click.stop class="modal-box modal-box-sm">
        <h2 id="cm-delete-heading" class="text-h2">Delete "{{ deleteTarget?.title }}"?</h2>
        <p id="cm-delete-desc" style="margin:0 0 22px; font-size:14px; color:var(--ink-42); line-height:1.5;">
          This removes the cookbook project and its chapters. Its recipes stay in the Global Recipe Library and in any other cookbooks that use them. This can't be undone.
        </p>
        <p v-if="error" role="alert" style="margin:0 0 18px; font-size:14px; font-weight:600; color:var(--color-danger);">{{ error }}</p>

        <div style="display:flex; justify-content:flex-end; gap:10px;">
          <button ref="firstFieldEl" type="button" @click="closeModal" class="btn-cancel">Cancel</button>
          <button type="button" @click="confirmDelete" class="btn-delete" :disabled="submitting">Delete cookbook</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
/* Cards */
.card {
  background: var(--ink-99);
  border: 1px solid var(--ink-88);
  border-radius: 14px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* Buttons */
.btn-new {
  display: flex; align-items: center; gap: 8px;
  background: var(--ink-20); color: var(--ink-99);
  border: none; border-radius: 8px; padding: 12px 20px;
  font-size: 15px; font-weight: 600; cursor: pointer;
}
.btn-new:hover { background: var(--ink-30); }
.btn-new:focus-visible { outline: 2px solid var(--color-focus); outline-offset: 2px; }
.btn-new:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-secondary-header {
  display: flex; align-items: center; gap: 8px;
  background: var(--ink-93); color: var(--ink-20);
  border: 1px solid var(--ink-84); border-radius: 8px; padding: 12px 20px;
  font-size: 15px; font-weight: 600; cursor: pointer; text-decoration: none;
}
.btn-secondary-header:hover { background: var(--ink-88); }
.btn-secondary-header:focus-visible { outline: 2px solid var(--color-focus); outline-offset: 2px; }

.btn-open {
  flex: 1; background: var(--ink-93); border: 1px solid var(--ink-84);
  border-radius: 8px; padding: 10px 14px; font-size: 14px; font-weight: 600;
  cursor: pointer; color: var(--ink-20); text-align: center; text-decoration: none;
}
.btn-open:hover { background: var(--ink-88); }
.btn-open:focus-visible { outline: 2px solid var(--color-focus); outline-offset: 2px; }

.btn-icon {
  width: 40px; height: 40px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  background: none; border: 1px solid var(--ink-84); border-radius: 8px;
  cursor: pointer; color: var(--ink-30);
}
.btn-icon:hover { background: var(--ink-93); }
.btn-icon:focus-visible { outline: 2px solid var(--color-focus); outline-offset: 2px; }

.btn-icon-danger {
  width: 40px; height: 40px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  background: none; border: 1px solid var(--ink-84); border-radius: 8px;
  cursor: pointer; color: oklch(45% 0.05 25);
}
.btn-icon-danger:hover { background: oklch(94% 0.04 25); border-color: oklch(80% 0.06 25); }
.btn-icon-danger:focus-visible { outline: 2px solid var(--color-focus); outline-offset: 2px; }
.btn-icon-danger:disabled { opacity: 0.5; cursor: not-allowed; }

/* Modals */
.modal-backdrop {
  position: fixed; inset: 0;
  background: oklch(10% 0.01 75 / 0.45);
  display: flex; align-items: center; justify-content: center;
  padding: 24px; z-index: 200;
}
.modal-box {
  background: var(--ink-99); border-radius: 16px;
  width: 100%; max-width: 480px; max-height: 90vh; overflow-y: auto;
  padding: 28px 28px 24px;
  box-shadow: 0 20px 60px oklch(10% 0.01 75 / 0.25);
}
.modal-box-sm { max-width: 420px; }

.btn-close {
  width: 32px; height: 32px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  background: none; border: none; border-radius: 6px; cursor: pointer; color: var(--ink-42);
}
.btn-close:hover { background: var(--ink-93); }
.btn-close:focus-visible { outline: 2px solid var(--color-focus); outline-offset: 2px; }

/* Form elements */
.form-input {
  width: 100%; box-sizing: border-box; padding: 10px 12px;
  font-size: 15px; border: 1px solid var(--ink-84);
  border-radius: 8px; font-family: inherit;
}
.form-input:focus-visible {
  outline: 2px solid var(--color-focus); outline-offset: 1px;
  border-color: var(--color-focus);
}
.form-input-error { border-color: oklch(55% 0.14 25); }

.btn-swatch {
  width: 34px; height: 34px; border-radius: 999px;
  border: none; cursor: pointer;
  transition: box-shadow 0.15s;
}
.btn-swatch:focus-visible { outline: 2px solid var(--color-focus); outline-offset: 2px; }

.btn-layout {
  flex: 1; text-align: left; padding: 10px 12px; border-radius: 8px; cursor: pointer;
  font-size: 13px; font-weight: 600; color: var(--ink-20);
  border-width: 1.5px; border-style: solid;
  transition: background 0.15s, border-color 0.15s;
}
.btn-layout:focus-visible { outline: 2px solid var(--color-focus); outline-offset: 2px; }

.btn-cancel {
  padding: 10px 20px; font-size: 14px; font-weight: 600;
  border-radius: 8px; border: 1px solid var(--ink-84);
  background: var(--ink-93); cursor: pointer;
}
.btn-cancel:hover { background: var(--ink-88); }
.btn-cancel:focus-visible { outline: 2px solid var(--color-focus); outline-offset: 2px; }

.btn-submit {
  padding: 10px 20px; font-size: 14px; font-weight: 600;
  border-radius: 8px; border: none;
  background: var(--ink-20); color: var(--ink-99); cursor: pointer;
}
.btn-submit:hover { background: var(--ink-30); }
.btn-submit:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-submit:focus-visible { outline: 2px solid var(--color-focus); outline-offset: 2px; }

.btn-delete {
  padding: 10px 20px; font-size: 14px; font-weight: 600;
  border-radius: 8px; border: none;
  background: var(--color-danger); color: white; cursor: pointer;
}
.btn-delete:hover { background: var(--color-danger-hover); }
.btn-delete:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-delete:focus-visible { outline: 2px solid var(--color-focus); outline-offset: 2px; }
</style>
