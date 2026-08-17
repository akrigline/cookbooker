import { describe, expect, it } from 'vitest'
import 'fake-indexeddb/auto'
import {
  MISC_CHAPTER_NAME,
  DuplicateRecipeError,
  RecordNotFoundError,
  RETIRED_RECIPE_FIELDS,
  createProject,
  getMiscChapter,
  addRecipe,
  getRecipe,
  addRecipeToProject,
  addRecipesToProject,
  deleteChapter,
  addChapter,
  getChaptersForProject,
  getProjectRecipes,
  moveProjectRecipe,
  moveProjectRecipesToChapter,
  removeProjectRecipes,
  resequenceProjectRecipes,
  swapChapterSequences,
  swapProjectRecipeSequences,
  updateChapter,
  updateProject,
  updateRecipe,
  promoteLegacyPlacement,
  db,
} from './db.js'
import { DEFAULT_PLACEMENT } from './templates.js'

// Each test creates its own project, so records stay scoped by projectId
// even though they share one fake-indexeddb database across the file.
//
// Regression coverage for a prior bug: `where({ projectId, isDefault: 1 })`
// silently matched nothing because `isDefault` isn't an indexed field and is
// stored as a real boolean, not the number 1.

describe('db.js chapter/recipe association', () => {
  it('finds the Miscellaneous chapter after project creation', async () => {
    const { projectId, miscChapterId } = await createProject({ title: 'Test' })
    const misc = await getMiscChapter(projectId)
    expect(misc).toBeDefined()
    expect(misc.id).toBe(miscChapterId)
    expect(misc.name).toBe(MISC_CHAPTER_NAME)
  })

  it('adding a recipe to a project without a chapter assigns it to Miscellaneous', async () => {
    const { projectId, miscChapterId } = await createProject({ title: 'Test' })
    const { id: prId, sequence } = await addRecipeToProject(projectId, 42)
    const rows = await getProjectRecipes(projectId)
    expect(rows).toHaveLength(1)
    expect(rows[0].id).toBe(prId)
    expect(rows[0].chapterId).toBe(miscChapterId)
    expect(sequence).toBe(0)
  })

  it('assigns an incrementing sequence for each recipe added to the same chapter', async () => {
    const { projectId } = await createProject({ title: 'Test' })
    const first = await addRecipeToProject(projectId, 1)
    const second = await addRecipeToProject(projectId, 2)
    expect(first.sequence).toBe(0)
    expect(second.sequence).toBe(1)
  })

  it('throws a clear error instead of an opaque Dexie crash when the project has no chapter', async () => {
    const projectId = await db.projects.add({ title: 'Chapterless' })
    await expect(addRecipeToProject(projectId, 1)).rejects.toThrow(/no chapter/i)
  })

  it('deleting a custom chapter reassigns its recipes to Miscellaneous', async () => {
    const { projectId, miscChapterId } = await createProject({ title: 'Test' })
    const { id: breakfastId } = await addChapter(projectId, 'Breakfast')
    await addRecipeToProject(projectId, 7, breakfastId)

    await deleteChapter(breakfastId)

    const rows = await getProjectRecipes(projectId)
    expect(rows).toHaveLength(1)
    expect(rows[0].chapterId).toBe(miscChapterId)
  })

  it('refuses to delete the Miscellaneous chapter', async () => {
    const { miscChapterId } = await createProject({ title: 'Test' })
    await expect(deleteChapter(miscChapterId)).rejects.toThrow()
  })

  it('throws RecordNotFoundError when the chapter to delete is already gone', async () => {
    await expect(deleteChapter(999999)).rejects.toBeInstanceOf(RecordNotFoundError)
  })

  it('refuses to add the same recipe to a project twice', async () => {
    const { projectId } = await createProject({ title: 'Test' })
    await addRecipeToProject(projectId, 55)

    await expect(addRecipeToProject(projectId, 55)).rejects.toBeInstanceOf(DuplicateRecipeError)
    expect(await getProjectRecipes(projectId)).toHaveLength(1)
  })

  it('allows the same recipe in two different projects', async () => {
    const a = await createProject({ title: 'A' })
    const b = await createProject({ title: 'B' })
    await addRecipeToProject(a.projectId, 77)
    await addRecipeToProject(b.projectId, 77)

    expect(await getProjectRecipes(a.projectId)).toHaveLength(1)
    expect(await getProjectRecipes(b.projectId)).toHaveLength(1)
  })
})

