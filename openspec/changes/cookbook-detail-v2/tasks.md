## 1. Layout and Foundations

- [ ] 1.1 Update `ProjectView.vue` top-level structure to a two-column stack layout (main content + fixed right sidebar).
- [ ] 1.2 Implement the persistent sticky header bar with navigation.
- [ ] 1.3 Add the live region announcement hidden element.

## 2. Shared Components and State

- [ ] 2.1 Add reactive state for `selectedIds` (cookbook recipes) and `libSelectedIds` (library recipes) in `ProjectView.vue` or a related store.
- [ ] 2.2 Create a reusable, accessible `Modal` wrapper (if not already existing) supporting `dialog`/`alertdialog` and focus management.
- [ ] 2.3 Implement the double-confirmation modals (Delete Chapter, Remove Recipe, Bulk Remove).
- [ ] 2.4 Implement the "Edit cookbook details" modal (title, subtitle, accent color swatches), triggered by the title-row pencil icon, replacing the current inline edit form.
- [ ] 2.5 Implement the shared "Chapter name form" modal used for New Chapter, Rename Chapter, and both "new chapter from selection" flows (heading/subheading adapt per context), replacing the current inline chapter-rename input.
- [ ] 2.6 Confirm the legacy "Add recipes from Library" modal (`addRecipes` state in the source design) is out of scope for this change — its entry point was removed in the design in favor of the quick-add row, library drag-and-drop, and the two library bulk actions. Do not build a trigger for it.

## 3. Core Screen Elements

- [ ] 3.1 Implement the Chapter Card component (drag handles, up/down move buttons, header row, "Select all", "Sort A-Z").
- [ ] 3.2 Implement the Recipe Row component (checkbox, drag handle, overflow menu).
- [ ] 3.3 Implement the "New Chapter" quick-add form above the Recipe Library panel.

## 4. Recipe Library Sidebar

- [ ] 4.1 Build the Recipe Library sidebar panel (search, list of recipes, quick-add buttons).
- [ ] 4.2 Implement the Library bulk action bar (fixed at the bottom of the sidebar): "Add to chapter…" select (applies immediately), "Add to Misc." button, and "New chapter…" button (opens the shared chapter name form in "new chapter from library selection" mode, see 2.5).

## 5. Main Content Bulk Operations

- [ ] 5.1 Implement the in-cookbook bulk action bar (fixed to viewport bottom).
- [ ] 5.2 Implement logic for bulk moving, bulk removing, and creating a new chapter from selection (opens the shared chapter name form from 2.5, then connects to database/store actions).

## 6. Drag and Drop

- [ ] 6.1 Implement HTML5 drag-and-drop for reordering chapters (in addition to the up/down move buttons from 3.1, which remain the keyboard-accessible path since native drag-and-drop is not keyboard-operable).
- [ ] 6.2 Implement HTML5 drag-and-drop for recipes (reordering within a chapter, moving to another chapter, adding from library).
- [ ] 6.3 Ensure all drag operations trigger live region announcements.
