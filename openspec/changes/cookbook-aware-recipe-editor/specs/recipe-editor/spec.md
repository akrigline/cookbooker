## MODIFIED Requirements

### Requirement: Recipe Editor Back Navigation
The recipe editor SHALL display a back-navigation control. When the editor was entered from within a cookbook project view (indicated by return-context query parameters on the route), the control MUST be labelled **"Back to Cookbook"** and navigate to the originating cookbook project view. When entered from the recipe library (no return-context parameters), the control MUST be labelled **"Back to Recipe Library"** and navigate to the recipe library.

#### Scenario: Back navigation label when entering from cookbook
- **WHEN** a user opens the recipe editor by clicking "Edit Recipe" from a cookbook recipe preview
- **THEN** the editor displays a back button labelled "Back to Cookbook" rather than "Back to Recipe Library"

#### Scenario: Back navigation label when entering from library
- **WHEN** a user opens the recipe editor directly from the recipe library
- **THEN** the editor displays a back button labelled "Back to Recipe Library"

## ADDED Requirements

### Requirement: Context-Aware Post-Save Navigation
When the recipe editor was entered from within a cookbook project view, saving the recipe SHALL navigate back to the originating cookbook project view (with a signal to reopen the recipe preview), rather than to the recipe library.

#### Scenario: Saving a recipe entered from a cookbook
- **WHEN** a user edits a recipe that was opened from a cookbook preview and clicks Save
- **THEN** the system saves the recipe and navigates back to the cookbook project view, passing a signal to reopen the preview for that recipe

#### Scenario: Saving a recipe entered from the library
- **WHEN** a user edits a recipe that was opened from the recipe library and clicks Save
- **THEN** the system saves the recipe and navigates to the recipe library (existing behavior unchanged)