// `Table.update()` resolves with 0 rather than throwing when the key is gone,
// so an unguarded update reports success for a write that never happened.
describe('db.js update guards', () => {
  it('throws RecordNotFoundError instead of silently no-op-ing a missing row', async () => {
    await expect(updateRecipe(999999, { title: 'ghost' })).rejects.toBeInstanceOf(
      RecordNotFoundError,
    )
    await expect(updateProject(999999, { title: 'ghost' })).rejects.toBeInstanceOf(
      RecordNotFoundError,
    )
    await expect(updateChapter(999999, { name: 'ghost' })).rejects.toBeInstanceOf(
      RecordNotFoundError,
    )
    await expect(moveProjectRecipe(999999, { sequence: 3 })).rejects.toBeInstanceOf(
      RecordNotFoundError,
    )
  })

  it('still resolves for a row that does exist', async () => {
    const id = await db.recipes.add({ title: 'Real' })
    await expect(updateRecipe(id, { title: 'Renamed' })).resolves.toBe(1)
    expect((await db.recipes.get(id)).title).toBe('Renamed')
  })
})

describe('db.js sequence swaps', () => {
  it('swaps two chapter sequences and reports the persisted values', async () => {
    const { projectId } = await createProject({ title: 'Swap' })
    const { id: aId } = await addChapter(projectId, 'A')
    const { id: bId } = await addChapter(projectId, 'B')

    const result = await swapChapterSequences(aId, bId)

    const chapters = await getChaptersForProject(projectId)
    const seq = (id) => chapters.find((c) => c.id === id).sequence
    expect(seq(aId)).toBe(2)
    expect(seq(bId)).toBe(1)
    expect(result).toEqual([
      { id: aId, sequence: 2 },
      { id: bId, sequence: 1 },
    ])
  })

  it('leaves both rows untouched when one side of the swap is missing', async () => {
    const { projectId } = await createProject({ title: 'Swap Fail' })
    const { id: aId } = await addChapter(projectId, 'A')
    const before = (await getChaptersForProject(projectId)).find((c) => c.id === aId).sequence

    await expect(swapChapterSequences(aId, 999999)).rejects.toBeInstanceOf(RecordNotFoundError)

    const after = (await getChaptersForProject(projectId)).find((c) => c.id === aId).sequence
    expect(after).toBe(before)
  })

  it('swaps two recipe placements in one transaction', async () => {
    const { projectId } = await createProject({ title: 'Recipe Swap' })
    const { id: prA } = await addRecipeToProject(projectId, 1)
    const { id: prB } = await addRecipeToProject(projectId, 2)

    await swapProjectRecipeSequences(prA, prB)

    const rows = await getProjectRecipes(projectId)
    expect(rows.find((pr) => pr.id === prA).sequence).toBe(1)
    expect(rows.find((pr) => pr.id === prB).sequence).toBe(0)
  })
})

