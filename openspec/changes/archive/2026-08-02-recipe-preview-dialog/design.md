## Context

When users browse their cookbooks and click on a recipe to view it, they are currently routed directly to the recipe editor. This disrupts the reading flow, particularly when they just want to quickly see ingredients or instructions without intending to make edits. Introducing a recipe preview dialog will solve this by providing a read-only view that keeps the user anchored in the cookbook context.

## Goals / Non-Goals

**Goals:**
- Provide a quick, read-only preview of a recipe from the cookbook view.
- Maintain the user's context by displaying the preview in a dialog overlay rather than navigating away.
- Provide a clear call-to-action (CTA) to edit the recipe, transitioning the user to the full recipe editor.

**Non-Goals:**
- Allowing edits directly within the preview dialog.
- Changing the layout or look of the actual recipe editor page.
- Adding preview capabilities to the Global Recipe Library (this specifically targets the cookbook view, though it could be extended later).

## Decisions

- **Dialog Component**: We will use a standard modal/dialog component (likely leveraging existing UI components if available) to display the recipe content. 
  - *Rationale*: A dialog overlay keeps the user on the current page, ensuring they don't lose their place in the cookbook.
- **Read-Only Rendering**: The preview will reuse the visual layout template logic that formats the recipe for print/viewing, rather than re-creating a custom read-only display.
  - *Rationale*: This ensures the preview is consistent with how the recipe looks when printed or viewed elsewhere.
- **Navigation Handler Update**: The click handler on recipe items in the cookbook view will be updated to open the dialog state instead of pushing a new route to the router.
  - *Rationale*: Intercepting the click is the simplest way to introduce the preview without changing the underlying DOM structure heavily.
- **Edit Button Transition**: A primary "Edit Recipe" button will be placed in the dialog (e.g., in a fixed footer or header). Clicking it will close the dialog and execute the original navigation to the recipe editor.

## Risks / Trade-offs

- [Risk] **Performance with large recipes or many images**: Opening a dialog might feel sluggish if the recipe component is heavy.
  - *Mitigation*: Ensure the preview component is lazily loaded or optimized, and avoid rendering the entire edit stack.
- [Risk] **Mobile Viewport Constraints**: Dialogs can be tricky on small screens.
  - *Mitigation*: Ensure the dialog is responsive, potentially turning into a full-screen overlay on mobile devices to maximize reading space.
