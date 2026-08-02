## Context

The Cookbook Detail screen needs a complete redesign to support bulk operations, drag-and-drop chapter/recipe organization, and a global recipe library sidebar. The current UI makes it difficult to manage cookbooks with dozens of chapters and recipes.

## Goals / Non-Goals

**Goals:**
- Implement the "Cookbook Detail v2" HTML design closely in Vue.
- Support bulk selection of recipes in chapters (for move/remove/new chapter).
- Support bulk selection of recipes in the library sidebar (for adding to chapters).
- Implement accessible modals for double-confirmation.
- Add live region announcements for screen readers.

**Non-Goals:**
- Changes to the underlying Dexie database schema (we are only building the UI and using existing DB capabilities).
- Rebuilding the print/export layout engine.

## Decisions

- **Transient State vs Global State:** UI-specific transient state like `selectedIds`, `libSelectedIds`, and drag-and-drop state will be managed locally in `ProjectView.vue` using Vue `ref`s or `reactive`, as this state does not need to be shared across the application.
- **Bulk Database Operations:** We will use `Promise.all` over the existing single-item mutation functions in `db.js` (e.g. `db.removeRecipeFromProject`, `db.addRecipeToProject`, `db.updateRecipe`) if bulk equivalents are not available.
- **Modals:** We will build a unified accessible modal wrapper `Modal.vue` or keep them in-file if they are tightly coupled to the view's state, depending on existing patterns.
- **Library Sidebar Selection:** As per the spec, selection persists across filter changes. We will maintain `libSelectedIds` as a `Set` or dictionary, independently from the filtered results list.

## Risks / Trade-offs

- **Drag and Drop Complexity:** [Risk] Native HTML5 drag and drop can be finicky. → Use simple, declarative event handlers on the row and chapter wrappers to compute drop targets and handle `dragover`/`drop` smoothly.
- **Performance with Many Recipes:** [Risk] Reactivity overhead with hundreds of recipes. → We will ensure we only use Vue's reactivity where needed, avoiding deeply reactive objects if they cause performance issues.
