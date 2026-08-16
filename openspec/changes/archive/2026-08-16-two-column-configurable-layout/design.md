## Context

Five reference sketches in `brainstorming/recipe-layout-playground/finalized-designs/two-columns/` describe a two-column recipe layout (narrow left column: ingredients + QR; wide right column: instructions) with the optional image and Chef's Notes placed differently in each: full-width "hero" row under the title, small in the left column, or medium in the right column. All five reduce to one rule set:

- `imagePlacement`, `notesPlacement` ∈ `{none, hero, left, right}`, independent of each other.
- **hero** slot: full-width row(s) directly under the title. If both image and notes are `hero`, image renders above notes.
- **left** column, in order: `[image if left]`, `[notes if left]`, `RecipeIngredients`, `RecipeQRCode`.
- **right** column, in order: `[image if right]`, `[notes if right]`, `RecipeInstructions`.
- QR code placement is not configurable — it's always anchored in the left column, as a standalone sibling rather than nested inside `RecipeIngredients` (matching the pattern already established by `RecipeLayoutDefault.vue`, the one-column analog built just before this change).

This was validated by hand against all 5 docs before writing this proposal (see conversation history / proposal.md); the mapping holds without exception, including the two-columns-simple.md case, which is just `none`/`none` on this same component.

This is the first layout template that needs configuration beyond its own id. Existing templates (`hero-split-balanced`, `text-only`, etc.) are fully described by `layoutTemplate` alone.

## Goals / Non-Goals

**Goals:**
- One component (`RecipeLayoutTwoColumn.vue`) that reproduces all 5 documented variants and the other 11 unreferenced combinations correctly, using flexbox (matching the existing 7 layout components' convention, not the docs' literal absolute-inch positions — `recipeFitMeasure.js`'s overflow-fit check relies on `scrollHeight`, which absolutely-positioned content doesn't reliably contribute to).
- A `layoutTemplate.js` metadata shape that lets `RecipeEditor.vue` know a template has extra config, without hardcoding the two-column template's id in the view.
- Graceful degradation: a placement of `left`/`right`/`hero` for a field the recipe doesn't have (no image, no notes) collapses cleanly — placement says "where if present," not "whether present." This is orthogonal to the new fields; every existing layout already does this via `v-if`.

**Non-Goals:**
- Making QR code position configurable — no doc or user request asks for this, and doing so triples the config surface for no demonstrated need.
- Removing, hard-deprecating, or migrating recipes off the 7 legacy layouts — they stay fully functional and selectable, only visually de-emphasized (collapsed by default, no thumbnail, smaller card style).
- Generalizing the "template has extra config" mechanism beyond what two enum fields need — no third configurable template exists yet to justify a more general schema.
- Building a general-purpose thumbnail system for all templates — only the 2 recommended ones get one, by design.

## Decisions

### Field shape: two flat enum fields on the recipe, not a nested object

`imagePlacement: 'none' | 'hero' | 'left' | 'right'` and `notesPlacement: 'none' | 'hero' | 'left' | 'right'`, stored directly on the recipe row (sibling to `layoutTemplate`, `ingredientColumns`, `imageAspectRatio`), not nested under something like `recipe.twoColumnConfig: { image, notes }`.

**Alternatives considered:**
- A nested config object scoped to the two-column template. Rejected: `recipes` in Dexie is schemaless beyond `++id` (no per-field indexes declared), so nesting buys no query benefit, and it introduces a shape inconsistent with every other layout-affecting field, which are all flat. A flat pair of fields is also a strictly simpler `RecipeEditor.vue` save/load diff — same pattern as the three existing template-adjacent fields.
- Reusing a single `layoutTemplate` string encoding placement (e.g. `two-column-hero-left`) as a 16-variant enum. Rejected outright — this is exactly the combinatorial-explosion problem the proposal exists to avoid.

Fields persist regardless of the active `layoutTemplate` (harmless no-ops when a different template is active), consistent with how `ingredientColumns` already persists even under `text-only`, which ignores it.

