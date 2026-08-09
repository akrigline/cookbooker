# recipe-preview

## Purpose

Provides a read-only preview of a recipe directly within the cookbook view context, allowing users to glance at recipe contents without navigating away to the full editor.

## Requirements

### Requirement: Cookbook Recipe Preview Dialog
The system SHALL present a read-only preview dialog when a user clicks on a recipe from within a cookbook project view, rather than immediately routing to the recipe editor. The preview SHALL also expose prev/next navigation controls to move between recipes in the same chapter without closing the preview.

#### Scenario: Opening the preview
- **WHEN** a user clicks on a recipe item in a cookbook chapter
- **THEN** the preview opens displaying the recipe's title, ingredients, instructions, and other details in a read-only format

#### Scenario: Navigating to the editor from the preview
- **WHEN** a user clicks the "Edit Recipe" button inside the recipe preview
- **THEN** the preview closes and the system navigates to the full recipe editor page for that recipe

#### Scenario: Closing the preview
- **WHEN** a user dismisses the recipe preview (e.g., by clicking outside, pressing Escape, or clicking a close button)
- **THEN** the preview closes and the user remains on the cookbook project view, maintaining their previous scroll position and context

### Requirement: Prev/Next Navigation Controls
The system SHALL display Previous and Next navigation controls within the open recipe preview that allow the user to move to the adjacent recipe in the same chapter without closing and reopening the preview.

#### Scenario: Navigating to the next recipe
- **WHEN** a user clicks the Next control in the recipe preview
- **AND** there is a subsequent recipe in the same chapter
- **THEN** the preview updates to display the next recipe in chapter order

#### Scenario: Navigating to the previous recipe
- **WHEN** a user clicks the Previous control in the recipe preview
- **AND** there is a preceding recipe in the same chapter
- **THEN** the preview updates to display the previous recipe in chapter order

#### Scenario: Next control disabled at last recipe
- **WHEN** the currently-displayed recipe is the last recipe in its chapter
- **THEN** the Next control SHALL be disabled or hidden

#### Scenario: Prev control disabled at first recipe
- **WHEN** the currently-displayed recipe is the first recipe in its chapter
- **THEN** the Previous control SHALL be disabled or hidden

### Requirement: Keyboard Navigation in Preview
The system SHALL support keyboard arrow-key navigation when the recipe preview is open, so users can navigate between chapter recipes without using the mouse.

#### Scenario: Arrow-right advances to next recipe
- **WHEN** the recipe preview is open
- **AND** the user presses the Right Arrow key
- **AND** there is a subsequent recipe in the same chapter
- **THEN** the preview updates to display the next recipe in chapter order

#### Scenario: Arrow-left returns to previous recipe
- **WHEN** the recipe preview is open
- **AND** the user presses the Left Arrow key
- **AND** there is a preceding recipe in the same chapter
- **THEN** the preview updates to display the previous recipe in chapter order

#### Scenario: Arrow keys do nothing at chapter boundaries
- **WHEN** the recipe preview is open
- **AND** the currently-displayed recipe is at a chapter boundary (first or last)
- **AND** the user presses the corresponding arrow key (Left at first, Right at last)
- **THEN** no navigation occurs and no error is shown

### Requirement: Navigating to the Editor from the Preview
When a user clicks the "Edit Recipe" button inside a recipe preview opened from a cookbook project view, the system SHALL pass the cookbook return context (project ID and recipe ID) to the editor route so that the editor can navigate back to the cookbook on completion. The preview component receives the current project ID from its parent view and encodes it as query parameters on the editor route.

#### Scenario: Navigating to the editor from within a cookbook preview
- **WHEN** a user clicks the "Edit Recipe" button inside a recipe preview that was opened from a cookbook project view
- **THEN** the system closes the preview and navigates to the recipe editor with return-context query parameters encoding the originating project ID and recipe ID

#### Scenario: Navigating to the editor from outside a cookbook context
- **WHEN** a user opens the recipe editor from outside a cookbook project view (e.g., directly from the recipe library)
- **THEN** the system navigates to the recipe editor without return-context query parameters (existing behavior unchanged)

### Requirement: Automatic Preview Reopen on Return from Editor
When a user returns to the cookbook project view after editing a recipe from within the cookbook context, the system SHALL automatically reopen the recipe preview for the recipe that was just edited.

#### Scenario: Returning to cookbook after editing a recipe
- **WHEN** the user completes editing a recipe (save or back) that was entered from a cookbook preview
- **THEN** the cookbook project view navigates back and automatically reopens the preview for that recipe, as if the user had clicked it again

#### Scenario: Return signal with no matching recipe
- **WHEN** the return-to-cookbook signal references a recipe that is no longer in the cookbook project (e.g., it was removed while the editor was open)
- **THEN** the cookbook project view opens normally without reopening any preview
