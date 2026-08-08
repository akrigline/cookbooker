# recipe-export

## Purpose

Lets a user export a single saved recipe as a self-contained `.html` file that
carries both its content and its display settings, so it can be shared or
backed up outside the app and later re-imported through the existing
`recipe-import` entry points with full round-trip fidelity.

## Requirements

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
notes, layout template), the recipe's ingredient column count, image aspect
ratio, and photo (when present) — encoding the photo as an unresized base64
`data:` URI on an `.cm-image` element. A recipe with no photo SHALL be
exported with no `.cm-image` element. Ingredient quantity alignment is an
app-wide display preference, not recipe data, and SHALL NOT be included in
the export.

#### Scenario: Exporting a recipe with a photo
- **WHEN** the user exports a recipe that has an image
- **THEN** the resulting HTML document contains a `.cm-image` element whose
  `src` is a `data:` URI encoding that image's exact bytes, unresized

#### Scenario: Exporting a recipe without a photo
- **WHEN** the user exports a recipe that has no image
- **THEN** the resulting HTML document contains no `.cm-image` element

#### Scenario: Exporting display settings
- **WHEN** the user exports a recipe with a non-default ingredient column
  count or image aspect ratio
- **THEN** the resulting HTML document's corresponding meta elements carry
  those exact values

#### Scenario: Exported document carries no alignment meta element
- **WHEN** the user exports any recipe
- **THEN** the resulting HTML document contains no
  `.cm-ingredient-qty-align` element

### Requirement: Round-Trip Fidelity Through Existing Import
An HTML document produced by the export action SHALL be a valid `recipe/1`
source consumable by the existing `recipe-import` file-upload and paste entry
points with no changes to those entry points, and importing it SHALL
reproduce the original recipe's title, ingredients, instructions, notes,
layout template, ingredient column count, image aspect ratio, and photo.
Ingredient quantity alignment is not part of this round trip: the imported
recipe SHALL render with whatever ingredient quantity alignment is the
app-wide default at import time, regardless of the alignment in effect when
the recipe was exported.

#### Scenario: Exported file re-imports via the file picker
- **WHEN** the user selects a previously exported `.html` file in the
  `recipe-import` file picker
- **THEN** the system extracts exactly one candidate recipe matching the
  original recipe's title, ingredients, instructions, notes, layout template,
  ingredient column count, image aspect ratio, and photo

#### Scenario: Exported file's HTML re-imports via paste
- **WHEN** the user pastes the contents of a previously exported `.html` file
  into the `recipe-import` paste entry point
- **THEN** the system extracts exactly one candidate recipe matching the
  original recipe's title, ingredients, instructions, notes, layout template,
  ingredient column count, image aspect ratio, and photo
