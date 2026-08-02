# Recipe Sheet Componentization

## Context

`RecipeSheet.vue` currently renders every recipe layout template (`standard`,
`image-heavy`, `text-only`, defined in `src/js/templates.js`) from a single
component: one `<article>` whose CSS class switches `grid-template-areas`,
with all content markup (title, image, ingredients list, instructions list,
notes) inlined directly in that one file.

More layout templates are being designed separately (outside this change).
Before adding them, we want the *content* rendering (typography, list
markup, image handling) factored out of the *geometry* (which CSS grid
arrangement is active), so:

- adding a new template is purely "add a CSS grid block + register it in
  `templates.js`" — no content markup to duplicate or drift across templates
- two new per-recipe presentation knobs (ingredient column count, image
  aspect ratio) can be added once, in one place, and apply under any
  template

This document scopes the componentization + the two new knobs. It does not
scope the new templates themselves.

## Decisions

### 1. Composer stays, content moves into sub-components

`RecipeSheet.vue` remains the composer: it still switches a
`recipe-sheet--${template}` CSS class per template and owns
`grid-template-areas` geometry in scoped CSS (unchanged pattern). Content
markup moves into five new flat components under `src/components/`
(matching the existing flat convention — `ChapterDividerPage.vue`,
`CoverPage.vue`, etc. are not nested):

- `RecipeTitle.vue` — title text + accent-color underline (today's header
  styling, unchanged)
- `RecipeImage.vue` — wraps today's `useObjectUrl` + empty-state handling;
  new `aspectRatio` prop
- `RecipeIngredients.vue` — the `<ul>` + `formatIngredientLine`; new
  `columns` prop (CSS `column-count`)
- `RecipeInstructions.vue` — the `<ol>` + step-splitting logic, unchanged
  behavior
- `RecipeNotes.vue` — `renderChefNotes` + `v-html`, unchanged behavior

Each component takes only the data/props it needs. There is no shared
"template config object" and no generic slot/registry system —
`RecipeSheet.vue` reads `recipe.ingredientColumns` / `recipe.imageAspectRatio`
directly off the recipe and passes them as props to the two components that
use them. This was an explicit choice over a data-driven layout engine (see
Rejected Alternatives) and over per-template config objects (the two new
knobs are per-*recipe* choices, independent of which template is active —
confirmed with user during brainstorming).

### 2. New recipe fields, unconstrained per-template

Two new fields on the recipe object, offered at their full range regardless
of which template is active (user's explicit call: "all knobs everywhere;
play stupid games win stupid prizes... as long as there's a live preview"):

- `ingredientColumns`: integer, `1`–`4`
- `imageAspectRatio`: `'auto' | '1:1' | '4:3' | '3:4' | '16:9'`
  (`'auto'` fills the slot via `object-fit: cover`, today's behavior)

Both default when absent (`recipe.ingredientColumns ?? 1`,
`recipe.imageAspectRatio ?? 'auto'`), the same pattern
`recipe.layoutTemplate || 'standard'` already uses in `RecipeSheet.vue`, so
existing stored recipes keep rendering unchanged with no migration step.

No Dexie schema/version bump is needed: `recipes: '++id'` in `db.js` only
indexes `id`, and `layoutTemplate`/`accentColor` were added previously the
same way, as plain unindexed properties.

### 3. Touch points

- `db.js` `populate` seed — add the two new defaults to the seed recipe
- `RecipeEditor.vue` — two new controls (a column stepper, an aspect-ratio
  select) alongside the existing template-picker buttons; wired into the
  `previewRecipe` computed (live preview already re-renders `RecipeSheet`
  reactively — no new wiring needed there), the `onMounted` restore-from-recipe
  logic, and `save()`
- `recipeImportPrompt.js` / `recipeImport.js` (the AI/paste-HTML import
  format, `data-cm-format="recipe"`) — **no change**. These two fields are
  presentation prefs, not recipe content, so they default sensibly when
  absent from imported HTML, the same way `cm-layout` already does when
  omitted.
- Backup export/import (`backup.js`) and QR share (`qrShare.js`) — **no
  change needed**. Neither hardcodes the recipe field set (confirmed by
  search — no `layoutTemplate`-specific handling in either), so both
  round-trip whatever fields exist on the recipe object, including the two
  new ones, automatically.

### 4. Testing

No `@vue/test-utils` is installed and there's no existing precedent for
testing `.vue` rendering in this repo — existing tests are data/store/
import-logic level (`recipeImport.test.js`, `backup.roundtrip.test.js`,
`stores/recipes.test.js`, `stores/projects.test.js`). This change stays
consistent with that:

- Visual correctness is verified via the existing live preview in
  `RecipeEditor.vue` (manual check, no new test infra)
- Extend `recipeImport.test.js`, `backup.roundtrip.test.js`, and
  `stores/recipes.test.js` to cover the two new fields round-tripping
  correctly, the same way they already cover `layoutTemplate`

## Rejected Alternatives

**Data-driven layout engine** (template = JS object mapping arbitrary
components to arbitrary grid areas, read by one generic renderer). Rejected
per discussion: real editorial/print layouts aren't container-agnostic (a
15-step instruction list breaks a narrow sidebar; a landscape image
squishes in a square slot), so a fully generic composition engine either
looks generic/blocky or requires reimplementing a browser's layout logic to
avoid it. Confirmed this project already has the better answer in place —
`templates.js` + `RecipeSheet.vue`'s CSS-class-per-template pattern — this
change extends that pattern rather than replacing it.

**Per-template config for the two new knobs** (e.g. each template
declaring its own default/allowed `ingredientColumns`/`imageAspectRatio`).
Rejected — these are per-*recipe* user choices independent of the active
template, not template properties, and the user explicitly wants the full
range available under every template rather than template-constrained
ranges.

**Separate `.vue` file per template** (each template composes the shared
sub-components in its own file/DOM structure, rather than one
`RecipeSheet.vue` switching a CSS class). Not chosen for this pass — the
current single-composer-with-CSS-class pattern already handles the
divergent arrangements discussed (including area overlap for things like a
title-over-image treatment, via CSS Grid area stacking) without needing
per-template DOM structure. Revisit only if a future template genuinely
can't be expressed as a grid-area rearrangement of the same five
components.

## Out of Scope

- The new layout templates themselves (designed separately; this change
  should make them cheap to add once the design lands, but doesn't add
  them)
- Any UI for making `ingredientColumns`/`imageAspectRatio` constrained or
  template-aware (explicitly rejected above)
