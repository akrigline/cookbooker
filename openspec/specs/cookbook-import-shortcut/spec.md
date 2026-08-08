# cookbook-import-shortcut

## Purpose

Lets a user import recipes directly from a cookbook page and, after a successful
import, automatically opens the "Add Recipes" picker with the newly-imported
recipes pre-checked — collapsing the previously multi-step round-trip (library
import → back to cookbook → find and re-select the new recipes → confirm) into a
single, linear flow. Reuses the existing library-based import components and logic
rather than duplicating them.

## Requirements

### Requirement: Cookbook Import Shortcut Entry Point
The cookbook page toolbar SHALL provide an "Import Recipes" action that opens the recipe-import review flow with a return-to-cookbook context. When this action is used and the import is confirmed, the system SHALL navigate back to the cookbook automatically and open the "Add Recipes" picker with the newly-imported recipes pre-checked, ready for the user to confirm adding them to the cookbook.

#### Scenario: Import action is available on the cookbook page
- **WHEN** the user views a cookbook project page
- **THEN** an "Import Recipes" action is visible in the toolbar alongside the existing "Add Recipes" and other toolbar actions

#### Scenario: Import action opens the review flow with cookbook context
- **WHEN** the user selects "Import Recipes" from the cookbook page toolbar
- **THEN** the system opens the staged recipe-import review flow, preserving the originating cookbook's identity (via a `?returnToProject` URL query param, the same return-context mechanism the recipe editor uses) so it can redirect back after import

#### Scenario: Cookbook context survives a page refresh
- **WHEN** the user reloads the import review page after arriving via the cookbook shortcut, before confirming
- **THEN** the "Back to Cookbook" link and the post-confirm return destination still point at the originating cookbook, because the return context is carried in the URL rather than in-memory route state

#### Scenario: Back link reflects the entry point
- **WHEN** the recipe-import review flow was opened via the cookbook shortcut
- **THEN** the back link reads "Back to Cookbook" and returns to the originating cookbook page, instead of the default "Back to Recipe Library" link shown when import is opened from the library toolbar

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
