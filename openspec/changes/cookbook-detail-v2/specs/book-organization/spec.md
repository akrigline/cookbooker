## MODIFIED Requirements

### Requirement: Removing a Recipe from a Cookbook
The user SHALL be able to remove a recipe from a specific cookbook, but the system MUST require explicit double confirmation before performing the removal. Removing a recipe from a cookbook MUST NOT delete it from other cookbooks or from the central Global Recipe Library.

#### Scenario: Removing a recipe from a cookbook
- **WHEN** the user attempts to remove "Grandma's Apple Pie" from the "Holiday Baking" cookbook
- **THEN** the system presents a confirmation dialog, and upon confirmation, the recipe is removed from the "Holiday Baking" cookbook but still appears in the "Family Classics" cookbook and the Global Recipe Library.
