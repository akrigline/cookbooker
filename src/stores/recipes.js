import { defineStore } from 'pinia'
import * as db from '../js/db'
import { useProjectsStore } from './projects'

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
      this.recipes.push({ ...recipe, id })
      return id
    },
    async editRecipe(id, changes) {
      await db.updateRecipe(id, changes)
      const recipe = this.recipes.find((r) => r.id === id)
      if (recipe) Object.assign(recipe, changes)
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
