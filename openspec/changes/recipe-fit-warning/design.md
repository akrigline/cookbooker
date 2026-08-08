## Context

Recipes are constrained to a single printed page (`print-and-export` spec: "Single-Page Recipe Layout Constraint"). When content overflows, the user currently has no warning. This change introduces a client-side overflow detector that runs after every recipe write and persists a `fitsOnPage` flag on the recipe record, which list-item components use to display a warning badge.

## Goals / Non-Goals

**Goals:**
- Persist a `fitsOnPage` boolean (nullable) on every recipe record.
- Measure overflow client-side after every write (import, create, edit save) without blocking the UI.
- Display a warning badge on list items in the library and cookbook views when `fitsOnPage === false`.
- Leave `fitsOnPage: null` for pre-existing recipes until they are next edited (no bulk retroactive scan at startup).

**Non-Goals:**
- Auto-trimming or auto-reformatting recipes to fit.
- Showing any warning inside the recipe editor itself (the editor already has a live preview).
- Retro-scanning existing recipes on app load (too expensive; users will encounter the flag naturally on next edit).
- A separate print-preview warning modal (the badge in list items is sufficient for the current scope).

## Decisions

- **`fitsOnPage` field semantics:** Three states — `null` (never measured, no badge shown), `true` (fits, no badge), `false` (overflows, badge shown). Null prevents false-positive badges on pre-existing recipes that have never been measured.

- **Measurement approach:** A hidden `<div>` injected into `document.body` styled to exactly the recipe sheet's print dimensions (`width: 648px; height: 864px` — matching the 8.5×11 in sheet at 96 dpi minus standard margins, consistent with whatever the `RecipeSheet` component already uses for print). The existing `RecipeSheet` (or equivalent print-render component) is mounted into this container via a temporary Vue app instance, and after a `nextTick`, overflow is detected as `scrollHeight > clientHeight`. The container is removed immediately after measurement. This avoids iframes (which have cross-origin restrictions for data URLs and require a load event), and reuses the same component the print system uses, so the measurement is always in sync with what actually prints.

- **When measurement runs:** After `db.addRecipe` / `db.updateRecipe` resolves (i.e., after the DB write is confirmed), the caller fires `measureAndPersistFit(recipeId)`. This is fire-and-forget from the calling code's perspective — the badge updates as a reactive consequence of the store updating `fitsOnPage` on the recipe record. If measurement fails (e.g., component not yet loaded), the field stays `null`.

- **Where measurement is triggered:** Three call sites — (1) `recipesStore.addRecipe` (manual create), (2) `recipesStore.updateRecipe` (editor save), (3) the import-confirm handler in `RecipeImport.vue` (for each recipe written during import confirm). All three already have the recipe ID available post-write.

- **Warning badge component:** `RecipeFitWarningBadge.vue` — a `<span>` with a triangle/exclamation SVG icon, a tooltip ("This recipe may overflow a single print page"), and minimal styling. It takes no props beyond being rendered by the parent; the parent decides when to show it based on `recipe.fitsOnPage === false`.

- **DB migration:** A `db.version(3)` block with an `.upgrade()` callback that calls `tx.recipes.toCollection().modify({ fitsOnPage: null })` to initialize the field on all existing rows. New rows created after the migration get `fitsOnPage: null` explicitly in every `db.addRecipe` call.

## Risks / Trade-offs

- **Measurement timing vs. reactivity:** If the hidden container renders asynchronously (e.g., images load), the measurement may undercount height. Mitigation: measure after `nextTick` plus a short `requestAnimationFrame` settle; for recipes with images, the image is a fixed-height placeholder so this is deterministic.
- **Hidden container flash:** Briefly injecting a visible-sized div could cause a scroll jump. Mitigation: set `position: fixed; top: -9999px; left: -9999px; visibility: hidden` on the container so it is off-screen and paint-suppressed.
- **Stale `fitsOnPage` after image upload:** If a user adds an image without going through the editor save path, the flag won't update. Accepted trade-off — image upload is part of the edit-save flow in this app, so this path is covered.
