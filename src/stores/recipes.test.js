import { beforeEach, describe, expect, it } from 'vitest'
import 'fake-indexeddb/auto'
import { createPinia, setActivePinia } from 'pinia'
import { useRecipesStore } from './recipes.js'
import { getAllRecipes, getRecipe } from '../js/db.js'

beforeEach(() => {
  setActivePinia(createPinia())
})

function makeRecipe(overrides = {}) {
  return {
    title: 'Test Recipe',
    instructions: 'Mix and bake.',
    ingredients: [],
    image: null,
    notes: '',
    layoutTemplate: 'standard',
    ...overrides,
  }
}

describe('recipes store', () => {
  it('load populates recipes from the database', async () => {
    const store = useRecipesStore()
    expect(store.loaded).toBe(false)

    await store.load()

    expect(store.loaded).toBe(true)
    expect(store.recipes).toEqual(await getAllRecipes())
  })

  it('createRecipe persists to the DB and appends to state with the new id', async () => {
    const store = useRecipesStore()

    const id = await store.createRecipe(makeRecipe({ title: 'New Recipe' }))

    expect(store.recipes.find((r) => r.id === id)).toMatchObject({ title: 'New Recipe' })
    const fromDb = await getRecipe(id)
    expect(fromDb.title).toBe('New Recipe')
  })

  it('editRecipe updates both the DB and in-memory state', async () => {
    const store = useRecipesStore()
    const id = await store.createRecipe(makeRecipe({ title: 'Original' }))

    await store.editRecipe(id, { title: 'Updated' })

    expect(store.recipes.find((r) => r.id === id).title).toBe('Updated')
    const fromDb = await getRecipe(id)
    expect(fromDb.title).toBe('Updated')
  })

  it('removeRecipe deletes from the DB and removes from state', async () => {
    const store = useRecipesStore()
    const id = await store.createRecipe(makeRecipe({ title: 'To Delete' }))

    await store.removeRecipe(id)

    expect(store.recipes.find((r) => r.id === id)).toBeUndefined()
    expect(await getRecipe(id)).toBeUndefined()
  })
})
