## ADDED Requirements

### Requirement: Import Cookbook Creates a New Cookbook
The system SHALL provide an "Import Cookbook" action that reads a `cookbook/1`
HTML file and creates a brand-new cookbook (project, chapters, and recipes)
from it, without modifying any existing cookbook or existing recipe library
entry. On success, the system SHALL navigate to the newly created cookbook.

#### Scenario: Importing a valid cookbook file
- **WHEN** the user selects a valid `cookbook/1` HTML file via "Import
  Cookbook"
- **THEN** the system creates a new cookbook with that file's settings,
  chapters (in order), and recipes (in order within each chapter), and
  navigates to it

#### Scenario: Importing never modifies existing data
- **WHEN** the user imports a cookbook file while other cookbooks and library
  recipes already exist
- **THEN** none of the existing cookbooks or recipes are changed, and the
  imported recipes are created as new recipe rows even if a recipe with the
  same title already exists in the library

#### Scenario: A file with no cookbook data is rejected
- **WHEN** the user selects a file that contains no `cookbook/1` element
- **THEN** the system rejects the import with an error and creates no
  cookbook

### Requirement: Recipe Parse Failures Are Reported, Not Fatal
The system SHALL skip, rather than abort on, a `recipe/1` element inside a
`cookbook/1` file's chapter section that fails to parse (per the same
validation single-recipe import applies — e.g. missing title or missing
instructions), continue importing the rest of the file, and report the
skipped recipe (its chapter and a reason) in a post-import summary. A chapter
with zero successfully-parsed recipes SHALL still be created.

#### Scenario: One recipe in a chapter fails to parse
- **WHEN** the user imports a cookbook file where one recipe in a chapter is
  missing its title and the rest of the file is valid
- **THEN** the cookbook is created with every other recipe, that chapter is
  still created, and the import summary lists the skipped recipe and its
  chapter

#### Scenario: Every recipe in a chapter fails to parse
- **WHEN** every recipe in one chapter of an otherwise-valid cookbook file
  fails to parse
- **THEN** the cookbook is still created with that chapter present and empty,
  and the import summary lists each skipped recipe
