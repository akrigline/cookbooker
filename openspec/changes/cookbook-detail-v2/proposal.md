## Why

The current cookbook detail screen lacks bulk management capabilities, making it tedious to manage cookbooks with dozens of chapters and recipes. This redesign introduces bulk operations for moving and removing recipes, as well as a streamlined drag-and-drop interface and right-side recipe library panel, to make organizing large cookbooks efficient.

## What Changes

- Redesigned Cookbook Detail screen layout with a sticky header and two-column stack layout.
- Added a fixed Recipe Library right sidebar replacing the top-of-page search, allowing persistent selection and bulk add operations.
- Added bulk selection checkboxes for recipes within chapters to enable bulk "Move to", "New chapter from these", and "Remove" actions via a sticky bottom bar.
- Replaced instant removals with double-confirmation dialogs for all recipe removals.
- Added live region announcements for accessibility during drag-and-drop and state-changing actions.
- Introduced a "New chapter" quick-add form that sits above the Recipe Library panel.

## Capabilities

### New Capabilities
- `bulk-recipe-operations`: Bulk selection and operations for recipes (bulk move to chapter, bulk remove from cookbook, create new chapter from selection).

### Modified Capabilities
- `book-organization`: Added bulk re-assignment and removal, plus drag-and-drop from the library directly onto chapters.
- `cookbook-management`: The Recipe to Project Curation flow is updated to support bulk selection from the Library and directly dropping/adding into specific chapters (instead of only the Miscellaneous chapter).

## Impact

- `src/views/ProjectView.vue` (the current cookbook detail screen) will be heavily redesigned.
- State management (`src/stores/*.js`) will need to support tracking `selectedIds` for both the cookbook chapters and the library pool independently.
- New accessible modal components for double confirmations and chapter renaming/creation.
- Updates to `src/js/db.js` or Pinia stores to handle bulk database writes (bulk move, bulk add, bulk delete).
