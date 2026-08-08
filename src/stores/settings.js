import { defineStore } from 'pinia'
import * as db from '../js/db'
import { DEFAULT_INGREDIENT_QTY_ALIGN } from '../js/templates'

export const useSettingsStore = defineStore('settings', {
  // loadPromise lives in state, not module scope: Pinia creates a fresh store
  // (and fresh state) per `createPinia()`, e.g. once per test file's
  // `beforeEach`, but a module-level variable would survive across those
  // instances and memoize against a store nothing still references. Vue's
  // reactive() doesn't proxy Promise instances (they're not in its
  // plain-object/array/collection target-type map), so storing one here
  // doesn't break its `.then` chain.
  state: () => ({
    ingredientQtyAlign: DEFAULT_INGREDIENT_QTY_ALIGN,
    loaded: false,
    loadPromise: null,
  }),
  actions: {
    // Memoized so any caller can `await` it without an `if (!loaded)` dance
    // and without triggering a duplicate read from concurrent callers. Clears
    // the memo on rejection - otherwise a transient getSettings() failure
    // (e.g. a blocked IndexedDB connection) caches the rejected promise
    // permanently, and every future load() call replays the same failure
    // with no way to recover except reload().
    load() {
      if (!this.loadPromise) {
        this.loadPromise = db.getSettings().then((settings) => {
          this.ingredientQtyAlign = settings.ingredientQtyAlign
          this.loaded = true
        }).catch((err) => {
          this.loadPromise = null
          throw err
        })
      }
      return this.loadPromise
    },
    // For callers that need a genuinely fresh read after the underlying data
    // changed out from under the memo - e.g. a database restore - rather than
    // load()'s already-resolved promise.
    reload() {
      this.loadPromise = null
      return this.load()
    },
    async setIngredientQtyAlign(value) {
      const row = await db.updateSettings({ ingredientQtyAlign: value })
      this.ingredientQtyAlign = row.ingredientQtyAlign
    },
  },
})
