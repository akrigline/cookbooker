import Dexie from 'dexie'
import { nextSequence } from './sequence'
import {
  INGREDIENT_QTY_ALIGN_OPTIONS,
  DEFAULT_INGREDIENT_QTY_ALIGN,
  DEFAULT_ACCENT_COLOR,
  DEFAULT_PLACEMENT,
} from './templates'

export const MISC_CHAPTER_NAME = 'Miscellaneous'

export const db = new Dexie('cookbook_maker_db')

db.version(1).stores({
  recipes: '++id',
  projects: '++id',
  chapters: '++id, projectId',
  project_recipes: '++id, projectId, recipeId, chapterId',
})

// Retired fields. Present on rows written before the version noted, never read,
// deliberately not stripped: a `modify()` pass rewrites every recipe row -
// image Blobs included - inside the blocking upgrade transaction. Note these do
// NOT drain over time: `db.updateRecipe` uses `Table.update`, which MERGES, so
// re-saving a recipe leaves the old value in place. Don't reuse these names with
// different semantics; old rows still carry old values.
//   recipes.ingredientQtyAlign  (v2) → settings.ingredientQtyAlign
export const RETIRED_RECIPE_FIELDS = { ingredientQtyAlign: 'v2 → settings.ingredientQtyAlign' }

// No .upgrade() callback: this creates the object store and writes zero rows,
// the safest possible version-change transaction. A missing settings row is
// handled as the normal case by getSettings/updateSettings below, not seeded.
db.version(2).stores({ settings: 'key' })

// No .stores() call: no index changes, only a data backfill, so nothing needs
// redeclaring (see the version(2) comment above for the contrasting case).
db.version(3).upgrade((tx) => tx.table('recipes').toCollection().modify({ fitsOnPage: null }))

// Backfill for the two-column layout's per-recipe image/notes placement config
// (see openspec/changes/archive/2026-08-16-two-column-configurable-layout). 'none' is a
// no-op under every template that doesn't read these fields.
db.version(4).upgrade((tx) =>
  tx.table('recipes').toCollection().modify({ imagePlacement: 'none', notesPlacement: 'none' }),
)

// v4 backfilled every recipe to 'none'. Promoting the default to 'hero' (see
// templates.js's DEFAULT_PLACEMENT) only reaches new recipes via the `?? DEFAULT_PLACEMENT`
// fallback in RecipeLayoutTwoColumn.vue/RecipeEditor.vue - rows v4 already wrote 'none'
// into need an explicit migration to pick it up. Also covers `undefined`: recipe-import
// never wrote these fields at all (see recipeImport.js), so imported recipes from before
// this fix carry the same "not really chosen" gap as the v4-backfilled 'none' rows - both
// get promoted here so no row is left relying on the runtime fallback. Conditional, not a
// blanket overwrite: 'none' is a real, user-selectable value (PLACEMENT_OPTIONS), so this
// only promotes rows still on the migrated-in/never-set default, never ones anyone has
// since deliberately chosen. Also resets fitsOnPage to null (matching v3's precedent)
// since adding a hero image/notes block changes a recipe's rendered height and the old
// fit measurement no longer applies.
//
// Exported so db.test.js can exercise the promotion logic directly: fake-indexeddb
// replays the whole version chain from v1 on the shared test database's first open, so
// there's no clean way to inspect an intermediate version's on-disk state from a test.
export function promoteLegacyPlacement(recipe) {
  let touched = false
  if (recipe.imagePlacement === 'none' || recipe.imagePlacement === undefined) {
    recipe.imagePlacement = 'hero'
    touched = true
  }
  if (recipe.notesPlacement === 'none' || recipe.notesPlacement === undefined) {
    recipe.notesPlacement = 'hero'
    touched = true
  }
  if (touched) recipe.fitsOnPage = null
  return recipe
}

db.version(5).upgrade((tx) =>
  tx.table('recipes').toCollection().modify(promoteLegacyPlacement),
)

