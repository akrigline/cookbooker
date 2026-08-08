# cookbook-management

## Purpose

Creates and manages multiple independent cookbook projects, including project metadata (title, subtitle), cover layout and accent color styling, a global page-number toggle, and curating which recipes from the Global Recipe Library belong to each project.
## Requirements
### Requirement: Cookbook Project CRUD
The system SHALL support creating, listing, updating, and deleting multiple independent cookbook projects. Deleting a cookbook project MUST NOT delete recipes from the Global Recipe Library.

#### Scenario: Creating a new cookbook project
- **WHEN** the user creates a cookbook project with the title "My Summer Recipes"
- **THEN** the system adds the project to the local database and automatically initializes its "Miscellaneous" default chapter.

#### Scenario: Deleting a cookbook project
- **WHEN** the user deletes a cookbook project
- **THEN** the system deletes the project, its chapters, and project associations from the database, but leaves all associated recipes intact within the Global Recipe Library.

### Requirement: Cookbook Project Metadata Configuration
Each cookbook project SHALL store configuration settings containing a Title and an optional Subtitle.

#### Scenario: Saving project metadata updates
- **WHEN** the user updates the title to "Holiday Baking 2026" and subtitle to "Sweet Treats"
- **THEN** the system persists these settings for the active cookbook project.

### Requirement: Cookbook Accent Color and Layout Cover Styling
Each cookbook project SHALL allow the selection of a primary accent color from a curated palette and a cover design layout template. The active accent color MUST be applied to the cover design elements, Table of Contents headers, and chapter dividers.

#### Scenario: Updating accent color and cover layout
- **WHEN** the user selects the "Forest Green" accent color and the "Classic Border" cover layout template
- **THEN** the project configuration updates and the real-time print preview reflects these style properties.

### Requirement: Page Number Configuration Toggle
A cookbook project SHALL support a boolean setting to toggle page numbers on or off globally.

#### Scenario: Enabling page numbers
- **WHEN** the user sets page numbers to ON for a cookbook project
- **THEN** the compiled print layout generates a Table of Contents and displays page numbers at the bottom of recipe sheets.

#### Scenario: Disabling page numbers
- **WHEN** the user sets page numbers to OFF for a cookbook project
- **THEN** the compiled print layout suppresses page numbers on all pages and completely omits the Table of Contents page.

### Requirement: Recipe to Project Curation
The user SHALL be able to associate recipes from the Global Recipe Library with a cookbook project, and remove associated recipes from a cookbook project. Recipes added from the library can be placed directly into a specific chapter or into the default Miscellaneous chapter. The "Add Recipes" picker SHALL support receiving an initial pre-checked set of recipe IDs (e.g., supplied by the cookbook-import shortcut after a successful import), which causes those recipes to be checked by default when the picker opens; the user can uncheck any recipe before confirming.

#### Scenario: Associating a recipe with a project in a specific chapter
- **WHEN** the user adds "Spaghetti Carbonara" from the Global Recipe Library to "My Summer Recipes" and selects the "Pasta" chapter
- **THEN** the system links "Spaghetti Carbonara" to "My Summer Recipes" and places it directly in the "Pasta" chapter.

#### Scenario: Associating a recipe with a project (Miscellaneous)
- **WHEN** the user adds "Spaghetti Carbonara" from the Global Recipe Library to "My Summer Recipes" without selecting a chapter
- **THEN** the system links "Spaghetti Carbonara" to "My Summer Recipes" and automatically places it in the "Miscellaneous" chapter.

#### Scenario: Removing a recipe from a project
- **WHEN** the user removes "Spaghetti Carbonara" from "My Summer Recipes"
- **THEN** the recipe is unlinked from the project and removed from its chapter, but remains in the Global Recipe Library.

#### Scenario: Add Recipes picker opens with pre-checked recipes after cookbook import
- **WHEN** the user returns to the cookbook page after completing an import via the cookbook-page import shortcut
- **THEN** the "Add Recipes" picker opens automatically with the newly-imported recipes pre-checked, ready for the user to review and confirm

#### Scenario: User modifies the pre-checked selection before confirming
- **WHEN** the "Add Recipes" picker is open with a pre-checked set of recipes
- **THEN** the user can uncheck any recipe in the set before confirming, and only the remaining checked recipes are added to the cookbook


