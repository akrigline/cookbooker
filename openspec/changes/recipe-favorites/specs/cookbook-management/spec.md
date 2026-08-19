## ADDED Requirements

### Requirement: Favorites Display Configuration in Cookbook Settings
The cookbook-editing modal SHALL include a Favorites section allowing the user to choose a favorites icon (sock, star, or heart) and enter an optional title-prefix terminology string for the active cookbook project, per the `recipe-favorites` capability's Per-Cookbook Favorites Display Configuration requirement.

#### Scenario: Configuring favorites from cookbook settings
- **WHEN** the user opens the cookbook-editing modal and sets the favorites icon to "sock" and terminology to "Sacred"
- **THEN** the cookbook project persists these settings and the print preview reflects them on favorite recipes

### Requirement: Favorite Toggle on Chapter Recipe Rows
Cookbook chapter recipe rows SHALL display a favorite-toggle control positioned with the row's existing action controls (not immediately before the recipe title), using that cookbook's configured favorites icon. Toggling it MUST update the recipe's global `favorite` field.

#### Scenario: Toggling favorite from a chapter row
- **WHEN** the user clicks the favorite toggle on a chapter recipe row in a cookbook configured with the "star" icon
- **THEN** the recipe's `favorite` field is updated and the toggle renders using the star icon

#### Scenario: Toggle positioned with row actions
- **WHEN** a chapter recipe row is rendered
- **THEN** the favorite toggle appears alongside the row's existing action controls, not immediately before the title
