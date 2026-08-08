## ADDED Requirements

### Requirement: Cookbook Import Shortcut Entry Point
The cookbook page toolbar SHALL provide an "Import Recipes" action that opens the recipe-import review flow with a return-to-cookbook context. When this action is used and the import is confirmed, the system SHALL navigate back to the cookbook automatically and open the "Add Recipes" picker with the newly-imported recipes pre-checked, ready for the user to confirm adding them to the cookbook.

#### Scenario: Import action is available on the cookbook page
- **WHEN** the user views a cookbook project page
- **THEN** an "Import Recipes" action is visible in the toolbar alongside the existing "Add Recipes" and other toolbar actions

#### Scenario: Import action opens the review flow with cookbook context
- **WHEN** the user selects "Import Recipes" from the cookbook page toolbar
- **THEN** the system opens the staged recipe-import review flow, preserving the originating cookbook's identity so it can redirect back after import

#### Scenario: Confirming import from the cookbook shortcut navigates back with pre-selection
- **WHEN** the user confirms an import that was initiated from the cookbook page and one or more recipes were successfully created
- **THEN** the system navigates back to the originating cookbook page and opens the "Add Recipes" picker with the newly-imported recipes pre-checked

#### Scenario: Confirming import with a mix of successes and failures
- **WHEN** the user confirms an import initiated from the cookbook page and some recipes succeed while others fail
- **THEN** the system navigates back to the cookbook page with only the successfully-created recipes pre-checked in the "Add Recipes" picker; failed recipes are not included in the pre-selection

#### Scenario: User can uncheck pre-selected recipes before adding
- **WHEN** the "Add Recipes" picker opens with pre-checked recipes after a cookbook-shortcut import
- **THEN** the user can uncheck any recipe before confirming, and only checked recipes are added to the cookbook when the user confirms

#### Scenario: Pre-selection does not bypass user confirmation
- **WHEN** the "Add Recipes" picker is opened with pre-checked recipes
- **THEN** no recipes are added to the cookbook until the user explicitly confirms the selection; the pre-check is a convenience, not an automatic add