db.on('populate', async () => {
  const projectId = await db.projects.add({
    title: 'My First Cookbook',
    subtitle: '',
    accentColor: DEFAULT_ACCENT_COLOR,
    coverTemplate: 'classic',
    pageNumbersEnabled: true,
    doubleSidedEnabled: false,
  })
  const chapterId = await db.chapters.add({
    projectId,
    name: MISC_CHAPTER_NAME,
    sequence: 0,
    isDefault: true,
  })
  const recipeId = await db.recipes.add({
    title: 'Classic Pancake Recipe',
    instructions: '',
    ingredients: [],
    image: null,
    notes: '',
    layoutTemplate: 'hero-split-balanced',
    ingredientColumns: 1,
    imageAspectRatio: 'auto',
    imagePlacement: DEFAULT_PLACEMENT,
    notesPlacement: DEFAULT_PLACEMENT,
    fitsOnPage: null,
  })
  await db.project_recipes.add({ projectId, chapterId, recipeId, sequence: 0 })
})

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

/**
 * Thrown when a write targets a row that no longer exists. Dexie's
 * `Table.update()` resolves with a count of 0 in that case rather than
 * throwing, so an edit against a just-deleted row would otherwise look like a
 * successful save. Callers can catch this to tell the user their change was
 * not persisted, distinctly from a genuine write failure.
 */
export class RecordNotFoundError extends Error {
  constructor(kind, id) {
    super(`That ${kind} no longer exists (id ${id}), so your change was not saved.`)
    this.name = 'RecordNotFoundError'
    this.kind = kind
    this.recordId = id
  }
}

/**
 * Thrown by `addRecipeToProject` when the recipe is already in the project.
 * Carries the existing association so a caller that treats "add" as idempotent
 * can fall back to it instead of writing a second row.
 */
export class DuplicateRecipeError extends Error {
  constructor(projectId, recipeId, existing) {
    super(`Recipe ${recipeId} is already in cookbook ${projectId}.`)
    this.name = 'DuplicateRecipeError'
    this.projectId = projectId
    this.recipeId = recipeId
    this.existing = existing
  }
}

const updateOrThrow = async (table, kind, id, changes) => {
  const updated = await table.update(id, changes)
  if (!updated) throw new RecordNotFoundError(kind, id)
  return updated
}

// ---------------------------------------------------------------------------
// Settings (singleton row, key 'app')
// ---------------------------------------------------------------------------
export const DEFAULT_SETTINGS = { ingredientQtyAlign: DEFAULT_INGREDIENT_QTY_ALIGN }
const SETTINGS_KEY = 'app'
const KNOWN_QTY_ALIGNS = new Set(INGREDIENT_QTY_ALIGN_OPTIONS.map((o) => o.id))

// Validates, rather than only spreading defaults: a hand-edited backup can carry
// `ingredientQtyAlign: 'centre'`. recipe-import already requires "unrecognized
// value -> standard default" on its import path; this isn't weaker than that.
// Coerces only keys already present on `row` - never injects a default for a
// key that's absent. That distinction matters for updateSettings below: a
// patch that omits `ingredientQtyAlign` must not materialize the default into
// storage, which would erase the difference between "never set" and
// "explicitly set to the default" (see updateSettings' own comment).
const validateSettings = (row) => {
  const validated = { ...row }
  if ('ingredientQtyAlign' in validated && !KNOWN_QTY_ALIGNS.has(validated.ingredientQtyAlign)) {
    validated.ingredientQtyAlign = DEFAULT_INGREDIENT_QTY_ALIGN
  }
  return validated
}

// Always the same shape regardless of whether a row exists yet - `key` is a
// storage-layer detail (the Dexie primary key), not a setting, so it never
// leaks into the returned object; defaults are merged in for the caller but,
// unlike updateSettings, this never writes anything back.
export const getSettings = async () => {
  const row = await db.settings.get(SETTINGS_KEY)
  const { key, ...validated } = validateSettings(row ?? {})
  return { ...DEFAULT_SETTINGS, ...validated }
}

