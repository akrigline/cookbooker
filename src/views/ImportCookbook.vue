<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useRecipesStore } from '../stores/recipes'
import { parseCookbookImportHtml } from '../js/cookbookImport'
import BackButton from '../components/BackButton.vue'

const router = useRouter()
const recipesStore = useRecipesStore()

const error = ref(null)
const importing = ref(false)

async function handleFileChange(event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) return

  error.value = null

  let text
  try {
    text = await file.text()
  } catch (err) {
    error.value = `Could not read "${file.name}": ${err.message}`
    return
  }

  const { cookbook, failures, rejected } = parseCookbookImportHtml(text)
  if (rejected) {
    error.value = `"${file.name}" does not contain a cookbook/1 element.`
    return
  }

  importing.value = true
  try {
    const { project } = await recipesStore.importCookbook(cookbook)
    // One-shot payload for ProjectView.vue's post-import summary banner - same
    // history.state mechanism the cookbook-import-shortcut's autoSelectIds
    // already uses, since it's ephemeral data rather than a navigable location.
    // Capped: history.state has a real (browser-enforced) size limit, and
    // autoSelectIds' precedent was only ever exercised with short id arrays -
    // a hand-edited or corrupted file with hundreds of broken recipes
    // shouldn't be able to blow past that.
    const MAX_REPORTED_FAILURES = 200
    router.push({
      name: 'project',
      params: { projectId: String(project.id) },
      state: {
        importFailures: failures.slice(0, MAX_REPORTED_FAILURES),
        importFailuresTruncated: failures.length > MAX_REPORTED_FAILURES ? failures.length : undefined,
      },
    })
  } catch (err) {
    error.value = `Could not import this cookbook: ${err.message}`
  } finally {
    importing.value = false
  }
}
</script>

<template>
  <main id="cm-main" class="cm-page-main" style="max-width:720px; margin:0 auto; padding:40px 32px 80px;">
    <BackButton to="/">Cookbooks</BackButton>
    <h1 class="text-page-title" style="margin:0 0 8px;">Import Cookbook</h1>
    <p class="text-subtitle" style="margin:0 0 32px; line-height:1.5;">
      Select a cookbook/1 HTML file (downloaded via "Export Cookbook") to create a brand-new
      cookbook from it - chapters, recipes, and settings included. This never modifies an existing
      cookbook or recipe, even if a recipe looks identical to one already in your library.
    </p>

    <section aria-labelledby="cm-cookbook-file-heading" style="background:var(--ink-99); border:1px solid var(--ink-88); border-radius:14px; padding:24px;">
      <h2 id="cm-cookbook-file-heading" class="text-h2" style="margin:0 0 6px;">Select a file</h2>
      <p style="margin:0 0 16px; font-size:14px; color:var(--ink-46);">Choose the .html file downloaded via "Export Cookbook".</p>
      <label for="cm-cookbook-file-input" style="position:absolute; width:1px; height:1px; overflow:hidden; clip:rect(0 0 0 0);">Select cookbook HTML file</label>
      <input
        id="cm-cookbook-file-input"
        type="file"
        accept=".html,.htm,text/html"
        :disabled="importing"
        @change="handleFileChange"
        style="font-size:14px;"
      />
      <p v-if="importing" style="margin:14px 0 0; font-size:14px; color:var(--ink-46);" aria-live="polite">Importing…</p>
    </section>

    <p
      v-if="error"
      role="alert"
      style="margin:18px 0 0; font-size:14px; color:var(--color-danger); background:var(--color-danger-bg); border:1px solid var(--color-danger-border); border-radius:8px; padding:12px 16px;"
    >{{ error }}</p>
  </main>
</template>
