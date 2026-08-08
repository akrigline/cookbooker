## MODIFIED Requirements

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
