## Context

Cookbooker already has two export/import mechanisms:

1. **Whole-database backup/restore** (`src/js/backup.js`, Settings page) — uses
   `dexie-export-import` to export/replace every table. Destructive on restore
   (`clearTablesBeforeImport: true`), and not scoped to one cookbook.
2. **Single-recipe HTML export/import** (`src/js/recipeExport.js` /
   `src/js/recipeImport.js`) — a human-readable, self-contained `.html` file per
   recipe using a versioned microformat: `<article data-cm-format="recipe"
   data-cm-version="1">` with `.cm-title`, `.cm-ingredients`, `.cm-instructions`,
   `.cm-notes`, `.cm-layout`/`.cm-ingredient-columns`/`.cm-image-aspect-ratio` meta
   elements, and an inline base64 `.cm-image`. This same format doubles as the
   contract the AI-import prompt (`recipeImportPrompt.js`) asks the LLM to produce.

Neither covers "export/import one whole cookbook (settings + chapters + recipe
order)". A scoped `dexie-export-import` (`filter`/`transform` options) was
considered and rejected: `importInto` merging into an already-populated database
isn't designed to renumber colliding autoincrement primary keys, which is exactly
the situation of importing a cookbook into a library that already has other
cookbooks/recipes. The chosen approach instead extends the existing `recipe/1`
microformat with an outer `cookbook/1` wrapper, reusing its parser as-is per
recipe and hand-rolling fresh IDs on write (the same pattern `createProject`
already uses for a from-scratch cookbook).

## Goals / Non-Goals

**Goals:**
- Export one cookbook (its settings, chapters in order, and recipes in chapter
  order) as a single portable, human-openable `.html` file.
- Import such a file as a brand-new cookbook, without touching any existing
  cookbook or recipe.
- Reuse the `recipe/1` article format and its parser unchanged, so the two
  formats stay in lockstep by construction rather than by discipline.
- Report, not abort, on a per-recipe parse failure during import.

**Non-Goals:**
- No deduping/matching imported recipes against the existing library — every
  import creates fresh recipe rows, even for exact duplicates.
- No merge-into-an-existing-cookbook import mode.
- No changes to the `recipe/1` format's own contract or to whole-database
  backup/restore.
- No changes to the IndexedDB schema (no new `db.version()` bump).

## Decisions

### 1. `cookbook/1` is a wrapper around unmodified `recipe/1` articles
The cookbook document is:

```html
<meta name="cookbooker-format" content="cookbook/1">
...
<section data-cm-format="cookbook" data-cm-version="1">
  <meta class="cm-cookbook-title" content="...">
  <meta class="cm-cookbook-subtitle" content="...">
  <meta class="cm-cookbook-accent-color" content="...">
  <meta class="cm-cookbook-cover-template" content="...">
  <meta class="cm-cookbook-page-numbers" content="true">
  <meta class="cm-cookbook-double-sided" content="false">

  <section class="cm-chapter" data-cm-chapter-name="Desserts" data-cm-chapter-sequence="1">
    <article data-cm-format="recipe" data-cm-version="1"> ... </article>
    <article data-cm-format="recipe" data-cm-version="1"> ... </article>
  </section>
  <section class="cm-chapter" data-cm-chapter-name="Miscellaneous" data-cm-chapter-sequence="0">
    ...
  </section>
</section>
```

Chapters are emitted in `sequence` order; recipes within a chapter in their
`project_recipes.sequence` order. The default (`isDefault`) chapter is exported
like any other chapter (by name/sequence) — import does not special-case it by
name; it is recreated as whichever chapter has the *lowest* sequence value
becoming the new project's auto-created Miscellaneous chapter (see Decision 3).

**Alternative considered:** a flat list of recipes with a `chapter` field per
recipe, instead of nesting recipes inside `<section class="cm-chapter">`.
Rejected — nesting mirrors the actual project/chapter/recipe hierarchy, keeps
chapters with zero recipes representable, and is easier to hand-author or
hand-read.

### 2. Extract the article-builder, don't duplicate it
`recipeExport.js`'s `exportRecipeToHtml` currently builds both the outer
`<!DOCTYPE html>...` document *and* the inner `<article>`. Split it into:
- `buildRecipeArticleHtml(recipe)` — returns just the `<article
  data-cm-format="recipe" ...>...</article>` string (async, still needs
  `blobToDataUri` for the image).
- `exportRecipeToHtml(recipe)` — unchanged public behavior, now just wraps
  `buildRecipeArticleHtml`'s output in the single-recipe document shell.

`cookbookExport.js` calls `buildRecipeArticleHtml` once per recipe and wraps the
concatenated articles in the cookbook document shell. This guarantees the two
export paths can never drift apart on what a `recipe/1` article looks like.

Parsing needs no equivalent split: `parseRecipeElement` (in `recipeImport.js`)
already takes an arbitrary root element and has no dependency on being a
top-level document, so `cookbookImport.js` calls it directly, once per
`[data-cm-format="recipe"]` found inside each `.cm-chapter` section. It's
exported from `recipeImport.js` for this reuse (previously module-private).

### 3. Import always creates a new cookbook; ID remapping is manual
A new `db.js` function, `importCookbook(data)`, where `data` is the parsed
`{ title, subtitle, accentColor, coverTemplate, pageNumbersEnabled,
doubleSidedEnabled, chapters: [{ name, sequence, recipes: [...] }] }`:

- Runs in one `db.transaction('rw', db.projects, db.chapters, db.recipes,
  db.project_recipes, ...)`, mirroring `createProject`'s shape.
