# recipe-library

## Purpose

Maintains a centralized catalog of all user recipes, supporting real-time search, permanent deletion, and global propagation of edits to every cookbook project that references a recipe.

## Requirements

### Requirement: Global Recipe Library State
The system SHALL maintain a centralized Global Recipe Library containing all user recipes. Editing a recipe from any view or cookbook project context MUST update its single master record, causing the updates to propagate globally to all associated cookbook projects.

#### Scenario: Global Edit Propagation
- **WHEN** the user edits a recipe's title or ingredients from within a specific cookbook project
- **THEN** the system updates the master recipe in the Global Library, and the changes are immediately visible across all projects using that recipe

### Requirement: Deleting a Recipe Permanently
The user SHALL be able to permanently delete a recipe from the Global Recipe Library. Deleting a recipe MUST permanently remove it from the central library and automatically withdraw it from all cookbooks that contain it.

#### Scenario: Deleting a recipe from the library
- **WHEN** the user deletes "Grandma's Apple Pie" from the Global Recipe Library
- **THEN** the recipe is permanently removed from the central library and is no longer visible inside the "Holiday Baking" or "Family Classics" cookbooks.

### Requirement: Recipe Library Search
The Global Recipe Library SHALL support real-time searching by recipe title or ingredients.

#### Scenario: Searching library by title
- **WHEN** the user types "Spaghetti" in the search query
- **THEN** the library view updates to display only recipes whose titles or ingredients match "Spaghetti".

### Requirement: Recipe Import Entry Point
The Global Recipe Library toolbar SHALL provide an "Import Recipes" action, alongside
the existing "New Recipe" action, that opens the recipe import review flow. The recipe
import review flow SHALL also support being opened with an optional caller context
(identifying a return destination and project ID). When this context is present and
the import is confirmed, the system SHALL navigate to the specified return destination
with the IDs of the successfully-created recipes, instead of remaining in the library
view; when no caller context is present, the flow behaves as before.

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

### Requirement: Single-Page Fit Warning Badge
The Global Recipe Library SHALL display a warning badge on a recipe list item when that recipe's persisted `fitsOnPage` field is `false`. No badge SHALL be shown when `fitsOnPage` is `null` (not yet measured) or `true`.

#### Scenario: Badge shown for a recipe that overflows a page
- **WHEN** the Global Recipe Library renders a recipe whose `fitsOnPage` field is `false`
- **THEN** a warning badge (triangle-with-`!` icon) is displayed next to the recipe's title in its list row

#### Scenario: No badge for a recipe that fits
- **WHEN** the Global Recipe Library renders a recipe whose `fitsOnPage` field is `true`
- **THEN** no warning badge is displayed for that recipe

#### Scenario: No badge for an unmeasured recipe
- **WHEN** the Global Recipe Library renders a recipe whose `fitsOnPage` field is `null`
- **THEN** no warning badge is displayed for that recipe
