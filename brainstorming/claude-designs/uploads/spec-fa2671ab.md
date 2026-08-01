# recipe-import

## Purpose

Lets a user bring recipes transcribed by an LLM (from Drive docs, PDFs, bookmarked
pages, or screenshots) into the Global Recipe Library, via a strict structured-HTML
format (`recipe/1`) and a staged review screen that previews parsed recipes before
anything is written to the library.

## Requirements

### Requirement: Recipe Import File Format
The system SHALL define a structured HTML import format (`recipe/1`) in which each
recipe is represented by a root element carrying `data-cm-format="recipe"` and
`data-cm-version="1"`. This format applies identically regardless of how the HTML
text reaches the parser (a selected file's contents, or pasted text). A single HTML
source MAY contain multiple such root elements, representing a batch of recipes to
import in one operation.

#### Scenario: Single recipe file
- **WHEN** the user selects an HTML file containing exactly one element with
  `data-cm-format="recipe"` and `data-cm-version="1"`
- **THEN** the system extracts exactly one candidate recipe from the file

#### Scenario: Batch file with multiple recipes
- **WHEN** the user selects an HTML file containing multiple elements with
  `data-cm-format="recipe"` and `data-cm-version="1"`
- **THEN** the system extracts one candidate recipe per matched element

#### Scenario: Single recipe pasted as text
- **WHEN** the user pastes HTML text containing exactly one element with
  `data-cm-format="recipe"` and `data-cm-version="1"`
- **THEN** the system extracts exactly one candidate recipe from the pasted text

#### Scenario: Batch of recipes pasted as text
- **WHEN** the user pastes HTML text containing multiple elements with
  `data-cm-format="recipe"` and `data-cm-version="1"`
- **THEN** the system extracts one candidate recipe per matched element

### Requirement: Paste HTML Entry Point
The system SHALL provide a paste-based entry point, additive to the existing file
picker, consisting of a text input control where the user pastes HTML text and an
explicit trigger control that submits the pasted text for parsing. Submitting
empty or whitespace-only pasted text SHALL be rejected in the UI with a clear
message, without invoking the recipe-import parser. Successful submission SHALL
feed the pasted text into the same parsing and staged-review flow used by the file
entry point, with no separate validation or review logic.

#### Scenario: Pasting valid HTML text
- **WHEN** the user pastes HTML text containing at least one
  `data-cm-format="recipe"` element into the paste input and activates the trigger
  control
- **THEN** the system parses the pasted text using the same parser used for
  selected files, and stages the results on the same review screen

#### Scenario: Triggering parse with empty pasted text
- **WHEN** the user activates the trigger control while the paste input is empty
  or contains only whitespace
- **THEN** the system displays an inline error and does not invoke the recipe-import
  parser

### Requirement: Strict Format Validation
The system SHALL reject, as a whole HTML source, any selected file or pasted text
containing zero elements with `data-cm-format="recipe"` anywhere in the document,
without attempting a heuristic or best-effort parse of the content. The system
SHALL treat a matched recipe element whose `data-cm-version` is missing or not
equal to `"1"` as a per-recipe parse failure rather than guess-parsing it. This
applies identically to file-sourced and pasted-text-sourced HTML.

#### Scenario: File missing the required markers
- **WHEN** the user selects an HTML file with no `data-cm-format="recipe"` element
  anywhere in the document
- **THEN** the system rejects the file with an error explaining the required marker
  is missing, and imports nothing

#### Scenario: Pasted text missing the required markers
- **WHEN** the user pastes HTML text with no `data-cm-format="recipe"` element
  anywhere in the document and activates the trigger control
- **THEN** the system rejects the pasted text with an error explaining the required
  marker is missing, and imports nothing

#### Scenario: Recipe element with an unrecognized format version
- **WHEN** a matched element has `data-cm-format="recipe"` but a `data-cm-version`
  other than `"1"` (or none at all)
- **THEN** that recipe is reported as a parse failure with its reason, and any other
  valid recipes in the same source are still processed

### Requirement: Recipe Field Extraction
For each matched, correctly-versioned recipe element, the system SHALL extract:
title (from `.cm-title`), ingredients (one raw line per `.cm-ingredients li`, parsed
via the application's existing ingredient-line parser), instructions (one step per
`.cm-instructions li`, or `.cm-instructions p` when no list items are present, joined
into a newline-separated string), notes (from `.cm-notes`, optional), and layout
template (from `.cm-layout`'s `content` attribute when it is one of the application's
known template identifiers, defaulting to the standard template otherwise). The
system SHALL always set the imported recipe's image to absent/null, regardless of any
image-related content in the source file.

#### Scenario: Extracting a well-formed recipe
- **WHEN** a recipe element has a title, one or more ingredient list items, and one
  or more instruction list items
- **THEN** the system produces a candidate recipe with matching title, ingredients
  parsed through the application's standard ingredient parser, and instructions
  joined as a newline-separated string

#### Scenario: Optional fields are absent
- **WHEN** a recipe element has no `.cm-notes` section and no `.cm-layout` element
- **THEN** the system produces a candidate recipe with empty notes and the standard
  layout template

#### Scenario: Instructions provided as paragraphs instead of a list
- **WHEN** a recipe element's `.cm-instructions` section contains `<p>` elements
  instead of `<li>` elements
- **THEN** the system extracts one instruction step per paragraph

#### Scenario: Imported recipes never carry an image
- **WHEN** any recipe is successfully extracted and imported
- **THEN** the resulting recipe's image field is null, regardless of the source file's
  content

### Requirement: Per-Recipe Field Validation
The system SHALL apply the same required-field validation used when manually creating
a recipe (non-empty title, non-empty instructions) to each extracted candidate
recipe. A candidate recipe failing this validation SHALL be reported as a parse
failure with a human-readable reason and SHALL NOT be imported, without affecting the
processing of other recipes in the same file.

#### Scenario: Recipe missing a required field
- **WHEN** a matched recipe element has an empty or missing title, or no
  instruction steps
- **THEN** the system reports that recipe as a parse failure with a reason
  identifying the missing field, and does not include it among the importable
  recipes

#### Scenario: One bad recipe does not block the rest of a batch
- **WHEN** a batch file contains three matched recipe elements and one fails
  validation
- **THEN** the system reports two importable recipes and one parse failure

### Requirement: Staged Review Before Import
The system SHALL parse selected file(s) or pasted text entirely client-side,
without writing anything to the recipe library, and present a review screen before
any data is persisted. Both entry points SHALL stage their results into the same
review state and render each successfully parsed recipe using the application's
existing recipe-sheet preview component, accompanied by an include/exclude control
that defaults to included. Parse failures SHALL be listed separately from
successfully parsed recipes, each with its failure reason. The system SHALL commit
only the recipes the user has left included, via the application's existing
recipe-creation operation, when the user confirms the import.

#### Scenario: Reviewing a successfully parsed batch
- **WHEN** the user selects a batch file containing multiple valid recipes
- **THEN** the system displays a preview of each parsed recipe using the standard
  recipe-sheet rendering, each with a checkbox that is checked by default, before
  anything is saved

#### Scenario: Reviewing a successfully parsed paste
- **WHEN** the user pastes HTML text containing multiple valid recipes and
  activates the trigger control
- **THEN** the system displays a preview of each parsed recipe on the same review
  screen used for the file entry point, each with a checkbox that is checked by
  default, before anything is saved

#### Scenario: Excluding a recipe from import
- **WHEN** the user unchecks one previewed recipe and confirms the import
- **THEN** the system creates recipes only for the remaining checked recipes, and the
  unchecked recipe is not added to the library

#### Scenario: Confirming import commits recipes
- **WHEN** the user confirms the import with one or more recipes checked
- **THEN** the system creates each checked recipe in the Global Recipe Library using
  the same recipe-creation operation used by manual recipe entry

#### Scenario: Rejected file produces an error, not a crash
- **WHEN** the user selects a file that does not contain the required
  `data-cm-format="recipe"` marker
- **THEN** the system displays an error message explaining the file was not
  recognized, and the review screen shows no importable recipes

#### Scenario: Rejected paste produces an error, not a crash
- **WHEN** the user pastes text that does not contain the required
  `data-cm-format="recipe"` marker and activates the trigger control
- **THEN** the system displays an error message explaining the pasted text was not
  recognized, and the review screen shows no importable recipes
