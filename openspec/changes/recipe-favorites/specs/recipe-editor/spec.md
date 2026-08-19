## MODIFIED Requirements

### Requirement: Structured Recipe Schema
Each recipe in the Global Recipe Library SHALL support a structured data model containing: Title (required), Instructions/Steps (required), Ingredients (parsed list of structured elements), a boolean `favorite` flag (default `false`), and the optional fields: Chef's Notes (supporting simple bold/italic styling) and a single Recipe Image.

#### Scenario: Creating a recipe with all fields
- **WHEN** the user saves a new recipe with the required fields, chef's notes, and an image
- **THEN** the system stores all fields locally and links the image Blob to the recipe.

#### Scenario: New recipe defaults to not favorite
- **WHEN** the user creates a new recipe without touching the favorite toggle
- **THEN** the recipe's `favorite` field is stored as `false`

## ADDED Requirements

### Requirement: Favorite Toggle in Recipe Editor
The recipe editor SHALL display a favorite-toggle control positioned alongside its Save/Cancel actions (not adjacent to the title field). The toggle SHALL always render as a heart icon (see the `recipe-favorites` capability's Context-Dependent Favorite Icon requirement), filled when the recipe is marked favorite and outlined when it is not. Toggling it and saving MUST persist the updated `favorite` value.

#### Scenario: Marking a recipe favorite from the editor
- **WHEN** the user clicks the heart toggle in the recipe editor and saves
- **THEN** the recipe's `favorite` field is persisted as `true`

#### Scenario: Toggle is not positioned before the title
- **WHEN** the recipe editor is rendered
- **THEN** the favorite toggle appears with the Save/Cancel controls, not immediately before or after the title field
