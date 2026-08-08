## Why

Ingredient quantity alignment (left/right) is currently a per-recipe setting, but it is a
typographic preference, not recipe data — it responds to nothing about a recipe's own content.
In a bookmaking app, mixed alignment across a printed cookbook's pages reads as a defect. Making
it a single app-wide preference removes that inconsistency and establishes an app-settings home
for future preferences.

## What Changes

- **BREAKING**: Remove the per-recipe `ingredientQtyAlign` control from `RecipeEditor.vue`; the
  field on recipe rows is retired (kept in old rows, never read, never written by new saves).
- **BREAKING**: `recipe/1` HTML export/import stops round-tripping alignment
  (`<meta class="cm-ingredient-qty-align">`); old files with the tag are ignored, old importers
  reading new files fall back to the default. Format version stays `recipe/1`.
- Add a new `settings` Dexie table (`db.version(2)`, unseeded) holding one global preference row.
- Add `src/stores/settings.js` Pinia store and a "Recipe defaults" section in `Settings.vue`
  where the alignment toggle now lives.
- Resolve alignment once in `RecipeSheet.vue` as a `--recipe-qty-align` CSS custom property,
  replacing the `qtyAlign` prop threaded through all 7 `RecipeLayout*.vue` wrappers.
- Harden backup/restore: `inspectBackupFile` gains an explicit compatibility gate (reject a
  backup from a newer database version, or one containing unknown tables) before any destructive
  restore step; `restoreDatabase` passes `acceptVersionDiff: true` so pre-v2 backups keep
  restoring.
- Bound app startup on the settings load (`main.js`, before `app.mount`) instead of loading it
  in `App.vue`'s `onMounted`.

## Capabilities

### New Capabilities

- `app-settings`: a single global app-settings store (starting with ingredient quantity
  alignment) persisted in IndexedDB, applied to every rendered recipe across editor, preview,
  and print.

### Modified Capabilities

- `database-foundation`: table-count requirements ("four relational tables") must name the
  tables rather than hardcode a count now that `settings` is a fifth; add a backup-compatibility
  requirement (reject newer-version/unknown-table backups before any destructive restore step).
- `recipe-export`: `recipe/1` HTML export stops emitting the ingredient-alignment meta tag.
- `recipe-import`: `recipe/1` HTML import stops extracting/setting per-recipe alignment; falls
  back to the app-wide default.

## Impact

- Schema/storage: `src/js/db.js` (`db.version(2)`, `settings` table, `getSettings`/
  `updateSettings`, `RETIRED_RECIPE_FIELDS`).
- New store: `src/stores/settings.js`.
- Rendering: `src/components/RecipeSheet.vue`, `src/components/RecipeIngredients.vue`, and the 7
  `RecipeLayout*.vue` wrappers (prop removed).
- Editor: `src/views/RecipeEditor.vue` (alignment control removed), `src/views/Settings.vue`
  (control added, `TABLE_LABELS`, `confirmRestore`).
- Backup: `src/js/backup.js` (`inspectBackupFile`, `restoreDatabase`).
- Bootstrap: `src/main.js`.
- Export/import: `src/js/recipeExport.js`, `src/js/recipeImport.js`.
- Tests: new `src/js/settings.test.js`; additions to `src/js/backup.roundtrip.test.js`; deletions
  in `src/js/recipeExport.test.js` / `src/js/recipeImport.test.js`.
