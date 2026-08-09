## Why

Recipes in this app are designed to fit on a single printed page — this is a core constraint of the `print-and-export` capability ("Single-Page Recipe Layout Constraint"). However, when a recipe's content is long enough to overflow that single page, users have no indication of this problem until they actually attempt to print. At that point, the recipe silently bleeds onto a second sheet, which breaks the compiled cookbook's page layout and wastes paper.

A small, persistent warning annotation on recipe list items — visible in the Global Recipe Library and in every cookbook that contains the recipe — would surface this problem early, directly where the user manages recipes. Users can then trim instructions, shorten notes, or adjust the layout template *before* printing, rather than discovering the overflow at print time.

## What Changes

- A `fitsOnPage` boolean field (nullable: `null` = not yet measured) is persisted on each recipe record in IndexedDB.
- After any write that creates or modifies a recipe (import confirm, manual create, editor save), the system measures whether the saved recipe's rendered sheet would overflow a single print page, and writes the result back as `fitsOnPage`.
- A small warning badge (triangle-with-`!` icon) is displayed on recipe list items in the **Global Recipe Library** and **cookbook chapter recipe lists** when `fitsOnPage` is `false`.
- No warning is shown when `fitsOnPage` is `null` (pre-existing recipes not yet measured, or measurement in progress).

## Capabilities

### New Capabilities

- `recipe-fit-warning`: A system-level quality check that detects recipe content overflow relative to the single-page print constraint and surfaces the warning in all list views where a recipe appears.

### Modified Capabilities

- `recipe-library`: Recipe list items gain an optional overflow warning badge.
- `cookbook-management`: Cookbook chapter recipe rows gain the same overflow warning badge.
- `recipe-import`: Post-import commit triggers fit measurement for each newly created recipe.
- `print-and-export`: The single-page constraint (already specified) is now actively enforced with a proactive warning rather than silently violated.

## Impact

- **`src/js/db.js`** — add a `version(3)` migration that adds `fitsOnPage: null` to all existing recipe rows and registers the new field.
- **`src/js/recipeFitMeasure.js`** (new) — utility that renders a recipe sheet in a hidden off-screen container at exact print dimensions and resolves `true`/`false` based on whether scroll height exceeds client height.
- **`src/stores/recipesStore.js`** (or equivalent) — after any recipe write, calls the measurement utility and persists the result via `db.updateRecipe`.
- **`src/components/RecipeFitWarningBadge.vue`** (new) — a small, self-contained warning icon component rendered when `fitsOnPage === false`.
- **`src/views/RecipeLibrary.vue`** (or equivalent) — recipe list items receive the badge.
- **`src/views/ProjectView.vue`** (or equivalent) — cookbook chapter recipe rows receive the badge.
- **`openspec/specs/`** — delta specs for `recipe-library`, `cookbook-management`, `recipe-import`, and `print-and-export` noting the new warning behavior.
