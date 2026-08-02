<script setup>
import { onMounted, ref, computed, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useProjectsStore } from '../stores/projects'

// ── Constants ────────────────────────────────────────────────────────────────

const ACCENTS = [
  { id: 'terracotta', name: 'Terracotta', color: 'oklch(62% 0.13 35)' },
  { id: 'sage',       name: 'Sage',       color: 'oklch(62% 0.09 145)' },
  { id: 'ochre',      name: 'Ochre',      color: 'oklch(70% 0.12 85)' },
  { id: 'plum',       name: 'Plum',       color: 'oklch(50% 0.11 325)' },
  { id: 'teal',       name: 'Teal',       color: 'oklch(55% 0.09 200)' },
  { id: 'slate',      name: 'Slate Blue', color: 'oklch(55% 0.10 265)' },
]

const ACCENT_MAP = Object.fromEntries(ACCENTS.map(a => [a.id, a]))

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

// ── Computed ──────────────────────────────────────────────────────────────────

const projectCountLabel = computed(() => {
  const len = projectsStore.projects.length
  return `${len} cookbook${len === 1 ? '' : 's'}`
})

const showFormModal = computed(() => !!modal.value && (modal.value.type === 'create' || modal.value.type === 'edit'))
const showDeleteModal = computed(() => !!modal.value && modal.value.type === 'delete')

const formHeading = computed(() => modal.value?.type === 'edit' ? 'Edit cookbook details' : 'New cookbook')
const formSubmitLabel = computed(() => modal.value?.type === 'edit' ? 'Save changes' : 'Create cookbook')

const titleInvalid = computed(() => titleTouched.value && !form.value.title.trim())

const accentOptions = computed(() =>
  ACCENTS.map(a => ({
    ...a,
    selected: form.value.accentId === a.id,
    ringColor: form.value.accentId === a.id ? a.color : 'transparent',
  }))
)

const layoutOptions = computed(() =>
  LAYOUTS.map(l => ({
    ...l,
    selected: form.value.layoutId === l.id,
    bg:     form.value.layoutId === l.id ? 'oklch(93% 0.02 250)' : 'oklch(97% 0.004 75)',
    border: form.value.layoutId === l.id ? 'oklch(52% 0.16 250)' : 'oklch(85% 0.008 75)',
  }))
)

const deleteTarget = computed(() =>
  modal.value?.type === 'delete'
    ? projectsStore.projects.find(p => p.id === modal.value.id)
    : null
)

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Resolve an accentId from a stored accentColor string (or default). */
function accentIdFromColor(color) {
  const match = ACCENTS.find(a => a.color === color)
  return match ? match.id : 'terracotta'
}

