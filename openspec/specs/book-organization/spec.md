# book-organization

## Purpose

Groups recipes into cookbook projects and sequences them into custom chapters, using a permanent system-default "Miscellaneous" chapter as the fallback for recipes without an explicit chapter assignment and for orphaned recipes after a custom chapter is deleted.

## Requirements

### Requirement: Cookbook Project and Chapter Management
The system SHALL support the creation and modification of multiple independent cookbook projects. Within each project, the user MUST be able to manage a flat hierarchy of custom chapters (creation, renaming, and deletion) to organize recipes. Sub-chapters or nested chapters are out of scope.

#### Scenario: Creating Custom Chapter
- **WHEN** the user creates a chapter named "Soups & Stews" in Project A
- **THEN** the chapter is added to the project, and is available for recipe assignments

### Requirement: Single Chapter Recipe Association
Within a single cookbook project, a recipe SHALL be associated with at most one chapter at any given time.

#### Scenario: Reassociating Recipe
- **WHEN** the user moves a recipe from chapter "Appetizers" to chapter "Mains"
- **THEN** the recipe is associated with "Mains" and is no longer associated with "Appetizers"

### Requirement: The Miscellaneous Default Chapter
Every cookbook project MUST automatically include a permanent, system-default chapter named "Miscellaneous" which cannot be deleted.

#### Scenario: Project Creation System Default
- **WHEN** a user creates a new cookbook project
- **THEN** the system automatically initializes a "Miscellaneous" chapter for that project

### Requirement: Recipe Association Fallbacks and Chapter Deletion Recovery
When a recipe is first added to a project without a designated chapter, the system SHALL automatically assign it to the project's "Miscellaneous" chapter. When a custom chapter is deleted, the system MUST automatically reassign all recipes belonging to that chapter to the "Miscellaneous" chapter, without deleting the recipes from the project or the Global Recipe Library.

#### Scenario: Custom Chapter Deletion Reassignment
- **WHEN** the user deletes custom chapter "Breakfast" which contains the recipe "Pancakes"
- **THEN** the chapter is removed, and "Pancakes" is reassigned to the "Miscellaneous" chapter within that project

### Requirement: Conditional Miscellaneous Compilation
If the "Miscellaneous" chapter contains recipes when exporting the cookbook, it SHALL be rendered as the final chapter of the book. If the "Miscellaneous" chapter is completely empty, it SHALL be omitted entirely from the compiled book layout and the Table of Contents.

#### Scenario: Omitted Empty Miscellaneous Chapter
- **WHEN** the user exports a project and the "Miscellaneous" chapter is empty
- **THEN** the Table of Contents and compiled output omit the "Miscellaneous" chapter and divider page

### Requirement: Project Sequencing
The system SHALL allow users to define a custom sequential order for chapters within a project, and a custom sequential order for recipes within each chapter.

#### Scenario: Reordering Recipes
- **WHEN** the user drags a recipe to change its position inside a chapter
- **THEN** the system saves the new sequence and updates the print layout order accordingly

### Requirement: Removing a Recipe from a Cookbook
The user SHALL be able to remove a recipe from a specific cookbook. Removing a recipe from a cookbook MUST NOT delete it from other cookbooks or from the central Global Recipe Library.

#### Scenario: Removing a recipe from a cookbook
- **WHEN** the user removes "Grandma's Apple Pie" from the "Holiday Baking" cookbook
- **THEN** the recipe is removed from the "Holiday Baking" cookbook, but still appears in the "Family Classics" cookbook and the Global Recipe Library.
