# recipe-editor

## Purpose

Defines the structured recipe data model and the editing experience for an individual recipe: required title/instructions, optional Chef's Notes and image, and a choice of visual layout template that formats the recipe without altering its underlying data.

## Requirements

### Requirement: Structured Recipe Schema
Each recipe in the Global Recipe Library SHALL support a structured data model containing: Title (required), Instructions/Steps (required), Ingredients (parsed list of structured elements), and the optional fields: Chef's Notes (supporting simple bold/italic styling) and a single Recipe Image.

#### Scenario: Creating a recipe with all fields
- **WHEN** the user saves a new recipe with the required fields, chef's notes, and an image
- **THEN** the system stores all fields locally and links the image Blob to the recipe.

### Requirement: Layout Template Assignment
The user SHALL be able to select and switch between multiple visual layout templates for rendering a recipe. Changing the layout template MUST format the recipe page without altering the underlying raw recipe data.

#### Scenario: Switching recipe layout template
- **WHEN** the user switches a recipe's layout from "Classic Text" to "Image Top Layout"
- **THEN** the print preview updates the layout immediately, keeping all ingredients and instructions unchanged.

### Requirement: Static Image Container Styling
If a recipe template includes an image container but the user has not uploaded an image for that recipe, the container SHALL remain empty/blank, and the surrounding layout columns or spacing MUST NOT collapse or shift.

#### Scenario: Rendering template without an image
- **WHEN** a recipe with no uploaded image is rendered using an image-split template
- **THEN** the layout reserves the empty space for the image container without altering the layout alignment of ingredients and instructions.

### Requirement: Recipe Editor Back Navigation
The recipe editor SHALL display a back-navigation control. When the editor was entered from within a cookbook project view (indicated by return-context query parameters on the route), the control MUST be labelled **"Back to Cookbook"** and navigate to the originating cookbook project view. When entered from the recipe library (no return-context parameters), the control MUST be labelled **"Back to Recipe Library"** and navigate to the recipe library.

#### Scenario: Back navigation label when entering from cookbook
- **WHEN** a user opens the recipe editor by clicking "Edit Recipe" from a cookbook recipe preview
- **THEN** the editor displays a back button labelled "Back to Cookbook" rather than "Back to Recipe Library"

#### Scenario: Back navigation label when entering from library
- **WHEN** a user opens the recipe editor directly from the recipe library
- **THEN** the editor displays a back button labelled "Back to Recipe Library"

### Requirement: Context-Aware Post-Save Navigation
When the recipe editor was entered from within a cookbook project view, saving the recipe SHALL navigate back to the originating cookbook project view (with a signal to reopen the recipe preview), rather than to the recipe library.

#### Scenario: Saving a recipe entered from a cookbook
- **WHEN** a user edits a recipe that was opened from a cookbook preview and clicks Save
- **THEN** the system saves the recipe and navigates back to the cookbook project view, passing a signal to reopen the preview for that recipe

#### Scenario: Saving a recipe entered from the library
- **WHEN** a user edits a recipe that was opened from the recipe library and clicks Save
- **THEN** the system saves the recipe and navigates to the recipe library (existing behavior unchanged)