function accentColorFromId(id) {
  return (ACCENT_MAP[id] || ACCENTS[0]).color
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
  form.value = {
    title:    project.title,
    subtitle: project.subtitle || '',
    accentId: accentIdFromColor(project.accentColor),
    layoutId: project.coverTemplate || 'classic',
  }
  titleTouched.value = false
  modal.value = { type: 'edit', id: project.id }
  focusFirstField()
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
    if (modal.value.type === 'create') {
      const id = await projectsStore.createProject(payload)
      closeModal()
      router.push(`/projects/${id}`)
    } else {
      await projectsStore.editProject(modal.value.id, payload)
      closeModal()
    }
  } catch (err) {
    // `editProject` rejects when the cookbook is already gone (deleted in
    // another tab). Without this the dialog stays open, never leaves its
    // "Saving…" state, and the rejection is only visible in the console.
    error.value = `Could not save this cookbook: ${err.message}`
  } finally {
    submitting.value = false
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
  <main id="cm-main" style="max-width:1280px; margin:0 auto; padding:40px 32px 80px;">

    <!-- Header row -->
    <div style="display:flex; align-items:flex-end; justify-content:space-between; gap:16px; margin-bottom:32px; flex-wrap:wrap;">
      <div>
        <h1 style="font-family:'Newsreader',Georgia,serif; font-size:34px; font-weight:600; margin:0 0 6px; letter-spacing:-0.01em;">Cookbooks</h1>
        <p style="margin:0; font-size:15px; color:oklch(45% 0.01 75);">{{ projectCountLabel }}</p>
      </div>
      <button type="button" @click="openCreate" class="btn-new" :disabled="submitting">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
        New Cookbook
      </button>
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
        <div style="position:relative; min-height:156px; background:oklch(99% 0.002 75);">

          <!-- Classic layout: centered title + rule lines -->
          <template v-if="(project.coverTemplate || 'classic') !== 'modern'">
            <div style="height:100%; box-sizing:border-box; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding:24px 20px; gap:9px;">
              <div aria-hidden="true" :style="{ width:'34px', height:'2px', background: project.accentColor || 'oklch(62% 0.13 35)' }"></div>
              <h2 :id="`cm-title-${project.id}`" style="font-family:'Newsreader',Georgia,serif; font-size:21px; font-weight:600; margin:0; letter-spacing:-0.01em; overflow-wrap:break-word;">{{ project.title || 'Untitled Cookbook' }}</h2>
              <p v-if="project.subtitle" style="margin:0; font-size:13px; font-style:italic; color:oklch(45% 0.01 75);">{{ project.subtitle }}</p>
              <div aria-hidden="true" :style="{ width:'34px', height:'2px', background: project.accentColor || 'oklch(62% 0.13 35)' }"></div>
            </div>
          </template>

          <!-- Modern layout: left-aligned, framed border -->
          <template v-else>
            <div aria-hidden="true" :style="{ position:'absolute', inset:'10px', border:`1.5px solid ${project.accentColor || 'oklch(62% 0.13 35)'}` }"></div>
            <div aria-hidden="true" :style="{ position:'absolute', left:'10px', top:'10px', bottom:'10px', width:'5px', background: project.accentColor || 'oklch(62% 0.13 35)' }"></div>
            <div style="position:relative; height:100%; box-sizing:border-box; display:flex; flex-direction:column; justify-content:center; padding:26px 30px; gap:7px;">
              <h2 :id="`cm-title-${project.id}`" style="font-family:'Newsreader',Georgia,serif; font-size:21px; font-weight:600; margin:0; letter-spacing:-0.01em; overflow-wrap:break-word;">{{ project.title || 'Untitled Cookbook' }}</h2>
              <p v-if="project.subtitle" style="margin:0; font-size:13px; font-style:italic; color:oklch(45% 0.01 75);">{{ project.subtitle }}</p>
            </div>
          </template>
        </div>

        <!-- Stats row -->
        <div style="border-top:1px solid oklch(90% 0.008 75); padding:11px 22px; display:flex; align-items:center; justify-content:space-between; font-size:13px; color:oklch(45% 0.01 75);">
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
    <div v-else style="border:1px dashed oklch(80% 0.01 75); border-radius:14px; padding:64px 32px; text-align:center; background:oklch(99% 0.003 75);">
      <p style="font-family:'Newsreader',Georgia,serif; font-size:22px; font-weight:600; margin:0 0 8px;">No cookbooks yet</p>
      <p style="margin:0 0 20px; font-size:15px; color:oklch(45% 0.01 75);">Create your first cookbook project to start organizing recipes into chapters.</p>
      <button type="button" @click="openCreate" class="btn-new">New Cookbook</button>
    </div>
  </main>

  <!-- ── Create / Edit modal ──────────────────────────────────────────────── -->
  <Teleport to="body">
    <div v-if="showFormModal" @click="closeModal" @keydown="handleModalKeyDown" class="modal-backdrop">
      <div role="dialog" aria-modal="true" aria-labelledby="cm-form-heading" @click.stop class="modal-box">

        <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:16px; margin-bottom:20px;">
          <h2 id="cm-form-heading" style="font-family:'Newsreader',Georgia,serif; font-size:22px; font-weight:600; margin:0;">{{ formHeading }}</h2>
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
              <p v-if="titleInvalid" id="cm-title-error" role="alert" style="margin:6px 0 0; font-size:13px; color:oklch(45% 0.14 25);">Title is required.</p>
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
                  :aria-label="opt.name"
                  @click="form.accentId = opt.id"
                  class="btn-swatch"
                  :style="{
                    background: opt.color,
                    boxShadow: `0 0 0 2px oklch(99% 0 0), 0 0 0 ${opt.selected ? '4px' : '0px'} ${opt.color}`
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
                  <span style="display:block; font-weight:400; font-size:12px; color:oklch(45% 0.01 75); margin-top:2px;">{{ lopt.description }}</span>
                </button>
              </div>
            </div>

          </div>

          <p v-if="error" role="alert" style="margin:20px 0 0; font-size:14px; font-weight:600; color:oklch(45% 0.14 25);">{{ error }}</p>

          <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:26px;">
            <button type="button" @click="closeModal" class="btn-cancel">Cancel</button>
            <button type="submit" class="btn-submit" :disabled="submitting">{{ formSubmitLabel }}</button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>

  <!-- ── Delete confirmation modal ───────────────────────────────────────── -->
  <Teleport to="body">
    <div v-if="showDeleteModal" @click="closeModal" @keydown="handleModalKeyDown" class="modal-backdrop">
      <div role="alertdialog" aria-modal="true" aria-labelledby="cm-delete-heading" aria-describedby="cm-delete-desc" @click.stop class="modal-box modal-box-sm">
        <h2 id="cm-delete-heading" style="font-family:'Newsreader',Georgia,serif; font-size:20px; font-weight:600; margin:0 0 10px;">Delete "{{ deleteTarget?.title }}"?</h2>
        <p id="cm-delete-desc" style="margin:0 0 22px; font-size:14px; color:oklch(40% 0.01 75); line-height:1.5;">
          This removes the cookbook project and its chapters. Its recipes stay in the Global Recipe Library and in any other cookbooks that use them. This can't be undone.
        </p>
        <p v-if="error" role="alert" style="margin:0 0 18px; font-size:14px; font-weight:600; color:oklch(45% 0.14 25);">{{ error }}</p>

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
  background: oklch(99.2% 0.002 75);
  border: 1px solid oklch(88% 0.008 75);
  border-radius: 14px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* Buttons */
.btn-new {
  display: flex; align-items: center; gap: 8px;
  background: oklch(20% 0.015 75); color: oklch(98% 0.004 75);
  border: none; border-radius: 8px; padding: 12px 20px;
  font-size: 15px; font-weight: 600; cursor: pointer;
}
.btn-new:hover { background: oklch(28% 0.02 75); }
.btn-new:focus-visible { outline: 2px solid oklch(52% 0.16 250); outline-offset: 2px; }
.btn-new:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-open {
  flex: 1; background: oklch(94% 0.006 75); border: 1px solid oklch(85% 0.008 75);
  border-radius: 8px; padding: 10px 14px; font-size: 14px; font-weight: 600;
  cursor: pointer; color: oklch(18% 0.01 75); text-align: center; text-decoration: none;
}
.btn-open:hover { background: oklch(90% 0.008 75); }
.btn-open:focus-visible { outline: 2px solid oklch(52% 0.16 250); outline-offset: 2px; }

.btn-icon {
  width: 40px; height: 40px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  background: none; border: 1px solid oklch(85% 0.008 75); border-radius: 8px;
  cursor: pointer; color: oklch(30% 0.01 75);
}
.btn-icon:hover { background: oklch(94% 0.006 75); }
.btn-icon:focus-visible { outline: 2px solid oklch(52% 0.16 250); outline-offset: 2px; }

.btn-icon-danger {
  width: 40px; height: 40px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  background: none; border: 1px solid oklch(85% 0.008 75); border-radius: 8px;
  cursor: pointer; color: oklch(45% 0.05 25);
}
.btn-icon-danger:hover { background: oklch(94% 0.04 25); border-color: oklch(80% 0.06 25); }
.btn-icon-danger:focus-visible { outline: 2px solid oklch(52% 0.16 250); outline-offset: 2px; }
.btn-icon-danger:disabled { opacity: 0.5; cursor: not-allowed; }

/* Modals */
.modal-backdrop {
  position: fixed; inset: 0;
  background: oklch(20% 0.01 75 / 0.45);
  display: flex; align-items: center; justify-content: center;
  padding: 24px; z-index: 200;
}
.modal-box {
  background: oklch(99.3% 0.002 75); border-radius: 14px;
  width: 100%; max-width: 480px; max-height: 90vh; overflow-y: auto;
  padding: 28px 28px 24px;
  box-shadow: 0 20px 60px oklch(20% 0.02 75 / 0.25);
}
.modal-box-sm { max-width: 420px; }

.btn-close {
  width: 32px; height: 32px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  background: none; border: none; border-radius: 6px; cursor: pointer; color: oklch(40% 0.01 75);
}
.btn-close:hover { background: oklch(93% 0.006 75); }
.btn-close:focus-visible { outline: 2px solid oklch(52% 0.16 250); outline-offset: 2px; }

/* Form elements */
.form-input {
  width: 100%; box-sizing: border-box; padding: 10px 12px;
  font-size: 15px; border: 1px solid oklch(80% 0.01 75);
  border-radius: 8px; font-family: inherit;
}
.form-input:focus-visible {
  outline: 2px solid oklch(52% 0.16 250); outline-offset: 1px;
  border-color: oklch(52% 0.16 250);
}
.form-input-error { border-color: oklch(55% 0.14 25); }

.btn-swatch {
  width: 34px; height: 34px; border-radius: 999px;
  border: none; cursor: pointer;
  transition: box-shadow 0.15s;
}
.btn-swatch:focus-visible { outline: 2px solid oklch(52% 0.16 250); outline-offset: 2px; }

.btn-layout {
  flex: 1; text-align: left; padding: 10px 12px; border-radius: 8px; cursor: pointer;
  font-size: 13px; font-weight: 600; color: oklch(20% 0.01 75);
  border-width: 1.5px; border-style: solid;
  transition: background 0.15s, border-color 0.15s;
}
.btn-layout:focus-visible { outline: 2px solid oklch(52% 0.16 250); outline-offset: 2px; }

.btn-cancel {
  padding: 10px 18px; font-size: 14px; font-weight: 600;
  border-radius: 8px; border: 1px solid oklch(82% 0.008 75);
  background: none; cursor: pointer;
}
.btn-cancel:hover { background: oklch(94% 0.006 75); }
.btn-cancel:focus-visible { outline: 2px solid oklch(52% 0.16 250); outline-offset: 2px; }

.btn-submit {
  padding: 10px 20px; font-size: 14px; font-weight: 600;
  border-radius: 8px; border: none;
  background: oklch(20% 0.015 75); color: oklch(98% 0.004 75); cursor: pointer;
}
.btn-submit:hover { background: oklch(28% 0.02 75); }
.btn-submit:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-submit:focus-visible { outline: 2px solid oklch(52% 0.16 250); outline-offset: 2px; }

.btn-delete {
  padding: 10px 18px; font-size: 14px; font-weight: 600;
  border-radius: 8px; border: none;
  background: oklch(45% 0.14 25); color: white; cursor: pointer;
}
.btn-delete:hover { background: oklch(38% 0.14 25); }
.btn-delete:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-delete:focus-visible { outline: 2px solid oklch(52% 0.16 250); outline-offset: 2px; }
</style>
