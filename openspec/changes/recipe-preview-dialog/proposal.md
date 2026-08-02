## Why

Currently, when opening a recipe from a cookbook view, the user is taken directly to the full recipe edit page. This can be jarring and overwhelming when a user just wants to quickly glance at a recipe's contents. Providing a read-only preview in a dialog allows users to easily view recipes while remaining in the context of their cookbook, with an optional path to edit if needed.

## What Changes

- Clicking a recipe in a cookbook view will open a read-only preview dialog instead of navigating to the edit page.
- The preview dialog will display the recipe's details (ingredients, directions, etc.).
- The preview dialog will include a prominent link/button to navigate to the full recipe edit page.

## Capabilities

### New Capabilities
- `recipe-preview`: Viewing a recipe in a read-only dialog format from a cookbook context.

### Modified Capabilities

## Impact

- **UI/UX**: New dialog component for recipe preview. Changes to click handlers in the cookbook view.
- **Routing**: Opening a recipe from the cookbook will no longer change the route, unless the user explicitly clicks to edit from the preview.
