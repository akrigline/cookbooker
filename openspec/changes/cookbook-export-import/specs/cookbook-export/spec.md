## ADDED Requirements

### Requirement: Export Cookbook as Structured HTML
The system SHALL provide an "Export Cookbook" action, available on a saved
cookbook's page, that produces a single self-contained HTML document
containing exactly one `cookbook/1` element (`data-cm-format="cookbook"
data-cm-version="1"`) representing that cookbook's settings, chapters, and
recipes, and triggers a browser download of that document as an `.html` file.

#### Scenario: Exporting a cookbook
- **WHEN** the user activates "Export Cookbook" on a saved cookbook
- **THEN** the system generates a `cookbook/1` HTML document for that
  cookbook and the browser downloads it as a single `.html` file

### Requirement: Exported Cookbook Carries Its Settings
The `cookbook/1` element SHALL carry the cookbook's title, subtitle, accent
color, cover template, page-numbers-enabled flag, and double-sided-enabled
flag as meta elements.

#### Scenario: Exporting cookbook settings
- **WHEN** the user exports a cookbook
- **THEN** the resulting HTML document's `cookbook/1` element carries meta
  elements for that cookbook's title, subtitle, accent color, cover template,
  page-numbers-enabled flag, and double-sided-enabled flag

### Requirement: Exported Cookbook Preserves Chapter and Recipe Order
The `cookbook/1` element SHALL contain one chapter section per chapter in the
cookbook, in chapter sequence order, each carrying the chapter's name. Each
chapter section SHALL contain that chapter's recipes, in their in-chapter
sequence order, as ordinary `recipe/1` elements (`data-cm-format="recipe"
data-cm-version="1"`) — identical in structure to a standalone single-recipe
export, including image, layout template, ingredient columns, and image
aspect ratio.

#### Scenario: Exporting chapters in order
- **WHEN** the user exports a cookbook with multiple chapters
- **THEN** the resulting document's chapter sections appear in the same order
  as the chapters are shown in the cookbook

#### Scenario: Exporting recipes within a chapter in order
- **WHEN** the user exports a cookbook whose chapter contains multiple
  recipes in a specific order
- **THEN** that chapter's section contains `recipe/1` elements in the same
  order

#### Scenario: Exporting a chapter with no recipes
- **WHEN** the user exports a cookbook containing a chapter with no recipes
- **THEN** the resulting document still contains a chapter section for it,
  with no `recipe/1` elements inside

#### Scenario: Exported recipe carries full recipe detail
- **WHEN** the user exports a cookbook containing a recipe with a photo and a
  non-default ingredient column count
- **THEN** that recipe's `recipe/1` element carries the same fields (photo as
  a base64 `data:` URI, layout template, ingredient columns, image aspect
  ratio) that exporting that recipe on its own would produce
