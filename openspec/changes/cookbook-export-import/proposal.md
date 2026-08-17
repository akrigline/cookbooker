## Why

Cookbooker only offers whole-database backup/restore (Settings) or single-recipe
export/import. There's no way to move one cookbook — its chapters, recipe order, and
recipes — to another device or share it with someone else without either handing over
the entire database or re-importing every recipe one at a time and manually rebuilding
the chapter structure.

## What Changes

- Add a "cookbook/1" HTML export format that wraps the existing `recipe/1` microformat:
  one self-contained `.html` file per cookbook, containing the cookbook's settings
  (title, subtitle, accent color, cover template, page-numbers/double-sided flags) and
  its chapters (name + order), each chapter holding its recipes as ordinary `recipe/1`
  articles.
- Add an "Export Cookbook" action on the cookbook page that downloads this file.
- Add an "Import Cookbook" action (cookbooks list) that reads such a file and creates a
  **brand-new** cookbook from it — new project, chapters, and recipe rows. Imported
  recipes are never matched or deduped against the existing recipe library, even when a
  recipe looks identical to one already there.
- A recipe article that fails to parse (missing title/instructions) is skipped and
  reported in an import summary rather than failing the whole import.
- Refactor `recipeExport.js`'s single-recipe HTML builder so the `<article
  data-cm-format="recipe">` markup it produces is a shared helper, reused by the new
  cookbook exporter — the markup itself is unchanged, so this is implementation reuse,
  not a behavior change to `recipe-export`.

## Capabilities

### New Capabilities
- `cookbook-export`: Exporting a whole cookbook (settings, chapters, recipes) as a
  single self-contained `cookbook/1` HTML file.
- `cookbook-import`: Importing a `cookbook/1` HTML file as a brand-new cookbook, with
  per-recipe parse-failure reporting.

### Modified Capabilities
(none — the `recipe/1` article format and its export/import contract are unchanged;
`recipe-export`'s markup-building logic is reused, not altered)

## Impact

- New: `src/js/cookbookExport.js`, `src/js/cookbookImport.js`, one new transactional
  `db.js` function (`importCookbook`).
- Modified: `src/js/recipeExport.js` (extract shared article-building helper),
  `src/views/ProjectView.vue` (new "Export Cookbook" button), cookbooks list view (new
  "Import Cookbook" action + file picker + summary banner), `src/router/index.js` if a
  dedicated import route is added.
- No changes to IndexedDB schema, to the `recipe/1` format's contract, or to existing
  whole-database backup/restore.