// Read-modify-write in ONE transaction, per CLAUDE.md's db.js invariant and matching
// addChapter above: IndexedDB serializes readwrite transactions on the same object
// store across same-origin tabs, so the read-then-write can't interleave. Upserts
// rather than updating, because a missing row is legitimate (fresh install, or a
// pre-v2 restore that clears `settings`). Reads the RAW row - not getSettings()'s
// defaults-merged object - and validateSettings only coerces keys already present,
// so defaults are never materialized into storage (see validateSettings above).
// Returns the persisted row (key included), because Table.put() resolves with the
// KEY, not the row.
export const updateSettings = (patch) =>
  db.transaction('rw', db.settings, async () => {
    const current = (await db.settings.get(SETTINGS_KEY)) ?? {}
    const row = validateSettings({ ...current, ...patch, key: SETTINGS_KEY })
    await db.settings.put(row)
    return row
  })

// ---------------------------------------------------------------------------
// Recipes
// ---------------------------------------------------------------------------
export const getAllRecipes = () => db.recipes.toArray()
export const getRecipe = (id) => db.recipes.get(id)
export const addRecipe = (recipe) =>
  db.recipes.add({
    fitsOnPage: null,
    imagePlacement: DEFAULT_PLACEMENT,
    notesPlacement: DEFAULT_PLACEMENT,
    ...recipe,
  })
export const updateRecipe = (id, changes) => updateOrThrow(db.recipes, 'recipe', id, changes)

export const deleteRecipe = (id) =>
  db.transaction('rw', db.recipes, db.project_recipes, async () => {
    await db.project_recipes.where('recipeId').equals(id).delete()
    await db.recipes.delete(id)
  })

// Writes `changes` to every recipe in `ids` inside one transaction, so a bulk
// action (e.g. "apply layout to selection") either lands on all of them or
// none - a since-deleted recipe throws RecordNotFoundError from
// updateOrThrow, which aborts the whole transaction rather than leaving the
// selection half-updated.
export const bulkUpdateRecipes = (ids, changes) =>
  db.transaction('rw', db.recipes, async () => {
    for (const id of ids) {
      await updateOrThrow(db.recipes, 'recipe', id, changes)
    }
  })

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------
export const getAllProjects = () => db.projects.toArray()

// The defaults live here and nowhere else: `createProject` returns the rows it
// actually wrote so callers (the Pinia store) mirror what was persisted instead
// of re-declaring the same literals.
export const createProject = (project) =>
  db.transaction('rw', db.projects, db.chapters, async () => {
    const row = {
      title: '',
      subtitle: '',
      accentColor: DEFAULT_ACCENT_COLOR,
      coverTemplate: 'classic',
      pageNumbersEnabled: true,
      doubleSidedEnabled: false,
      ...project,
    }
    const projectId = await db.projects.add(row)
    const chapter = {
      projectId,
      name: MISC_CHAPTER_NAME,
      sequence: 0,
      isDefault: true,
    }
    const chapterId = await db.chapters.add(chapter)
    return {
      projectId,
      miscChapterId: chapterId,
      project: { ...row, id: projectId },
      miscChapter: { ...chapter, id: chapterId },
    }
  })

export const updateProject = (id, changes) => updateOrThrow(db.projects, 'cookbook', id, changes)

export const deleteProject = (id) =>
  db.transaction('rw', db.projects, db.chapters, db.project_recipes, async () => {
    await db.chapters.where('projectId').equals(id).delete()
    await db.project_recipes.where('projectId').equals(id).delete()
    await db.projects.delete(id)
  })

// ---------------------------------------------------------------------------
// Chapters
// ---------------------------------------------------------------------------
export const getAllChapters = () => db.chapters.toArray()

export const getChaptersForProject = (projectId) =>
  db.chapters.where('projectId').equals(projectId).toArray()

// `isDefault` isn't an indexed field (and is stored as a real boolean), so a
// Dexie compound where({...}) shorthand on it silently matches nothing -
// filter in JS instead, using the indexed `projectId` lookup.
export const getMiscChapter = async (projectId) => {
  const chapters = await getChaptersForProject(projectId)
  return chapters.find((c) => c.isDefault)
}

