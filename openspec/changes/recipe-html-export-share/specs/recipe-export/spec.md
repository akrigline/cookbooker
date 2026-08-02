## ADDED Requirements

### Requirement: Export Recipe as Structured HTML
The system SHALL provide an "Export recipe" action, available when editing an
already-saved recipe, that produces a single self-contained HTML document
containing exactly one `recipe/1` element (`data-cm-format="recipe"
data-cm-version="1"`) representing that recipe, and triggers a browser
download of that document as an `.html` file.

#### Scenario: Exporting a saved recipe
- **WHEN** the user activates "Export recipe" while editing an existing recipe
- **THEN** the system generates a `recipe/1` HTML document for that recipe and
  the browser downloads it as a single `.html` file

#### Scenario: Export is unavailable for an unsaved draft
- **WHEN** the user is creating a new recipe that has not yet been saved
- **THEN** the "Export recipe" action is not available

### Requirement: Exported Recipe Carries Full Settings
The exported `recipe/1` element SHALL carry, in addition to the fields the
`recipe-import` format already defines (title, ingredients, instructions,
notes, layout template), the recipe's ingredient column count, ingredient
quantity alignment, image aspect ratio, and photo (when present) — encoding
the photo as an unresized base64 `data:` URI on an `.cm-image` element. A
recipe with no photo SHALL be exported with no `.cm-image` element.

#### Scenario: Exporting a recipe with a photo
- **WHEN** the user exports a recipe that has an image
- **THEN** the resulting HTML document contains a `.cm-image` element whose
  `src` is a `data:` URI encoding that image's exact bytes, unresized

#### Scenario: Exporting a recipe without a photo
- **WHEN** the user exports a recipe that has no image
- **THEN** the resulting HTML document contains no `.cm-image` element

#### Scenario: Exporting display settings
- **WHEN** the user exports a recipe with a non-default ingredient column
  count, ingredient quantity alignment, or image aspect ratio
- **THEN** the resulting HTML document's corresponding meta elements carry
  those exact values

### Requirement: Round-Trip Fidelity Through Existing Import
An HTML document produced by the export action SHALL be a valid `recipe/1`
source consumable by the existing `recipe-import` file-upload and paste entry
points with no changes to those entry points, and importing it SHALL
reproduce the original recipe's title, ingredients, instructions, notes,
layout template, ingredient column count, ingredient quantity alignment,
image aspect ratio, and photo.

#### Scenario: Exported file re-imports via the file picker
- **WHEN** the user selects a previously exported `.html` file in the
  `recipe-import` file picker
- **THEN** the system extracts exactly one candidate recipe matching the
  original recipe's title, ingredients, instructions, notes, layout template,
  display settings, and photo

#### Scenario: Exported file's HTML re-imports via paste
- **WHEN** the user pastes the contents of a previously exported `.html` file
  into the `recipe-import` paste entry point
- **THEN** the system extracts exactly one candidate recipe matching the
  original recipe's title, ingredients, instructions, notes, layout template,
  display settings, and photo