// The N-row equivalent of the two-row swaps above. Fanned out over
// `Promise.all`, a single stale row rejects the batch after other rows have
// already committed - a chapter left half-sorted, with no rollback and no
// message. Each of these is one transaction instead.
describe('db.js batch placement writes', () => {
  it('resequences placements to the given order and reports the persisted values', async () => {
    const { projectId } = await createProject({ title: 'Resequence' })
    const { id: a } = await addRecipeToProject(projectId, 1)
    const { id: b } = await addRecipeToProject(projectId, 2)
    const { id: c } = await addRecipeToProject(projectId, 3)

    const result = await resequenceProjectRecipes([c, a, b])

    expect(result).toEqual([
      { id: c, sequence: 0 },
      { id: a, sequence: 1 },
      { id: b, sequence: 2 },
    ])
    const rows = await getProjectRecipes(projectId)
    const seq = (id) => rows.find((pr) => pr.id === id).sequence
    expect([seq(c), seq(a), seq(b)]).toEqual([0, 1, 2])
  })

  it('leaves every sequence untouched when one row in the batch is missing', async () => {
    const { projectId } = await createProject({ title: 'Resequence Fail' })
    const { id: a } = await addRecipeToProject(projectId, 1)
    const { id: b } = await addRecipeToProject(projectId, 2)

    await expect(resequenceProjectRecipes([b, 999999, a])).rejects.toBeInstanceOf(
      RecordNotFoundError,
    )

    const rows = await getProjectRecipes(projectId)
    expect(rows.find((pr) => pr.id === a).sequence).toBe(0)
    expect(rows.find((pr) => pr.id === b).sequence).toBe(1)
  })

  it('moves a batch of placements to the end of the target chapter', async () => {
    const { projectId, miscChapterId } = await createProject({ title: 'Bulk Move' })
    const { id: resident } = await addRecipeToProject(projectId, 1, miscChapterId)
    const { id: breakfastId } = await addChapter(projectId, 'Breakfast')
    const { id: moveA } = await addRecipeToProject(projectId, 2, breakfastId)
    const { id: moveB } = await addRecipeToProject(projectId, 3, breakfastId)

    const moved = await moveProjectRecipesToChapter([moveA, moveB], miscChapterId)

    expect(moved).toEqual([
      { id: moveA, chapterId: miscChapterId, sequence: 1 },
      { id: moveB, chapterId: miscChapterId, sequence: 2 },
    ])
    const rows = await getProjectRecipes(projectId)
    expect(rows.find((pr) => pr.id === resident).sequence).toBe(0)
    expect(rows.filter((pr) => pr.chapterId === miscChapterId)).toHaveLength(3)
  })

  it('moves nothing when one placement in the batch is missing', async () => {
    const { projectId, miscChapterId } = await createProject({ title: 'Bulk Move Fail' })
    const { id: chapterId } = await addChapter(projectId, 'Breakfast')
    const { id: prId } = await addRecipeToProject(projectId, 1, chapterId)

    await expect(
      moveProjectRecipesToChapter([prId, 999999], miscChapterId),
    ).rejects.toBeInstanceOf(RecordNotFoundError)

    const rows = await getProjectRecipes(projectId)
    expect(rows.find((pr) => pr.id === prId).chapterId).toBe(chapterId)
  })

  it('adds several recipes in one transaction, numbering them after the chapter contents', async () => {
    const { projectId, miscChapterId } = await createProject({ title: 'Bulk Add' })
    await addRecipeToProject(projectId, 1, miscChapterId)

    const { added, duplicates, chapterId } = await addRecipesToProject(projectId, [2, 3])

    expect(chapterId).toBe(miscChapterId)
    expect(duplicates).toEqual([])
    expect(added.map((row) => row.sequence)).toEqual([1, 2])
    expect(added.map((row) => row.recipeId)).toEqual([2, 3])
    expect(await getProjectRecipes(projectId)).toHaveLength(3)
  })

  it('reports recipes already in the cookbook instead of adding them twice', async () => {
    const { projectId } = await createProject({ title: 'Bulk Add Duplicates' })
    const { id: existingId } = await addRecipeToProject(projectId, 5)

    // 5 is already in the cookbook; 6 appears twice in the same batch.
    const { added, duplicates } = await addRecipesToProject(projectId, [5, 6, 6])

    expect(added.map((row) => row.recipeId)).toEqual([6])
    expect(duplicates.map((d) => d.recipeId)).toEqual([5, 6])
    expect(duplicates[0].existing.id).toBe(existingId)
    expect(duplicates[1].existing.id).toBe(added[0].id)
    expect(await getProjectRecipes(projectId)).toHaveLength(2)
  })

  it('adds nothing when the project has no chapter to add to', async () => {
    const projectId = await db.projects.add({ title: 'Chapterless Bulk' })
    await expect(addRecipesToProject(projectId, [1, 2])).rejects.toThrow(/no chapter/i)
    expect(await getProjectRecipes(projectId)).toHaveLength(0)
  })

  it('removes a batch of placements in one transaction', async () => {
    const { projectId } = await createProject({ title: 'Bulk Remove' })
    const { id: a } = await addRecipeToProject(projectId, 1)
    const { id: b } = await addRecipeToProject(projectId, 2)
    const { id: c } = await addRecipeToProject(projectId, 3)

    await removeProjectRecipes([a, c])

    const rows = await getProjectRecipes(projectId)
    expect(rows.map((pr) => pr.id)).toEqual([b])
  })

  // Gives RETIRED_RECIPE_FIELDS a real consumer: a name only ever documented
  // in a comment can drift silently if a later change reuses it. This fails
  // loudly the moment any write path starts emitting a retired name again.
  it('no write path injects a retired field name into a new recipe row', async () => {
    const id = await addRecipe({ title: 'Retired Field Check', instructions: 'Mix.', ingredients: [] })
    const row = await getRecipe(id)
    for (const field of Object.keys(RETIRED_RECIPE_FIELDS)) {
      expect(row).not.toHaveProperty(field)
    }
  })
})

