<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRecipesStore } from '../stores/recipes'
import RecipeThumbnail from '../components/RecipeThumbnail.vue'

const recipesStore = useRecipesStore()
const query = ref('')
const deletingId = ref(null)

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

async function confirmDelete(recipe) {
  if (!confirm(`Delete "${recipe.title}" permanently?`)) return
  deletingId.value = recipe.id
  try {
    if (recipesStore.removeRecipe) {
      await recipesStore.removeRecipe(recipe.id)
    } else if (recipesStore.deleteRecipe) {
      await recipesStore.deleteRecipe(recipe.id)
    }
  } finally {
    deletingId.value = null
  }
}
</script>

<template>
  <main id="cm-main" style="max-width:1280px; margin:0 auto; padding:40px 32px 80px;">
    <div style="display:flex; align-items:flex-end; justify-content:space-between; gap:16px; margin-bottom:28px; flex-wrap:wrap;">
      <div>
        <h1 style="font-family:'Newsreader',Georgia,serif; font-size:34px; font-weight:600; margin:0 0 6px; letter-spacing:-0.01em;">Recipe Library</h1>
        <p style="margin:0; font-size:15px; color:oklch(45% 0.01 75);">{{ resultCountLabel }}</p>
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
        <svg aria-hidden="true" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="oklch(50% 0.01 75)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="position:absolute; left:13px; top:50%; transform:translateY(-50%);"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
        <input id="cm-search" v-model="query" type="text" placeholder="Search by title or ingredient…" class="search-input" />
      </div>
    </div>

    <div v-if="filteredRecipes.length" role="list" aria-label="Recipes" style="background:oklch(99.2% 0.002 75); border:1px solid oklch(88% 0.008 75); border-radius:14px; overflow:hidden;">
      <article v-for="recipe in filteredRecipes" :key="recipe.id" role="listitem" :aria-labelledby="`cm-rtitle-${recipe.id}`" style="display:flex; align-items:flex-start; gap:16px; padding:16px 20px; border-bottom:1px solid oklch(90% 0.008 75);">
        
        <div class="recipe-thumb">
          <RecipeThumbnail :image="recipe.image" />
        </div>

        <div style="flex:1; min-width:0; display:flex; flex-direction:column; gap:4px;">
          <h2 :id="`cm-rtitle-${recipe.id}`" :title="recipe.title" style="font-family:'Newsreader',Georgia,serif; font-size:17px; font-weight:600; margin:0; letter-spacing:-0.01em; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:100%;">{{ recipe.title }}</h2>
          <p :title="getIngredientSummary(recipe)" style="margin:0; font-size:13px; color:oklch(45% 0.01 75); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:100%;">{{ getIngredientPreview(recipe) }}</p>
        </div>

        <div style="display:flex; gap:8px; flex-shrink:0; align-self:center;">
          <router-link :to="`/library/${recipe.id}`" class="btn-open">
            Open recipe
          </router-link>
          <button type="button" :aria-label="`Delete ${recipe.title}`" @click="confirmDelete(recipe)" class="btn-icon-danger" :disabled="deletingId === recipe.id">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
          </button>
        </div>
      </article>
    </div>

    <div v-else style="border:1px dashed oklch(80% 0.01 75); border-radius:14px; padding:64px 32px; text-align:center; background:oklch(99% 0.003 75);">
      <p style="font-family:'Newsreader',Georgia,serif; font-size:22px; font-weight:600; margin:0 0 8px;">{{ recipesStore.recipes.length ? 'No matching recipes' : 'No recipes yet' }}</p>
      <p style="margin:0 0 20px; font-size:15px; color:oklch(45% 0.01 75);">{{ recipesStore.recipes.length ? `Nothing matches "${query}". Try a different title or ingredient.` : 'Add your first recipe or import recipes to start building your library.' }}</p>
      <router-link v-if="!recipesStore.recipes.length" to="/library/new" class="btn-new" style="display:inline-flex;">
        New Recipe
      </router-link>
    </div>
  </main>
</template>

<style scoped>
.btn-import {
  display:flex; align-items:center; gap:8px; background:none; color:oklch(20% 0.015 75); border:1px solid oklch(82% 0.008 75); border-radius:8px; padding:12px 18px; font-size:15px; font-weight:600; cursor:pointer; text-decoration:none;
}
.btn-import:hover { background:oklch(94% 0.006 75); }
.btn-import:focus-visible { outline:2px solid oklch(52% 0.16 250); outline-offset:2px; }

.btn-new {
  display:flex; align-items:center; gap:8px; background:oklch(20% 0.015 75); color:oklch(98% 0.004 75); border:none; border-radius:8px; padding:12px 20px; font-size:15px; font-weight:600; cursor:pointer; text-decoration:none;
}
.btn-new:hover { background:oklch(28% 0.02 75); }
.btn-new:focus-visible { outline:2px solid oklch(52% 0.16 250); outline-offset:2px; }

.search-input {
  width:100%; box-sizing:border-box; padding:11px 14px 11px 38px; font-size:15px; border:1px solid oklch(82% 0.008 75); border-radius:8px; font-family:inherit; background:oklch(99.3% 0.002 75);
}
.search-input:focus-visible { outline:2px solid oklch(52% 0.16 250); outline-offset:1px; border-color:oklch(52% 0.16 250); }

.recipe-thumb {
  width:52px; height:52px; flex-shrink:0; border-radius:8px; overflow:hidden; border:1px solid oklch(85% 0.02 250);
}

.btn-open {
  background:oklch(94% 0.006 75); border:1px solid oklch(85% 0.008 75); border-radius:7px; padding:8px 14px; font-size:13px; font-weight:600; cursor:pointer; color:oklch(18% 0.01 75); white-space:nowrap; text-decoration:none; display:inline-block;
}
.btn-open:hover { background:oklch(90% 0.008 75); }
.btn-open:focus-visible { outline:2px solid oklch(52% 0.16 250); outline-offset:2px; }

.btn-icon-danger {
  width:36px; height:36px; flex-shrink:0; display:flex; align-items:center; justify-content:center; background:none; border:1px solid oklch(85% 0.008 75); border-radius:7px; cursor:pointer; color:oklch(45% 0.05 25);
}
.btn-icon-danger:hover { background:oklch(94% 0.04 25); border-color:oklch(80% 0.06 25); }
.btn-icon-danger:focus-visible { outline:2px solid oklch(52% 0.16 250); outline-offset:2px; }
.btn-icon-danger:disabled { opacity:0.5; cursor:not-allowed; }
</style>
