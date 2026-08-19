import { beforeEach, describe, expect, it } from 'vitest'
import 'fake-indexeddb/auto'
import { createPinia, setActivePinia } from 'pinia'
import { useRecipesStore } from './recipes.js'
import { useProjectsStore } from './projects.js'
import { getAllRecipes, getProjectRecipes, getRecipe } from '../js/db.js'

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
    layoutTemplate: 'hero-split-balanced',
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

  it('toggleFavorite flips false/undefined to true, persisted and mirrored', async () => {
    const store = useRecipesStore()
    const id = await store.createRecipe(makeRecipe({ title: 'Unfavorited' }))

    await store.toggleFavorite(id)

    expect(store.recipes.find((r) => r.id === id).favorite).toBe(true)
    expect((await getRecipe(id)).favorite).toBe(true)
  })

  it('toggleFavorite flips true back to false', async () => {
    const store = useRecipesStore()
    const id = await store.createRecipe(makeRecipe({ title: 'Favorited', favorite: true }))

    await store.toggleFavorite(id)

    expect(store.recipes.find((r) => r.id === id).favorite).toBe(false)
    expect((await getRecipe(id)).favorite).toBe(false)
  })

  it('removeRecipe deletes from the DB and removes from state', async () => {
    const store = useRecipesStore()
    const id = await store.createRecipe(makeRecipe({ title: 'To Delete' }))

    await store.removeRecipe(id)

    expect(store.recipes.find((r) => r.id === id)).toBeUndefined()
    expect(await getRecipe(id)).toBeUndefined()
  })

  it('importCookbook mirrors the project/chapters/placements into the projects store and recipes here', async () => {
    const recipesStore = useRecipesStore()
    const projectsStore = useProjectsStore()
    await projectsStore.load()

    const { project, recipes } = await recipesStore.importCookbook({
      title: 'Imported',
      chapters: [
        { name: 'Desserts', sequence: 0, recipes: [makeRecipe({ title: 'Cake' })] },
      ],
    })

    expect(projectsStore.projects.find((p) => p.id === project.id)).toBeDefined()
    expect(projectsStore.chaptersForProject(project.id)).toHaveLength(1)
    expect(projectsStore.projectRecipesForProject(project.id)).toHaveLength(1)
    expect(recipesStore.recipes.find((r) => r.id === recipes[0].id)).toMatchObject({ title: 'Cake' })
  })

  it('removeRecipe cascades to the projects store, mirroring the DB cascade', async () => {
    // db.deleteRecipe deletes the recipe's project_recipes rows in the same
    // transaction. Without the matching in-memory prune, projectsStore kept
    // associations pointing at a deleted recipe until the next load() - and
    // those ghost rows were counted when deriving new sequences.
    const recipesStore = useRecipesStore()
    const projectsStore = useProjectsStore()
    await projectsStore.load()

    const projectId = await projectsStore.createProject({ title: 'Cascade' })
    const id = await recipesStore.createRecipe(makeRecipe({ title: 'Doomed' }))
    await projectsStore.addRecipeToProject(projectId, id)
    expect(projectsStore.projectRecipesForProject(projectId)).toHaveLength(1)

    await recipesStore.removeRecipe(id)

    expect(projectsStore.projectRecipesForProject(projectId)).toHaveLength(0)
    expect(await getProjectRecipes(projectId)).toHaveLength(0)
  })
})