### Template metadata: add a `placementConfigurable: boolean` flag to `LAYOUT_TEMPLATES` entries

`templates.js`'s `LAYOUT_TEMPLATES` array gains `placementConfigurable: true` on the two-column entry (defaulting to falsy/absent on all others). `RecipeEditor.vue` reads `LAYOUT_TEMPLATES.find(t => t.id === layoutTemplate.value)?.placementConfigurable` to decide whether to render the two new placement controls — the same lookup pattern already used for `activeLayout` at line 76 of `RecipeEditor.vue` (`LAYOUT_TEMPLATES.find((tpl) => tpl.id === layoutTemplate.value)`).

**Alternatives considered:**
- Hardcoding `v-if="layoutTemplate === 'two-column'"` in `RecipeEditor.vue`. Rejected: works today but the view then has to know about a specific template id, which the current design deliberately avoids everywhere else (the `hasImage` flag already on each `LAYOUT_TEMPLATES` entry is the existing precedent for metadata-driven view behavior instead of id-string checks).

### Migration: `db.version(4)` backfill, no `.stores()` change

Add `db.version(4).upgrade((tx) => tx.table('recipes').toCollection().modify({ imagePlacement: 'none', notesPlacement: 'none' }))`, directly mirroring `db.version(3)`'s `fitsOnPage` backfill. No `.stores()` index redeclaration needed since `recipes` has never indexed these kinds of fields.

### Wire both recommended layouts in as part of this change (supersedes the original "land unwired" plan)

**Revised from this design's first draft**, which planned to land `RecipeLayoutTwoColumn.vue` unwired (matching how `RecipeLayoutDefault.vue` shipped) and defer registration to a follow-up. That plan is dropped: the user has since clarified the goal is to actively promote "one column" + "two column" as the two recommended layouts and de-emphasize (not remove) the legacy 7 — which only means anything if both new layouts are actually selectable and visually prominent in this same change. Shipping the schema/editor plumbing behind an unreachable template, while simultaneously restyling the picker to advertise that template, would leave the picker referencing something that isn't there.

So both `RecipeLayoutDefault.vue` and `RecipeLayoutTwoColumn.vue` are added to `RecipeSheet.vue`'s `LAYOUT_COMPONENTS` map and `templates.js`'s `LAYOUT_TEMPLATES` in this change, each tagged `tier: 'recommended'`. Section 3.5's manual cross-combination visual check still happens (see Tasks) — it's now a gate on *this change's* completion rather than on a separate follow-up change.

`DEFAULT_LAYOUT_TEMPLATE` (currently `'hero-split-balanced'`) changes to `'default'` (the one-column layout) for newly created recipes. Existing recipes are untouched — the `db.version(4)` backfill only adds the two new placement fields, it does not rewrite anyone's `layoutTemplate`. This is a forward-looking default change only, not a migration.

### Template tiering: a `tier: 'recommended' | 'legacy'` field on `LAYOUT_TEMPLATES` entries

Every entry in `templates.js`'s `LAYOUT_TEMPLATES` gains `tier: 'recommended'` (the 2 new layouts) or `tier: 'legacy'` (the existing 7). `RecipeEditor.vue`'s picker partitions on this field: `recommended` entries always render as larger cards with a thumbnail, followed by a visual divider, then `legacy` entries in a collapsed disclosure (a local `showLegacyLayouts` ref). The disclosure is **closed by default unconditionally** — including when the recipe being edited already has a legacy `layoutTemplate` selected. **Revised from this design's first draft**, which auto-opened the disclosure in that case to keep the current selection visible; the user explicitly asked for it to stay closed even then, since the point is de-emphasizing legacy templates in the picker's default view, not just for brand-new recipes. The recipe's current legacy template is still shown correctly selected once the user expands the section themselves — nothing about the underlying `layoutTemplate` value or its selected state changes, only whether the section auto-expands.

