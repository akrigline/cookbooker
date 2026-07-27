# cookbook-management

## Purpose

Creates and manages multiple independent cookbook projects, including project metadata (title, subtitle, author), cover layout and accent color styling, a global page-number toggle, and curating which recipes from the Global Recipe Library belong to each project.

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
Each cookbook project SHALL store configuration settings containing a Title, an optional Subtitle, and an Author Name.

#### Scenario: Saving project metadata updates
- **WHEN** the user updates the title to "Holiday Baking 2026", subtitle to "Sweet Treats", and author to "Chef Andrew"
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
The user SHALL be able to associate recipes from the Global Recipe Library with a cookbook project, and remove associated recipes from a cookbook project.

#### Scenario: Associating a recipe with a project
- **WHEN** the user adds "Spaghetti Carbonara" from the Global Recipe Library to "My Summer Recipes"
- **THEN** the system links "Spaghetti Carbonara" to "My Summer Recipes" and automatically places it in the "Miscellaneous" chapter.

#### Scenario: Removing a recipe from a project
- **WHEN** the user removes "Spaghetti Carbonara" from "My Summer Recipes"
- **THEN** the recipe is unlinked from the project and removed from its chapter, but remains in the Global Recipe Library.