// Reads the sibling chapters and writes the new row inside one readwrite
// transaction: IndexedDB serializes readwrite transactions on the same object
// store across same-origin tabs, so the read-then-write can't interleave with
// another tab computing the same next sequence.
export const addChapter = (projectId, name) =>
  db.transaction('rw', db.chapters, async () => {
    const existing = await getChaptersForProject(projectId)
    const sequence = nextSequence(existing)
    const id = await db.chapters.add({ projectId, name, sequence, isDefault: false })
    return { id, sequence }
  })

export const updateChapter = (id, changes) => updateOrThrow(db.chapters, 'chapter', id, changes)

// Returns the reassignments it performed as `{ reassigned: [{ id, chapterId,
// sequence }] }` so callers apply the persisted values rather than recomputing
// them - recomputing drifts, because this iterates orphaned rows in primary-key
// order and an in-memory copy would iterate in insertion order.
export const deleteChapter = (id) =>
  db.transaction('rw', db.chapters, db.project_recipes, async () => {
    const chapter = await db.chapters.get(id)
    if (!chapter) throw new RecordNotFoundError('chapter', id)
    if (chapter.isDefault) {
      throw new Error('The Miscellaneous chapter cannot be deleted.')
    }

    const misc = await getMiscChapter(chapter.projectId)

    const orphaned = await db.project_recipes
      .where('chapterId')
      .equals(id)
      .toArray()

    const reassigned = []
    if (misc && orphaned.length) {
      const existingMisc = await db.project_recipes
        .where('chapterId')
        .equals(misc.id)
        .toArray()
      let sequence = nextSequence(existingMisc)

      for (const pr of orphaned) {
        const changes = { chapterId: misc.id, sequence: sequence++ }
        await db.project_recipes.update(pr.id, changes)
        reassigned.push({ id: pr.id, ...changes })
      }
    }

    await db.chapters.delete(id)
    return { reassigned }
  })

// A sequence swap is two writes that are only correct together - if the second
// failed after the first committed, two rows would share a sequence with no
// rollback. Both writes go in one transaction, and the resulting values come
// back so the caller mirrors what was persisted.
const swapSequences = (table, kind, idA, idB) =>
  db.transaction('rw', table, async () => {
    const [a, b] = await Promise.all([table.get(idA), table.get(idB)])
    if (!a) throw new RecordNotFoundError(kind, idA)
    if (!b) throw new RecordNotFoundError(kind, idB)
    await table.update(idA, { sequence: b.sequence })
    await table.update(idB, { sequence: a.sequence })
    return [
      { id: idA, sequence: b.sequence },
      { id: idB, sequence: a.sequence },
    ]
  })

export const swapChapterSequences = (idA, idB) =>
  swapSequences(db.chapters, 'chapter', idA, idB)

// ---------------------------------------------------------------------------
// project_recipes (recipe <-> chapter associations)
// ---------------------------------------------------------------------------
export const getAllProjectRecipes = () => db.project_recipes.toArray()

export const getProjectRecipes = (projectId) =>
  db.project_recipes.where('projectId').equals(projectId).toArray()

export const addRecipeToProject = (projectId, recipeId, chapterId = null) =>
  db.transaction('rw', db.chapters, db.project_recipes, async () => {
    let targetChapterId = chapterId
    if (!targetChapterId) {
      const misc = await getMiscChapter(projectId)
      targetChapterId = misc?.id
    }
    if (!targetChapterId) {
      throw new Error(
        `Cannot add recipe to project ${projectId}: no chapter was given and the project has no Miscellaneous chapter.`,
      )
    }

    // "A recipe appears at most once per cookbook" is enforced here rather than
    // only in the view that happens to filter already-added recipes.
    const duplicate = await db.project_recipes
      .where('recipeId')
      .equals(recipeId)
      .filter((pr) => pr.projectId === projectId)
      .first()
    if (duplicate) throw new DuplicateRecipeError(projectId, recipeId, duplicate)

    const siblings = await db.project_recipes
      .where('chapterId')
      .equals(targetChapterId)
      .toArray()
    const sequence = nextSequence(siblings)

    const id = await db.project_recipes.add({
      projectId,
      recipeId,
      chapterId: targetChapterId,
      sequence,
    })
    return { id, sequence, chapterId: targetChapterId }
  })

