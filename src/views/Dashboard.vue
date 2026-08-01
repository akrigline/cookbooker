<script setup>
import { onMounted, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useProjectsStore } from '../stores/projects'

const projectsStore = useProjectsStore()
const router = useRouter()
const newProjectTitle = ref('')
const newProjectSubtitle = ref('')
const newProjectAccentId = ref('terracotta')
const newProjectLayoutId = ref('classic')
const creating = ref(false)
const deletingId = ref(null)

const showFormModal = ref(false)

const projectCountLabel = computed(() => {
  const len = projectsStore.projects.length
  return `${len} cookbook${len === 1 ? '' : 's'}`
})

onMounted(() => {
  if (!projectsStore.loaded) projectsStore.load()
})

function openCreate() {
  newProjectTitle.value = ''
  newProjectSubtitle.value = ''
  showFormModal.value = true
}

function closeModal() {
  showFormModal.value = false
}

async function createProject() {
  const title = newProjectTitle.value.trim()
  if (!title || creating.value) return
  creating.value = true
  try {
    const id = await projectsStore.createProject({ 
      title,
      subtitle: newProjectSubtitle.value.trim(),
      accentColor: newProjectAccentId.value === 'terracotta' ? 'oklch(62% 0.13 35)' : 'oklch(62% 0.13 35)' // Simplification
    })
    closeModal()
    router.push(`/projects/${id}`)
  } finally {
    creating.value = false
  }
}

async function deleteProject(project) {
  if (deletingId.value) return
  if (!confirm(`Delete "${project.title}"? Recipes stay in the Global Recipe Library.`)) return
  deletingId.value = project.id
  try {
    await projectsStore.removeProject(project.id)
  } finally {
    deletingId.value = null
  }
}
</script>

<template>
  <main id="cm-main" style="max-width:1160px; margin:0 auto; padding:40px 32px 80px;">
    <div style="display:flex; align-items:flex-end; justify-content:space-between; gap:16px; margin-bottom:32px; flex-wrap:wrap;">
      <div>
        <h1 style="font-family:'Newsreader',Georgia,serif; font-size:34px; font-weight:600; margin:0 0 6px; letter-spacing:-0.01em;">Cookbooks</h1>
        <p style="margin:0; font-size:15px; color:oklch(45% 0.01 75);">{{ projectCountLabel }}</p>
      </div>
      <button type="button" @click="openCreate" class="btn-new" :disabled="creating">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
        New Cookbook
      </button>
    </div>

    <div v-if="projectsStore.projects.length" role="list" aria-label="Cookbook projects" style="display:grid; grid-template-columns:repeat(auto-fill, minmax(300px, 1fr)); gap:24px;">
      <article v-for="project in projectsStore.projects" :key="project.id" role="listitem" :aria-labelledby="`cm-title-${project.id}`" style="background:oklch(99.2% 0.002 75); border:1px solid oklch(88% 0.008 75); border-radius:14px; overflow:hidden; display:flex; flex-direction:column;">
        <div style="position:relative; min-height:156px; background:oklch(99% 0.002 75);">
          <!-- Classic layout -->
          <div style="height:100%; box-sizing:border-box; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding:24px 20px; gap:9px;">
            <div aria-hidden="true" :style="{ width:'34px', height:'2px', background: project.accentColor || 'var(--accent-color)' }"></div>
            <h2 :id="`cm-title-${project.id}`" style="font-family:'Newsreader',Georgia,serif; font-size:21px; font-weight:600; margin:0; letter-spacing:-0.01em; overflow-wrap:break-word;">{{ project.title || 'Untitled Cookbook' }}</h2>
            <p v-if="project.subtitle" style="margin:0; font-size:13px; font-style:italic; color:oklch(45% 0.01 75);">{{ project.subtitle }}</p>
            <div aria-hidden="true" :style="{ width:'34px', height:'2px', background: project.accentColor || 'var(--accent-color)' }"></div>
          </div>
        </div>

        <div style="padding:14px 22px 20px; display:flex; align-items:center; gap:10px; border-top:1px solid oklch(90% 0.008 75);">
          <router-link :to="`/projects/${project.id}`" class="btn-open">
            Open cookbook
          </router-link>
          <router-link :to="`/projects/${project.id}/print`" class="btn-icon" aria-label="Print Preview">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg>
          </router-link>
          <button type="button" :aria-label="`Delete ${project.title}`" @click="deleteProject(project)" class="btn-icon-danger" :disabled="deletingId === project.id">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
          </button>
        </div>
      </article>
    </div>

    <div v-else style="border:1px dashed oklch(80% 0.01 75); border-radius:14px; padding:64px 32px; text-align:center; background:oklch(99% 0.003 75);">
      <p style="font-family:'Newsreader',Georgia,serif; font-size:22px; font-weight:600; margin:0 0 8px;">No cookbooks yet</p>
      <p style="margin:0 0 20px; font-size:15px; color:oklch(45% 0.01 75);">Create your first cookbook project to start organizing recipes into chapters.</p>
      <button type="button" @click="openCreate" class="btn-new">
        New Cookbook
      </button>
    </div>
  </main>

  <div v-if="showFormModal" @click="closeModal" style="position:fixed; inset:0; background:oklch(20% 0.01 75 / 0.45); display:flex; align-items:center; justify-content:center; padding:24px; z-index:200;">
    <div role="dialog" aria-modal="true" aria-labelledby="cm-form-heading" @click.stop style="background:oklch(99.3% 0.002 75); border-radius:14px; width:100%; max-width:480px; max-height:90vh; overflow-y:auto; padding:28px 28px 24px; box-shadow:0 20px 60px oklch(20% 0.02 75 / 0.25);">
      <div style="display:flex; align-items:flex-start; justify-content:space-between; gap:16px; margin-bottom:20px;">
        <h2 id="cm-form-heading" style="font-family:'Newsreader',Georgia,serif; font-size:22px; font-weight:600; margin:0;">New cookbook</h2>
        <button type="button" aria-label="Close dialog" @click="closeModal" class="btn-close">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
      </div>

      <form @submit.prevent="createProject">
        <div style="display:flex; flex-direction:column; gap:16px;">
          <div>
            <label for="cm-field-title" style="display:block; font-size:13px; font-weight:600; margin-bottom:6px;">Title <span aria-hidden="true" style="color:oklch(45% 0.05 25);">*</span></label>
            <input id="cm-field-title" v-model="newProjectTitle" type="text" required class="form-input" />
          </div>
          <div>
            <label for="cm-field-subtitle" style="display:block; font-size:13px; font-weight:600; margin-bottom:6px;">Subtitle</label>
            <input id="cm-field-subtitle" v-model="newProjectSubtitle" type="text" class="form-input" />
          </div>
        </div>

        <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:26px;">
          <button type="button" @click="closeModal" class="btn-cancel">Cancel</button>
          <button type="submit" class="btn-submit" :disabled="creating">Create cookbook</button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.btn-new {
  display:flex; align-items:center; gap:8px; background:oklch(20% 0.015 75); color:oklch(98% 0.004 75); border:none; border-radius:8px; padding:12px 20px; font-size:15px; font-weight:600; cursor:pointer;
}
.btn-new:hover { background:oklch(28% 0.02 75); }
.btn-new:focus-visible { outline:2px solid oklch(52% 0.16 250); outline-offset:2px; }
.btn-new:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-open {
  flex:1; background:oklch(94% 0.006 75); border:1px solid oklch(85% 0.008 75); border-radius:8px; padding:10px 14px; font-size:14px; font-weight:600; cursor:pointer; color:oklch(18% 0.01 75); text-align:center; text-decoration:none;
}
.btn-open:hover { background:oklch(90% 0.008 75); }
.btn-open:focus-visible { outline:2px solid oklch(52% 0.16 250); outline-offset:2px; }