- Inserts the `projects` row from the cookbook-level fields.
- For each parsed chapter (in the order given), inserts a `chapters` row.
  The **first** chapter (lowest `data-cm-chapter-sequence`) reuses the
  project's already-required default chapter slot: rather than calling
  `db.chapters.add` a second time, the transaction writes exactly one
  `isDefault: true` chapter (using the imported name, or `MISC_CHAPTER_NAME` if
  the imported name was somehow missing) so every project keeps the
  single-default-chapter invariant `deleteChapter`/`getMiscChapter` rely on.
  All other chapters are inserted with `isDefault: false`.
- For each recipe under a chapter, calls the same defaulting `addRecipe` does
  today (`fitsOnPage: null` regardless of any value implied by the import —
  Non-Goal: no carried-over fit measurement, see Decision 4) and then adds a
  `project_recipes` row at that recipe's position in the chapter.
- Returns `{ project, chapters, recipes, placements }` — the actual persisted
  rows, per `CLAUDE.md`'s store/db.js mirroring invariant — so the Pinia
  stores (`projectsStore`, `recipesStore`) can push the new rows into their
  in-memory state without a full reload.

No ID remapping table is needed beyond "whatever Dexie's `add()` returns this
time" — because every row is a fresh insert (never an update/overwrite),
there's no collision to reconcile in the first place. This is the core reason
the custom-format approach avoids the `dexie-export-import`
`importInto`-into-a-populated-db problem entirely.

### 4. `fitsOnPage` is always reset on import
Even though the exporter doesn't currently include `fitsOnPage` in the
`recipe/1` format at all (it's derived, not authored, data — matches
`recipe-export`'s existing scope), being explicit here: `importCookbook`
inserts every recipe with `fitsOnPage: null`, and after the transaction
commits, the caller triggers the existing `triggerFitMeasurement` fire-and-forget
flow (`src/js/recipeFitMeasure.js`) for the newly created recipes — the same
mechanism `recipesStore.createRecipe`/bulk recipe-import already use. No new
measurement code is needed.

### 5. Per-recipe parse failures are collected, not fatal
`cookbookImport.js`'s parser returns
`{ cookbook, failures: [{ chapterName, label, reason }], rejected }` — `rejected`
true only when the file carries no `[data-cm-format="cookbook"]` root at all
(same strict whole-file-rejection contract `parseRecipeImportHtml` uses today).
A chapter with zero successfully-parsed recipes still gets created (an empty
chapter is valid, per `book-organization`). The "Import Cookbook" UI shows a
summary banner listing skipped recipes by chapter, mirroring how
`RecipeImport.vue` already reports failures.

### 6. UI entry points
- **Export**: `ProjectView.vue` header action row gets an "Export Cookbook"
  button (next to "Import Recipes"/"Print Preview"). Downloads
  `<sanitized-cookbook-title-or-"cookbook">.html`, same `URL.createObjectURL` +
  synthetic `<a>` pattern `Settings.vue`'s export already uses.
- **Import**: a new "Import Cookbook" action on the cookbooks list/home view
  (parallel to `/library/import`'s placement, not nested under Settings — this
  is a cookbook-scoped action, not a database-scoped one, matching the "reject
  Settings-only" answer from brainstorming). File picker → parse → on success,
  call `importCookbook`, update the stores, and navigate to the new cookbook's
  `ProjectView` (`/projects/:id`), showing the skipped-recipe summary banner
  there if any failures occurred (via a one-shot `history.state` payload, the
  same mechanism `cookbookImportShortcut`'s `autoSelectIds` already uses — not
  a query param, since it's ephemeral not a navigable location).

## Risks / Trade-offs

- **[Risk]** A very large cookbook (many recipes/images) produces a large
  base64-inflated `.html` file and a synchronous-feeling export/import (no
  chunked progress, unlike `backup.js`'s Dexie-progress-callback pattern).
  → **Mitigation**: acceptable for v1 — this mirrors the existing single-recipe
  export/import, which has the same characteristic and hasn't needed chunking
  in practice. Revisit only if real cookbooks prove large enough to matter.
- **[Risk]** Hand-editing a `cookbook/1` file (or a future format version) could
  produce chapters with duplicate/missing `data-cm-chapter-sequence`, or a
  cookbook section with zero chapters.
  → **Mitigation**: `cookbookImport.js` treats a missing/duplicate sequence the
  same way `parseRecipeElement` treats a missing recipe field — sort by
  document order as a fallback rather than throwing, and a cookbook with zero
  parsed chapters still creates a project (with just its auto Miscellaneous
  chapter), consistent with Decision 5's "don't abort on partial data" stance.
- **[Trade-off]** No dedup means re-importing the same file twice (or importing
  two cookbooks that share recipes) always doubles storage.
  → Accepted per brainstorming: predictability over storage efficiency: no
  false-positive-merge risk, and cleanup is already possible via the existing
  library UI.

## Migration Plan

No data migration — this adds new pure functions and two new UI actions on top
of the existing schema. Fully additive; no `db.version()` bump. Rollback is
simply reverting the change (no persisted state depends on it).

## Open Questions

- Exact filename-sanitization rule for the downloaded `.html` (e.g. cookbook
  titled `Mom's Recipes / 2024`). Note `exportRecipeToHtml` itself has no UI
  caller yet (confirmed during brainstorming — only referenced by its own
  test), so there's no existing filename convention to match; this task
  establishes the first one, and should keep it simple (e.g. strip characters
  invalid in filenames, fall back to `cookbook.html` for an empty/untitled
  cookbook) rather than importing a dependency for it.
