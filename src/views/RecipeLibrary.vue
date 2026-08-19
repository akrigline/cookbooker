<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useRecipesStore } from '../stores/recipes'
import RecipeThumbnail from '../components/RecipeThumbnail.vue'
import RecipeFitWarningBadge from '../components/RecipeFitWarningBadge.vue'
import FavoriteToggle from '../components/FavoriteToggle.vue'

const router = useRouter()
const recipesStore = useRecipesStore()
const query = ref('')
const deletingId = ref(null)
const deleteTarget = ref(null)

onMounted(() => {
  if (!recipesStore.loaded) recipesStore.load()
})

function matches(recipe, needle) {
  if (recipe.title?.toLowerCase().includes(needle)) return true
  return (recipe.ingredients ?? []).some((ing) =>
    (ing.ingredient ?? '').toLowerCase().includes(needle),
  )
}

const filteredRecipes = computed(() => {
  const needle = query.value.trim().toLowerCase()
  if (!needle) return recipesStore.recipes
  return recipesStore.recipes.filter((r) => matches(r, needle))
})

const resultCountLabel = computed(() => {
  if (query.value.trim()) {
    return `${filteredRecipes.value.length} of ${recipesStore.recipes.length} recipes`
  }
  return `${recipesStore.recipes.length} recipe${recipesStore.recipes.length === 1 ? '' : 's'}`
})

function getIngredientSummary(recipe) {
  return (recipe.ingredients ?? []).map(i => i.ingredient).join(', ')
}

function getIngredientPreview(recipe) {
  const ings = (recipe.ingredients ?? []).map(i => i.ingredient)
  if (ings.length > 6) {
    return `${ings.slice(0, 6).join(', ')} +${ings.length - 6} more`
  }
  return ings.join(', ')
}

function openRecipe(recipe) {
  router.push(`/library/${recipe.id}`)
}

function requestDelete(recipe) {
  deleteTarget.value = recipe
}

async function confirmDelete() {
  const recipe = deleteTarget.value
  if (!recipe) return
  deletingId.value = recipe.id
  try {
    if (recipesStore.removeRecipe) {
      await recipesStore.removeRecipe(recipe.id)
    } else if (recipesStore.deleteRecipe) {
      await recipesStore.deleteRecipe(recipe.id)
    }
  } finally {
    deletingId.value = null
    deleteTarget.value = null
  }
}
</script>

<template>
  <main id="cm-main" class="cm-page-main">
    <div style="display:flex; align-items:flex-end; justify-content:space-between; gap:16px; margin-bottom:28px; flex-wrap:wrap;">
      <div>
        <h1 class="text-page-title">Recipe Library</h1>
        <p class="text-subtitle" style="margin:0;">{{ resultCountLabel }}</p>
      </div>
      <div style="display:flex; gap:10px; flex-wrap:wrap;">
        <router-link to="/library/import" class="btn-import">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/></svg>
          Import Recipes
        </router-link>
        <router-link to="/library/new" class="btn-new">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
          New Recipe
        </router-link>
      </div>
    </div>

    <div style="margin-bottom:28px;">
      <label for="cm-search" style="position:absolute; width:1px; height:1px; overflow:hidden; clip:rect(0 0 0 0);">Search recipes by title or ingredient</label>
      <div style="position:relative; max-width:420px;">
        <svg aria-hidden="true" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--ink-52)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="position:absolute; left:13px; top:50%; transform:translateY(-50%);"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
        <input id="cm-search" v-model="query" type="text" placeholder="Search by title or ingredient…" class="search-input" />
      </div>
    </div>

    <div v-if="filteredRecipes.length" role="list" aria-label="Recipes" style="background:var(--ink-99); border:1px solid var(--ink-88); border-radius:14px; overflow:hidden;">
      <article
        v-for="recipe in filteredRecipes"
        :key="recipe.id"
        role="listitem"
        tabindex="0"
        :aria-labelledby="`cm-rtitle-${recipe.id}`"
        class="recipe-row"
        style="display:flex; align-items:flex-start; gap:16px; padding:16px 20px; border-bottom:1px solid var(--ink-88); cursor:pointer;"
        @click="openRecipe(recipe)"
        @keydown.enter="openRecipe(recipe)"
      >
        <div class="recipe-thumb">
          <RecipeThumbnail :image="recipe.image" :title="recipe.title" />
        </div>

        <div style="flex:1; min-width:0; display:flex; flex-direction:column; gap:4px;">
          <h2 :id="`cm-rtitle-${recipe.id}`" :title="recipe.title" class="text-item-title" style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:100%; display:flex; align-items:center; gap:6px;">
            <span style="overflow:hidden; text-overflow:ellipsis;">{{ recipe.title }}</span>
            <RecipeFitWarningBadge v-if="recipe.fitsOnPage === false" />
          </h2>
          <p :title="getIngredientSummary(recipe)" style="margin:0; font-size:13px; color:var(--ink-46); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:100%;">{{ getIngredientPreview(recipe) }}</p>
        </div>

        <div style="display:flex; gap:8px; flex-shrink:0; align-self:center; align-items:center;" @click.stop>
          <FavoriteToggle :favorite="!!recipe.favorite" @toggle="recipesStore.toggleFavorite(recipe.id)" />
          <router-link :to="`/library/${recipe.id}`" class="btn-open">
            Open recipe
          </router-link>
          <button type="button" :aria-label="`Delete ${recipe.title}`" @click="requestDelete(recipe)" class="btn-icon-danger" :disabled="deletingId === recipe.id">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
          </button>
        </div>
      </article>
    </div>

    <div v-else style="border:1px dashed var(--ink-80); border-radius:14px; padding:64px 32px; text-align:center; background:var(--ink-99);">
      <p style="font-family:'Newsreader',Georgia,serif; font-size:22px; font-weight:600; margin:0 0 8px;">{{ recipesStore.recipes.length ? 'No matching recipes' : 'No recipes yet' }}</p>
      <p class="text-subtitle" style="margin:0 0 20px;">{{ recipesStore.recipes.length ? `Nothing matches "${query}". Try a different title or ingredient.` : 'Add your first recipe or import recipes to start building your library.' }}</p>
      <router-link v-if="!recipesStore.recipes.length" to="/library/new" class="btn-new" style="display:inline-flex;">
        New Recipe
      </router-link>
    </div>

    <div v-if="deleteTarget" @click="deleteTarget = null" style="position:fixed; inset:0; background:oklch(10% 0.01 75 / 0.45); display:flex; align-items:center; justify-content:center; padding:24px; z-index:200;">
      <div role="alertdialog" aria-modal="true" aria-labelledby="cm-del-heading" aria-describedby="cm-del-desc" @click.stop style="background:var(--ink-99); border-radius:14px; width:100%; max-width:420px; padding:26px 26px 22px; box-shadow:0 20px 60px oklch(10% 0.01 75 / 0.25);">
        <h2 id="cm-del-heading" class="text-h2">Delete "{{ deleteTarget.title }}"?</h2>
        <p id="cm-del-desc" style="margin:0 0 22px; font-size:14px; color:var(--ink-42); line-height:1.5;">This permanently removes the recipe from the Global Recipe Library and withdraws it from every cookbook that includes it. This can't be undone.</p>
        <div style="display:flex; justify-content:flex-end; gap:10px;">
          <button type="button" @click="deleteTarget = null" style="padding:10px 20px; font-size:14px; font-weight:600; border-radius:8px; border:1px solid var(--ink-84); background:var(--ink-93); cursor:pointer;">Cancel</button>
          <button type="button" @click="confirmDelete" :disabled="deletingId === deleteTarget.id" style="padding:10px 20px; font-size:14px; font-weight:600; border-radius:8px; border:none; background:var(--color-danger); color:white; cursor:pointer;">Delete permanently</button>
        </div>
      </div>
    </div>
  </main>
