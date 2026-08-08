## MODIFIED Requirements

### Requirement: Navigating to the Editor from the Preview
When a user clicks the "Edit Recipe" button inside a recipe preview opened from a cookbook project view, the system SHALL pass the cookbook return context (project ID and recipe ID) to the editor route so that the editor can navigate back to the cookbook on completion. The preview component receives the current project ID from its parent view and encodes it as query parameters on the editor route.

#### Scenario: Navigating to the editor from within a cookbook preview
- **WHEN** a user clicks the "Edit Recipe" button inside a recipe preview that was opened from a cookbook project view
- **THEN** the system closes the preview and navigates to the recipe editor with return-context query parameters encoding the originating project ID and recipe ID

#### Scenario: Navigating to the editor from outside a cookbook context
- **WHEN** a user opens the recipe editor from outside a cookbook project view (e.g., directly from the recipe library)
- **THEN** the system navigates to the recipe editor without return-context query parameters (existing behavior unchanged)

## ADDED Requirements

### Requirement: Automatic Preview Reopen on Return from Editor
When a user returns to the cookbook project view after editing a recipe from within the cookbook context, the system SHALL automatically reopen the recipe preview for the recipe that was just edited.

#### Scenario: Returning to cookbook after editing a recipe
- **WHEN** the user completes editing a recipe (save or back) that was entered from a cookbook preview
- **THEN** the cookbook project view navigates back and automatically reopens the preview for that recipe, as if the user had clicked it again

#### Scenario: Return signal with no matching recipe
- **WHEN** the return-to-cookbook signal references a recipe that is no longer in the cookbook project (e.g., it was removed while the editor was open)
- **THEN** the cookbook project view opens normally without reopening any preview
