import { defineStore } from 'pinia'
import * as db from '../js/db'
import { useProjectsStore } from './projects'
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
      measureRecipeFit(recipe)
        .then((fits) => {
          if (fits === null) return
          return db.updateRecipe(id, { fitsOnPage: fits }).then(() => this.patchRecipe(id, { fitsOnPage: fits }))
        })
        // Best-effort background check: a race where the recipe was deleted
        // (or otherwise no longer exists) before measurement resolves must
        // not surface as an unhandled rejection.
        .catch(() => {})
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