.btn-icon {
  width:40px; height:40px; flex-shrink:0; display:flex; align-items:center; justify-content:center; background:none; border:1px solid oklch(85% 0.008 75); border-radius:8px; cursor:pointer; color:oklch(30% 0.01 75);
}
.btn-icon:hover { background:oklch(94% 0.006 75); }
.btn-icon:focus-visible { outline:2px solid oklch(52% 0.16 250); outline-offset:2px; }

.btn-icon-danger {
  width:40px; height:40px; flex-shrink:0; display:flex; align-items:center; justify-content:center; background:none; border:1px solid oklch(85% 0.008 75); border-radius:8px; cursor:pointer; color:oklch(45% 0.05 25);
}
.btn-icon-danger:hover { background:oklch(94% 0.04 25); border-color:oklch(80% 0.06 25); }
.btn-icon-danger:focus-visible { outline:2px solid oklch(52% 0.16 250); outline-offset:2px; }
.btn-icon-danger:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-close {
  width:32px; height:32px; flex-shrink:0; display:flex; align-items:center; justify-content:center; background:none; border:none; border-radius:6px; cursor:pointer; color:oklch(40% 0.01 75);
}
.btn-close:hover { background:oklch(93% 0.006 75); }

.form-input {
  width:100%; box-sizing:border-box; padding:10px 12px; font-size:15px; border:1px solid oklch(80% 0.01 75); border-radius:8px; font-family:inherit;
}
.form-input:focus-visible { outline:2px solid oklch(52% 0.16 250); outline-offset:1px; border-color:oklch(52% 0.16 250); }

.btn-cancel {
  padding:10px 18px; font-size:14px; font-weight:600; border-radius:8px; border:1px solid oklch(82% 0.008 75); background:none; cursor:pointer;
}
.btn-cancel:hover { background:oklch(94% 0.006 75); }

.btn-submit {
  padding:10px 20px; font-size:14px; font-weight:600; border-radius:8px; border:none; background:oklch(20% 0.015 75); color:oklch(98% 0.004 75); cursor:pointer;
}
.btn-submit:hover { background:oklch(28% 0.02 75); }
.btn-submit:disabled { opacity: 0.5; cursor: not-allowed; }
</style>

