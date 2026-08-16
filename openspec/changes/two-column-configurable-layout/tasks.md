## 1. Schema

- [x] 1.1 Add `db.version(4).upgrade(...)` in `src/js/db.js` backfilling `imagePlacement: 'none'` and `notesPlacement: 'none'` on all existing `recipes` rows, mirroring the `db.version(3)`/`fitsOnPage` precedent.
- [x] 1.2 Add `imagePlacement: 'none'` / `notesPlacement: 'none'` defaults to the seed recipe(s) in `db.on('populate', ...)`, alongside the existing `layoutTemplate`/`ingredientColumns`/`imageAspectRatio` defaults.

## 2. Template metadata

- [x] 2.1 Add `tier: 'recommended'` to the existing `default` (`RecipeLayoutDefault`) entry (create it in `LAYOUT_TEMPLATES` if not already present) and a new `two-column` entry, both with `placementConfigurable` set appropriately (`two-column: true`; `default` does not need placement config).
- [x] 2.2 Add `tier: 'legacy'` to all 7 existing entries (`hero-split-balanced`, `hero-split-asymmetric`, `asymmetric-sidebar`, `column-optimized`, `balanced-header`, `dual-column-bottom-split`, `text-only`).
- [x] 2.3 Change `DEFAULT_LAYOUT_TEMPLATE` from `'hero-split-balanced'` to `'default'`.
- [x] 2.4 Export placement option constants (e.g. `PLACEMENT_OPTIONS = [{id:'none',...}, {id:'hero',...}, {id:'left',...}, {id:'right',...}]`) from `templates.js`, following the existing `IMAGE_ASPECT_RATIOS`/`INGREDIENT_QTY_ALIGN_OPTIONS` shape.
- [x] 2.5 Add inline SVG thumbnail markup (or a `RecipeLayoutThumbnail.vue` keyed by template id) for the `default` and `two-column` entries only — small block-structure sketches, not live data-driven previews.

## 3. RecipeLayoutTwoColumn.vue

- [x] 3.1 Build `src/components/RecipeLayoutTwoColumn.vue` implementing the base structure: Title, left column (`RecipeIngredients` without the `recipe` prop + standalone `RecipeQRCode`), right column (`RecipeInstructions`), using flexbox proportions approximating the two-columns-simple.md sketch (~32% left / ~65% right).
- [x] 3.2 Add the `hero` slot: full-width row(s) under the title, rendering image before notes when both are `hero`.
- [x] 3.3 Add `left`/`right` placement rendering for image and notes, inserted into the appropriate column in the documented order (image before notes within a shared column).
- [x] 3.4 Verify every optional element gracefully collapses via `v-if` when the recipe field is absent, independent of its configured placement.
- [x] 3.5 Manually render all 5 documented combinations plus a sample of the remaining 11 (at minimum: both-`hero`, `hero`+`left`, `hero`+`right`) in the browser and visually confirm no overlap, collapse, or overflow surprises. This gates Section 6 — do not proceed to wiring/picker restyling until this passes.
  - Found and fixed a real bug during this check: a lone `RecipeImage` (`height: 100%`) placed alone in a column-direction flex container (the `hero` slot, and the `left`/`right` column slots) has nothing definite to resolve its percentage height against and balloons to consume the page's remaining space, squeezing out everything below it. Fixed by wrapping each image slot in a `div` with an explicit percentage height (`22%` hero / `28%` column) instead of relying on `RecipeImage`'s own `height: 100%` — percentage heights of a flex item reliably resolve against its flex line's already-resolved size, so this wrapper approach works where a bare `aspect-ratio` on the image itself did not (tried first, rejected — see the code comment in `RecipeLayoutTwoColumn.vue`). Verified via screenshots for hero, left+right, and both-hero combinations.

## 4. RecipeEditor.vue — placement controls

- [x] 4.1 Add `imagePlacement`/`notesPlacement` refs, load them from the recipe (`?? 'none'`) on edit, and include them in the save payload — mirroring the existing `ingredientColumns`/`imageAspectRatio` load/save pattern.
- [x] 4.2 Add two placement-picker button groups (reusing the existing button-group markup/style pattern), rendered only when `LAYOUT_TEMPLATES.find(t => t.id === layoutTemplate.value)?.placementConfigurable` is true.
- [x] 4.3 Confirm switching to a non-placement-aware template hides the controls without clearing the underlying `imagePlacement`/`notesPlacement` values (they should only take effect again if the user switches back). Verified by code inspection: `showPlacementControls` only gates rendering, the refs themselves are never reset elsewhere.

## 5. RecipeEditor.vue — layout picker redesign

- [x] 5.1 Split the layout-template picker into a "recommended" section (always visible, larger cards, each rendering its SVG thumbnail from 2.5), a visual divider, and a collapsed "legacy" section behind a "Show more layouts" disclosure.
- [x] 5.2 **Revised**: default the legacy disclosure closed unconditionally, including when editing a recipe whose `layoutTemplate` resolves to a legacy-tier entry (an earlier version of this task auto-opened the disclosure in that case; the user explicitly asked for it to stay closed even then). Verified in-browser: a saved recipe on the `text-only` (legacy) template reopens with "Show more layouts" still collapsed; expanding it shows that template correctly pre-selected.
- [x] 5.3 Confirm selecting a legacy template from inside the expanded disclosure still works identically to today's picker (same `@click="layoutTemplate = tpl.id"` behavior, same live preview update).

## 6. Wiring

- [x] 6.1 Add `RecipeLayoutTwoColumn` and `RecipeLayoutDefault` (if not already present) to `RecipeSheet.vue`'s `LAYOUT_COMPONENTS` map.
- [x] 6.2 Confirm the recommended/legacy split renders correctly end-to-end: new recipe defaults to `default` layout, picker shows 2 recommended cards + collapsed legacy disclosure, both new layouts and all 7 legacy layouts remain fully selectable and render correctly in the live preview. Not separately checked in the system print dialog (`window.print()`) beyond confirming it invokes the same `RecipeSheet`/`PagePreview` components already exercised in the live preview.
  - **Pre-existing bug found, not fixed (out of scope):** the same "lone `RecipeImage` in a column flex container" issue from 3.5 also affects at least the legacy `hero-split-balanced` layout (and likely `hero-split-asymmetric`/`asymmetric-sidebar`, which share the same Title+Image+Notes-in-one-column structure) whenever `imageAspectRatio` is left at its default `'auto'` — confirmed via the same computed-style check. This predates this change entirely (none of these files were touched) and only surfaced because this change's testing used an `'auto'`-ratio image; it's masked whenever a specific aspect ratio (square/landscape/portrait/wide) is selected, since that sets an inline `height: auto` that overrides the bug. Flagged to the user in this change's summary rather than fixed here, per design.md's non-goal of not touching legacy layout internals.

## 7. Verification

- [x] 7.1 Run `npm test` and `npm run build` — both must stay green. (Also fixed one pre-existing test, `recipeImport.test.js`'s "defaults layoutTemplate to the registry default when omitted", which hardcoded the old `'hero-split-balanced'` default.)
- [x] 7.2 Manually exercise: creating a new recipe (confirm `default` tier + layout), switching between recommended and legacy templates, editing an existing recipe already on a legacy template (confirm disclosure auto-opens), and configuring image/notes placement on the two-column template with and without an actual recipe image/notes present.