**Alternatives considered:**
- A boolean `recommended: boolean` instead of a `tier` enum. Rejected in favor of the enum only because "legacy" is meaningfully different from merely "not recommended" (it signals these predate the new mental model, useful in code comments and any future messaging) — but this is a naming preference, not a functional difference; either would work.
- A numeric `sortOrder` instead of a tier. Rejected: sort order alone doesn't answer the actual UI question (collapsed-by-default vs. always-visible), so a tier is needed regardless and a bolted-on sort field would be redundant with array order, which already reflects the intended display order within each tier.

### Thumbnails: inline SVG per recommended template, static (not derived from live recipe data)

Each `recommended`-tier `LAYOUT_TEMPLATES` entry gets a small inline SVG (viewBox roughly matching the page aspect ratio, ~120×160) sketching its block structure as flat rectangles — title bar, image block, notes block, ingredients/QR column, instructions column — using the same relative proportions as the reference docs. For the two-column layout, whose actual image/notes placement is a runtime per-recipe setting, the thumbnail shows the base "simple" structure (title, left column ingredients+QR, right column instructions) rather than trying to depict all 16 placement combinations — the thumbnail communicates "this is the two-column shape," not the current recipe's specific configuration.

**Alternatives considered:**
- Rendering a live miniature `<RecipeSheet>` with placeholder data as the "thumbnail." Rejected: far more expensive (full component mount + fonts + CSS per picker render), and overkill for what's meant to be a small at-a-glance shape indicator, not a live preview (the actual live preview already exists in the editor's preview column).
- One shared thumbnail per template stored as a static image asset (PNG/exported SVG file). Rejected: inline SVG markup in `templates.js` (or a tiny dedicated `RecipeLayoutThumbnail.vue` keyed by template id) needs no build-time asset pipeline, stays themeable via CSS variables (matches light/print color tokens), and is trivially small (a handful of `<rect>`s).
- Legacy templates also get thumbnails. Rejected per the user's direction — legacy templates are deliberately de-emphasized, and adding polish (thumbnails) to the tier being downplayed undercuts the point of the tiering.

## Risks / Trade-offs

- **Untested combinations** (`hero`+`left`, `hero`+`right`, both `hero`, etc. — 11 of 16 combos have no reference doc) → Mitigation: the slot model is a small, uniform set of rules (not per-combination special-casing), so correctness of the 5 documented cases is strong evidence for the rest; still, manually eyeball all 16 in the browser as part of this change's verification (tasks.md includes this) before it ships wired-in and advertised.
- **Both new layouts ship live and promoted in one change** (no separate "verify unwired, wire later" buffer this time) → Mitigation: the visual cross-combination check (tasks.md 3.5) happens before the picker-restyling/wiring tasks, so a problem found there blocks the rest of the change rather than shipping silently.
- **Users mid-edit on a legacy template might not immediately see their current layout selected** → Mitigation: acceptable per the user's explicit direction (see revised Decision above) — the template itself is unchanged and still shown correctly selected once "Show more layouts" is expanded; only the default-collapsed state changed.
- **Changing `DEFAULT_LAYOUT_TEMPLATE` doesn't affect existing recipes' rendering** (only what a brand-new, never-saved recipe starts as) → Mitigation: none needed, this is inherent to how `layoutTemplate` is only read as a fallback (`RecipeSheet.vue`'s `?? LAYOUT_COMPONENTS[DEFAULT_LAYOUT_TEMPLATE]`) for rows that somehow lack the field, and as the initial `ref()` value in `RecipeEditor.vue` for a new recipe — every saved recipe already has an explicit `layoutTemplate` string.
- **Schema backfill on every existing recipe row** → Mitigation: low risk, direct precedent (`db.version(3)`), additive fields only, no data loss possible.

## Open Questions

- None blocking. Exact SVG thumbnail artwork (precise proportions/styling) is left to implementation-time judgment per design's Thumbnails decision — the requirement is "recognizable block-structure sketch using existing recipe-surface color tokens," not pixel-exact reproduction of the brainstorming docs' inch values.
