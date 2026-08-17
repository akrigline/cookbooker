import { defineStore } from 'pinia'
import * as db from '../js/db'
import { useProjectsStore } from './projects'
import { useSettingsStore } from './settings'
import { measureRecipeFit } from '../js/recipeFitMeasure'

export const useRecipesStore = defineStore('recipes', {
  state: () => ({
    recipes: [],
    loaded: false,
  }),
  actions: {
    async load() {
      this.recipes = await db.getAllRecipes()
      this.loaded = true
    },
    async createRecipe(recipe) {
      const id = await db.addRecipe(recipe)
      const newRecipe = { fitsOnPage: null, ...recipe, id }
      this.recipes.push(newRecipe)
      this.triggerFitMeasurement(id, newRecipe)
      return id
    },
    async editRecipe(id, changes) {
      await db.updateRecipe(id, changes)
      const recipe = this.recipes.find((r) => r.id === id)
      if (recipe) Object.assign(recipe, changes)
      this.triggerFitMeasurement(id, recipe)
    },
    async bulkEditRecipes(ids, changes) {
      await db.bulkUpdateRecipes(ids, changes)
      for (const id of ids) {
        const recipe = this.recipes.find((r) => r.id === id)
        if (recipe) Object.assign(recipe, changes)
      }
      for (const id of ids) {
        this.triggerFitMeasurement(id, this.recipes.find((r) => r.id === id))
      }
    },
    patchRecipe(id, changes) {
      const recipe = this.recipes.find((r) => r.id === id)
      if (recipe) Object.assign(recipe, changes)
    },
    // Fire-and-forget: never awaited by callers, so a slow/failed measurement
    // never blocks the create/edit flow that triggered it. `fits === null`
    // means measurement itself errored (see recipeFitMeasure.js), in which
    // case fitsOnPage is left as whatever it already was rather than persisted.
    triggerFitMeasurement(id, recipe) {
      if (!recipe) return
      const paperSize = useSettingsStore().pageSize
      measureRecipeFit(recipe, { paperSize })
        .then((fits) => {
          if (fits === null) return
          return db.updateRecipe(id, { fitsOnPage: fits }).then(() => this.patchRecipe(id, { fitsOnPage: fits }))
        })
        // Best-effort background check: a race where the recipe was deleted
        // (or otherwise no longer exists) before measurement resolves must
        // not surface as an unhandled rejection.
        .catch(() => {})
    },
    // Fire-and-forget per recipe (same contract as triggerFitMeasurement) so
    // the Settings paper-size toggle completes immediately - badges update as
    // each measurement resolves rather than blocking on all of them.
    remeasureAllFits() {
      for (const recipe of this.recipes) this.triggerFitMeasurement(recipe.id, recipe)
    },
    /**
     * Persists a parsed `cookbook/1` import as a brand-new cookbook (see
     * cookbookImport.js's parseCookbookImportHtml). Mirrors every row
     * db.importCookbook actually wrote - the project/chapters/placements into
     * the projects store, the recipes here - rather than recomputing any of
     * it, per CLAUDE.md's store/db.js invariant. Triggers the usual
     * fire-and-forget fit measurement for each newly created recipe, the same
     * mechanism createRecipe/bulk recipe-import already use.
     */
    async importCookbook(data) {
      const { project, chapters, recipes, placements } = await db.importCookbook(data)
      useProjectsStore().mirrorImportedCookbook({ project, chapters, placements })
      this.recipes.push(...recipes)
      for (const recipe of recipes) this.triggerFitMeasurement(recipe.id, recipe)
      return { project, recipes }
    },
    async removeRecipe(id) {
      // db.deleteRecipe cascades to project_recipes inside its transaction;
      // without the matching in-memory prune the projects store keeps rows
      // pointing at a deleted recipe until the next load(), which quietly
      // inflates the counts sequence assignment is computed from.
      await db.deleteRecipe(id)
      this.recipes = this.recipes.filter((r) => r.id !== id)
      useProjectsStore().pruneRecipeAssociations(id)
    },
  },
})