</template>

<style scoped>
.btn-import {
  display:flex; align-items:center; gap:8px; background:var(--ink-93); color:var(--ink-20); border:1px solid var(--ink-84); border-radius:8px; padding:12px 18px; font-size:15px; font-weight:600; cursor:pointer; text-decoration:none;
}
.btn-import:hover { background:var(--ink-88); }
.btn-import:focus-visible { outline:2px solid var(--color-focus); outline-offset:2px; }

.btn-new {
  display:flex; align-items:center; gap:8px; background:var(--ink-20); color:var(--ink-99); border:none; border-radius:8px; padding:12px 20px; font-size:15px; font-weight:600; cursor:pointer; text-decoration:none;
}
.btn-new:hover { background:var(--ink-30); }
.btn-new:focus-visible { outline:2px solid var(--color-focus); outline-offset:2px; }

.search-input {
  width:100%; box-sizing:border-box; padding:11px 14px 11px 38px; font-size:15px; border:1px solid var(--ink-84); border-radius:8px; font-family:inherit; background:var(--ink-99);
}
.search-input:focus-visible { outline:2px solid var(--color-focus); outline-offset:1px; border-color:var(--color-focus); }

.recipe-row:hover {
  background:var(--ink-96);
}
.recipe-row:focus-visible {
  outline:2px solid var(--color-focus); outline-offset:-2px;
}

.recipe-thumb {
  width:52px; height:52px; flex-shrink:0; border-radius:8px; overflow:hidden; border:1px solid oklch(85% 0.02 250);
}

.btn-open {
  background:var(--ink-93); border:1px solid var(--ink-84); border-radius:7px; padding:8px 14px; font-size:13px; font-weight:600; cursor:pointer; color:var(--ink-20); white-space:nowrap; text-decoration:none; display:inline-block;
}
.btn-open:hover { background:var(--ink-88); }
.btn-open:focus-visible { outline:2px solid var(--color-focus); outline-offset:2px; }

.btn-icon-danger {
  width:36px; height:36px; flex-shrink:0; display:flex; align-items:center; justify-content:center; background:none; border:1px solid var(--ink-84); border-radius:7px; cursor:pointer; color:oklch(45% 0.05 25);
}
.btn-icon-danger:hover { background:oklch(94% 0.04 25); border-color:oklch(80% 0.06 25); }
.btn-icon-danger:focus-visible { outline:2px solid var(--color-focus); outline-offset:2px; }
.btn-icon-danger:disabled { opacity:0.5; cursor:not-allowed; }
</style>
