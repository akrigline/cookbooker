## Context

Recipes are currently entered one at a time through `RecipeEditor.vue`, which takes
free-text ingredient/instruction textareas and round-trips ingredients through
`parseIngredientsText()` (`src/js/conversions.js`). The Dexie `recipes` table
(`src/js/db.js`) has no schema validation of its own — `db.addRecipe()` and
`recipesStore.createRecipe()` will happily store anything, so all required-field
enforcement lives client-side in the editor. `image` is a real `Blob`; nothing in the
app supports a URL- or reference-based image.

A prior design investigation
(`/home/andrew/.firstmate-home/data/cookbook-ai-recipe-import-design/report.md`)
evaluated file formats for LLM-produced recipe transcriptions (free-form HTML, JSON,
YAML, Markdown+frontmatter, HTML+JSON-LD, and structured/tag-scoped HTML) and the
captain resolved the four open design questions in
`.../cookbook-ai-recipe-import-design/decisions.md`. This design document implements
those settled decisions; it does not revisit them.

## Goals / Non-Goals

**Goals:**
- Parse a strict, tag-scoped HTML format (`recipe/1`) client-side with zero new
  runtime dependencies, reusing `parseIngredientsText()` for ingredients.
- Support one or many `<article class="cm-recipe" data-cm-format="recipe"
  data-cm-version="1">` blocks in a single file (batch import).
- Give the user a staged review (parse → preview via `RecipeSheet.vue` → confirm) so
  a bad LLM transcription never silently lands in the library.
- Reuse the existing recipe-creation path (`recipesStore.createRecipe()`) so imported
  recipes are indistinguishable from hand-entered ones downstream.

**Non-Goals:**
- No image support in v1 — imported recipes always get `image: null`.
- No heuristic/best-effort parsing of HTML that doesn't carry the exact
  `data-cm-format`/`data-cm-version` markers — such files are rejected outright.
- No changes to the Dexie schema or the recipe data model.
- No server-side or LLM-API integration — the user runs the LLM themselves and pastes
  its output as a local file.

## Decisions

**Format: structured, tag-scoped HTML (`recipe/1`).** One `<article class="cm-recipe"
data-cm-format="recipe" data-cm-version="1">` root per recipe. Chosen over free-form
HTML (unparseable reliably), JSON/YAML (unreadable/fragile for a layperson to
hand-fix), and HTML+JSON-LD (the visible page and the buried JSON-LD are two sources
of truth that can silently drift apart). Full comparison in the design report §2.
Parsing runs on `DOMParser` (native, already available under the project's
`happy-dom` vitest environment), scoped to fixed classes/attributes; everything else
in the document (styling, extra markup, `<head>`) is ignored noise.

**Strict version gate.** Only `data-cm-format="recipe"` + `data-cm-version="1"` is
accepted. A file with neither marker anywhere is rejected as a whole file
("this doesn't look like a cookbook-maker recipe file"). A matched `<article
class="cm-recipe">` missing `data-cm-version="1"` specifically (e.g. a future/unknown
version) is skipped as a per-recipe failure, not guess-parsed.

**Batch support is structural, not incremental work.** Because the parser already
loops over every `[data-cm-format="recipe"]` match in the document
(`querySelectorAll`), a single-recipe file and a batch file take the same code path —
there is no separate "batch mode."

**Ingredient/instruction extraction reuses existing app logic verbatim.** Ingredient
`<li>` text becomes raw lines fed straight into `parseIngredientsText()` — the same
function the manual editor uses — so imported ingredients render, convert, and
re-edit identically to hand-typed ones. Instructions are extracted from
`.cm-instructions li` (falling back to `.cm-instructions p` if the LLM used
paragraphs instead of a list) and joined with `\n`, matching the plain-newline-joined
string `RecipeSheet.vue` already expects.

**Validation mirrors `RecipeEditor.vue:88-95` exactly:** non-empty `title`,
non-empty `instructions`. A recipe failing this is skipped with a per-recipe reason
string; it does not fail the rest of the batch. This is a deliberate duplication of a
few lines of validation logic (not extracted into a shared helper) since the editor's
version operates on refs/component state while the importer operates on parsed DOM
text — a shared abstraction would be premature for two 2-line checks.

**Staged review, not direct import.** All selected file(s) are parsed client-side with
zero DB writes. Each successfully parsed recipe renders through the existing
`RecipeSheet.vue` (the same component used for the real detail/print view) with a
default-checked include/exclude checkbox — this is a second, independent verification
that the parser's extraction actually matches what the file visually contains,
catching the "parser scraped a stray `<li>` from outside the intended section" class
of bug. Parse failures are listed separately with a reason and are not selectable.
"Import N recipes" commits only the checked recipes, one `createRecipe()` call per
recipe, then routes to the Library — mirroring `RecipeEditor.vue`'s post-save
navigation.

**Entry point: Recipe Library toolbar, not Settings.** Recipes always land in the
same global, project-independent library regardless of which cookbook (if any) the
user has in mind, so "Import Recipes" belongs next to "+ New Recipe" in
`RecipeLibrary.vue`'s toolbar. Settings remains reserved for whole-database
backup/restore (`src/js/backup.js`, a full Dexie snapshot mechanism structurally
incompatible with a per-recipe import format).

**New route, new view component.** A new `RecipeImport.vue` view is added at
`/library/import` (registered in `src/router/index.js` alongside the other
`/library/*` routes), following the same top-level-view convention as
`RecipeEditor.vue`/`RecipeLibrary.vue` rather than a modal, since the review screen
needs real vertical space to show multiple full `RecipeSheet` previews.

**Parser module has no Vue/store dependencies.** `src/js/recipeImport.js` exports
pure functions (`parseRecipeImportFile(text) -> { recipes, failures }` or similar)
that take file text and return plain data — no DOM writes, no Pinia store calls. This
mirrors `src/js/conversions.js`'s shape and is what makes the parser unit-testable
under `happy-dom` with zero test infra changes, per `conversions.test.js` /
`db.test.js`'s existing pattern. The view component is a thin layer that calls the
parser, renders results, and calls `recipesStore.createRecipe()` on confirm.

## Risks / Trade-offs

- **LLM output drift from the exact template** → hard failure (by design, per the
  captain's "strict" decision). Mitigated by shipping the paste-ready prompt text
  verbatim from the design report §3, which is explicit and repetitive about the
  required markers, and by the staged-review screen surfacing per-recipe failure
  reasons so the user can see exactly what didn't parse and re-prompt the LLM.
- **A well-formed but semantically wrong transcription** (e.g. LLM invents an
  ingredient) is not something the parser can detect — mitigated by the staged
  review's `RecipeSheet` preview, which is the same rendering the user would
  eyeball on the real recipe page, making mistranscriptions visible before commit.
- **No image support** means every imported recipe needs a manual follow-up trip
  through `RecipeEditor` to add a photo, if desired — accepted as an explicit v1
  scope cut per the captain's decision; nothing in the current `Blob`-based image
  schema could accept LLM text output anyway.

## Migration Plan

Purely additive: new module, new view, new route, one new toolbar button. No existing
data, schema, or routes change. Nothing to migrate or roll back beyond reverting the
branch.

## Open Questions

None — the four design-report open questions were resolved by the captain in
`decisions.md` prior to this proposal being written.
