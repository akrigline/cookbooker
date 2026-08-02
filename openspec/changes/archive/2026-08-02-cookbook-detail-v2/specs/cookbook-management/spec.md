## MODIFIED Requirements

### Requirement: Recipe to Project Curation
The user SHALL be able to associate recipes from the Global Recipe Library with a cookbook project, and remove associated recipes from a cookbook project. Recipes added from the library can be placed directly into a specific chapter or into the default Miscellaneous chapter.

#### Scenario: Associating a recipe with a project in a specific chapter
- **WHEN** the user adds "Spaghetti Carbonara" from the Global Recipe Library to "My Summer Recipes" and selects the "Pasta" chapter
- **THEN** the system links "Spaghetti Carbonara" to "My Summer Recipes" and places it directly in the "Pasta" chapter.

#### Scenario: Removing a recipe from a project
- **WHEN** the user removes "Spaghetti Carbonara" from "My Summer Recipes"
- **THEN** the recipe is unlinked from the project and removed from its chapter, but remains in the Global Recipe Library.
