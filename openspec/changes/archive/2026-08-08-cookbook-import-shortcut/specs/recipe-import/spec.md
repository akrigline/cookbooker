## MODIFIED Requirements

### Requirement: Recipe Import Entry Point
The Global Recipe Library toolbar SHALL provide an "Import Recipes" action, alongside the existing "New Recipe" action, that opens the recipe import review flow. The recipe import review flow SHALL also support being opened with an optional caller context (identifying a return destination and project ID). When this context is present and the import is confirmed, the system SHALL navigate to the specified return destination with the IDs of the successfully-created recipes, instead of remaining in the library view; when no caller context is present, the flow behaves as before.

#### Scenario: Import action is available in the library toolbar
- **WHEN** the user views the Global Recipe Library
- **THEN** an "Import Recipes" action is visible in the toolbar next to "+ New Recipe"

#### Scenario: Import action opens the review flow
- **WHEN** the user selects "Import Recipes" from the library toolbar
- **THEN** the system opens the staged recipe-import review flow

#### Scenario: Import from library with no caller context stays in library view after confirm
- **WHEN** the user opens the import flow from the library toolbar (no return-to context) and confirms the import
- **THEN** the system remains in or navigates within the library view after import, as before

#### Scenario: Import opened with a return-to-cookbook context navigates back on confirm
- **WHEN** the import flow was opened with a return-to-cookbook caller context and the user confirms the import
- **THEN** the system navigates back to the originating cookbook page, passing the IDs of the successfully-created recipes, instead of staying in the library view
