## ADDED Requirements

### Requirement: Recipe Import Entry Point
The Global Recipe Library toolbar SHALL provide an "Import Recipes" action, alongside
the existing "New Recipe" action, that opens the recipe import review flow.

#### Scenario: Import action is available in the library toolbar
- **WHEN** the user views the Global Recipe Library
- **THEN** an "Import Recipes" action is visible in the toolbar next to "+ New Recipe"

#### Scenario: Import action opens the review flow
- **WHEN** the user selects "Import Recipes" from the library toolbar
- **THEN** the system opens the staged recipe-import review flow
