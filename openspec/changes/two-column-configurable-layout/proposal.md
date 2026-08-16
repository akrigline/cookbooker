## Why

The two-column recipe layout family (title + narrow ingredients/QR column + wide instructions column) has five distinct variants in `brainstorming/recipe-layout-playground/finalized-designs/two-columns/`, differing only in where the optional image and Chef's Notes sit (full-width hero row, left column, or right column). Building one hardcoded `RecipeLayout*.vue` per variant — as the existing 6 layouts + the just-added `RecipeLayoutDefault.vue` do — would mean 16 possible components (4 image placements × 4 notes placements) to cover every combination a recipe author might want, most of which aren't even in the reference docs. A single component driven by two independent placement settings (`imagePlacement`, `notesPlacement`, each `none`/`hero`/`left`/`right`) reproduces all 5 documented variants from one set of rules and covers the other 11 combinations for free.

Separately, the app now has a clear intended mental model going forward — "one column" (`RecipeLayoutDefault.vue`) and "two column" (this change's `RecipeLayoutTwoColumn.vue`), each shaped by placement config rather than picking from a wall of near-identical fixed layouts. The existing 7 layouts (`hero-split-balanced`, `hero-split-asymmetric`, `asymmetric-sidebar`, `column-optimized`, `balanced-header`, `dual-column-bottom-split`, `text-only`) should keep working for anyone already using them, but shouldn't be presented with equal visual weight to the two recommended layouts going forward.

## What Changes

- Add a new `RecipeLayoutTwoColumn.vue` component implementing the two-column base structure (Title → left column: ingredients + QR; right column: instructions) plus the image/notes slot model.
- Add two new per-recipe fields, `imagePlacement` and `notesPlacement`, each one of `none` | `hero` | `left` | `right`, defaulting to `none`. These only have visible effect when `layoutTemplate` is the two-column template; they persist on the recipe regardless (harmless no-ops under other templates, consistent with how `ingredientColumns`/`imageAspectRatio` already persist unconditionally).
- Extend `src/js/templates.js`'s `LAYOUT_TEMPLATES` entries with an optional flag marking a template as accepting placement config, so `RecipeEditor.vue` can conditionally show the two new controls without hardcoding the template id in the view.
- Add two placement-picker controls to `RecipeEditor.vue`, shown only when the active `layoutTemplate` declares placement support, mirroring the existing button-group pattern used for `ingredientColumns`/`imageAspectRatio`.
- Backfill existing recipe rows with `imagePlacement: 'none'` / `notesPlacement: 'none'` via a Dexie `upgrade()` step (no `.stores()` index change needed — `recipes` has no field-level schema — following the `db.version(3)` precedent that backfilled `fitsOnPage`).
- Wire **both** `RecipeLayoutDefault.vue` (one-column, built just before this change) and `RecipeLayoutTwoColumn.vue` into `RecipeSheet.vue`'s `LAYOUT_COMPONENTS` map and `templates.js`'s `LAYOUT_TEMPLATES`, tagged `tier: 'recommended'`. This **reverses** the "land unwired" plan from this change's first draft — see design.md's revised Decision on this. Both become selectable, and `DEFAULT_LAYOUT_TEMPLATE` moves from `hero-split-balanced` to `default` for newly created recipes (existing recipes keep whatever `layoutTemplate` they already have — no data migration of that field).
- Tag the existing 7 layouts `tier: 'legacy'` in `templates.js`. They remain fully functional and selectable — this is a UI-prominence change, not a removal or deprecation warning shown to the end user beyond reduced visual weight.
- **BREAKING (visual, not data)**: Redesign `RecipeEditor.vue`'s layout-template picker: `recommended`-tier templates render as larger cards with an inline SVG thumbnail sketching their block structure, separated by a divider from `legacy`-tier templates, which are collapsed by default behind a "Show more layouts" disclosure toggle (rendered in the current smaller text-only button style). The disclosure stays closed by default unconditionally, even when editing a recipe that already has a legacy template selected — that template still shows correctly selected once the section is expanded, but doesn't force it open on its own.
- Add small inline SVG preview thumbnails for the 2 recommended templates only (legacy templates keep no thumbnail, consistent with their de-emphasized treatment).

## Capabilities

### New Capabilities
(none — the new layout is additive UI/rendering, not a new user-facing capability domain)

### Modified Capabilities
- `recipe-editor`: extends the "Layout Template Assignment" requirement — some templates now carry additional per-recipe configuration (image/notes placement) beyond the template id itself, and the editor must expose controls for that configuration only when relevant. Also adds template tiering (recommended vs. legacy) governing default visibility and visual presentation in the picker, without removing legacy templates' selectability.

## Impact

- **New files**: `src/components/RecipeLayoutTwoColumn.vue`; small SVG preview assets/markup for the 2 recommended templates (inline in `templates.js` or a new `RecipeLayoutThumbnail.vue`, decided in design.md).
- **Modified**: `src/js/templates.js` (template metadata shape: `tier`, `placementConfigurable`, preview markup; `DEFAULT_LAYOUT_TEMPLATE` value), `src/views/RecipeEditor.vue` (picker redesign + new placement controls + save/load wiring), `src/components/RecipeSheet.vue` (`LAYOUT_COMPONENTS` map gains both new entries), `src/js/db.js` (schema version bump + backfill).
- **Not modified in this change**: `RecipeIngredients.vue` (QR stays optionally-nested there for all legacy-tier templates; the two recommended layouts simply never pass `recipe` to it, same pattern already used by `RecipeLayoutDefault.vue`).
- No changes to recipe export/import formats — the two new fields follow the same optional-field tolerance already established for `layoutTemplate`/`ingredientColumns`/`imageAspectRatio`. No existing recipe's stored `layoutTemplate` value changes; only the default assigned to *new* recipes changes.