// addRecipe fills in fitsOnPage: null for a caller that omits it; these two fields get
// the same treatment so no creation path can ever leave a recipe's placement undefined.
describe('db.js recipe placement defaults', () => {
  it('defaults imagePlacement/notesPlacement when a caller omits them', async () => {
    const id = await addRecipe({ title: 'No Placement Given', instructions: 'Mix.', ingredients: [] })
    const row = await getRecipe(id)
    expect(row.imagePlacement).toBe(DEFAULT_PLACEMENT)
    expect(row.notesPlacement).toBe(DEFAULT_PLACEMENT)
  })

  it('lets an explicit caller-supplied placement win over the default', async () => {
    const id = await addRecipe({
      title: 'Explicit Placement',
      instructions: 'Mix.',
      ingredients: [],
      imagePlacement: 'left',
      notesPlacement: 'right',
    })
    const row = await getRecipe(id)
    expect(row.imagePlacement).toBe('left')
    expect(row.notesPlacement).toBe('right')
  })
})

// The v5 migration's .modify() callback, tested directly rather than by simulating a
// real cross-version IndexedDB upgrade: fake-indexeddb replays the whole version chain
// on the shared test database's first open, so there's no way for a test to observe
// what an intermediate version (e.g. a client that just ran v4) actually persisted.
describe('db.js promoteLegacyPlacement (v5 migration logic)', () => {
  it('promotes a v4-backfilled "none"/"none" row to hero and resets fitsOnPage', () => {
    const recipe = { imagePlacement: 'none', notesPlacement: 'none', fitsOnPage: true }
    promoteLegacyPlacement(recipe)
    expect(recipe.imagePlacement).toBe('hero')
    expect(recipe.notesPlacement).toBe('hero')
    expect(recipe.fitsOnPage).toBeNull()
  })

  it('promotes a row with the fields entirely missing (pre-fix recipe-import rows)', () => {
    const recipe = { title: 'Imported before placement fields existed', fitsOnPage: true }
    promoteLegacyPlacement(recipe)
    expect(recipe.imagePlacement).toBe('hero')
    expect(recipe.notesPlacement).toBe('hero')
    expect(recipe.fitsOnPage).toBeNull()
  })

  it('never touches a row already on a deliberately-chosen placement', () => {
    const recipe = { imagePlacement: 'left', notesPlacement: 'right', fitsOnPage: true }
    promoteLegacyPlacement(recipe)
    expect(recipe.imagePlacement).toBe('left')
    expect(recipe.notesPlacement).toBe('right')
    expect(recipe.fitsOnPage).toBe(true)
  })

  it('promotes only the field still on the legacy default, leaving the other and still resetting fitsOnPage', () => {
    const recipe = { imagePlacement: 'none', notesPlacement: 'left', fitsOnPage: true }
    promoteLegacyPlacement(recipe)
    expect(recipe.imagePlacement).toBe('hero')
    expect(recipe.notesPlacement).toBe('left')
    expect(recipe.fitsOnPage).toBeNull()
  })
})