// Adds several recipes at once. Same rules as `addRecipeToProject`, but a
// duplicate is reported rather than thrown: a batch that aborted on the first
// already-present recipe would strand the rest, and the caller's intent (these
// recipes are in the cookbook) already holds for that one.
export const addRecipesToProject = (projectId, recipeIds, chapterId = null) =>
  db.transaction('rw', db.chapters, db.project_recipes, async () => {
    let targetChapterId = chapterId
    if (!targetChapterId) {
      const misc = await getMiscChapter(projectId)
      targetChapterId = misc?.id
    }
    if (!targetChapterId) {
      throw new Error(
        `Cannot add recipes to project ${projectId}: no chapter was given and the project has no Miscellaneous chapter.`,
      )
    }

    const existing = await getProjectRecipes(projectId)
    const byRecipeId = new Map(existing.map((pr) => [pr.recipeId, pr]))
    let sequence = nextSequence(existing.filter((pr) => pr.chapterId === targetChapterId))

    const added = []
    const duplicates = []
    for (const recipeId of recipeIds) {
      // Tracks rows added in this same batch too, so a recipeId repeated in the
      // input list can't produce two placements.
      const duplicate = byRecipeId.get(recipeId)
      if (duplicate) {
        duplicates.push({ recipeId, existing: duplicate })
        continue
      }
      const row = { projectId, recipeId, chapterId: targetChapterId, sequence: sequence++ }
      const id = await db.project_recipes.add(row)
      added.push({ id, ...row })
      byRecipeId.set(recipeId, { id, ...row })
    }
    return { added, duplicates, chapterId: targetChapterId }
  })

export const moveProjectRecipe = (id, changes) =>
  updateOrThrow(db.project_recipes, 'recipe placement', id, changes)

// The N-row counterpart of `swapSequences`: a bulk resequence or bulk move is a
// set of writes that are only correct together. Fanned out over `Promise.all`
// one stale row rejects after its siblings have already committed, leaving a
// chapter half-sorted with no rollback; inside one transaction it is all or
// nothing. Both return the persisted values so callers mirror them.

/** Rewrites each placement's sequence to its index in `orderedIds`. */
export const resequenceProjectRecipes = (orderedIds) =>
  db.transaction('rw', db.project_recipes, async () => {
    const updated = []
    for (const [sequence, id] of orderedIds.entries()) {
      await updateOrThrow(db.project_recipes, 'recipe placement', id, { sequence })
      updated.push({ id, sequence })
    }
    return updated
  })

/** Moves placements to `chapterId`, appending them after its current contents. */
export const moveProjectRecipesToChapter = (ids, chapterId) =>
  db.transaction('rw', db.project_recipes, async () => {
    const siblings = await db.project_recipes.where('chapterId').equals(chapterId).toArray()
    // Rows already in the target chapter are counted here (and left alone),
    // so the moved rows below get sequences past every one that stays put.
    let sequence = nextSequence(siblings)
    const moved = []
    for (const id of ids) {
      const changes = { chapterId, sequence: sequence++ }
      await updateOrThrow(db.project_recipes, 'recipe placement', id, changes)
      moved.push({ id, ...changes })
    }
    return moved
  })

export const swapProjectRecipeSequences = (idA, idB) =>
  swapSequences(db.project_recipes, 'recipe placement', idA, idB)

export const removeProjectRecipe = (id) => db.project_recipes.delete(id)

// Unlike `updateOrThrow`, a missing id here is not reported: delete is
// idempotent (a row already gone is exactly the caller's desired end state),
// where update is not (a change to a gone row was silently discarded).
export const removeProjectRecipes = (ids) => db.project_recipes.bulkDelete(ids)
