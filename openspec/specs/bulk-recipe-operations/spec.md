# bulk-recipe-operations

## Purpose

Enables users to select multiple recipes within a cookbook or in the global recipe library sidebar and act on them all in a single operation — moving, adding, removing, or organizing into a new chapter.

## Requirements

### Requirement: Bulk Recipe Actions in Cookbook
The system SHALL allow users to select multiple recipes across various chapters within a cookbook to perform bulk actions, including moving them to a different chapter, creating a new chapter to hold them, or removing them from the cookbook entirely.

#### Scenario: Bulk move to chapter
- **WHEN** the user selects multiple recipes and chooses "Move to chapter"
- **THEN** all selected recipes are immediately reassigned to the target chapter

#### Scenario: Bulk remove from cookbook
- **WHEN** the user selects multiple recipes and chooses "Remove from cookbook"
- **THEN** the system prompts for double confirmation before removing the recipes from the cookbook

#### Scenario: Bulk new chapter from cookbook selection
- **WHEN** the user selects multiple recipes across chapters and chooses "New chapter from these"
- **THEN** the system prompts for a chapter name, and on confirmation creates the chapter and reassigns all selected recipes to it

### Requirement: Bulk Recipe Actions in Library
The system SHALL allow users to select multiple recipes from the global recipe library sidebar and add them all to a specific chapter, to the default Miscellaneous chapter, or to a new chapter created from the selection, in one operation.

#### Scenario: Bulk add from library
- **WHEN** the user selects multiple recipes in the library and chooses "Add to chapter..."
- **THEN** the selected recipes are added to the active cookbook and assigned to the chosen chapter

#### Scenario: Bulk new chapter from library selection
- **WHEN** the user selects multiple recipes in the library and chooses "New chapter..."
- **THEN** the system prompts for a chapter name, and on confirmation creates the chapter and adds all selected recipes to the active cookbook assigned to that new chapter

#### Scenario: Select all visible library recipes
- **WHEN** the user checks "Select all" in the library sidebar
- **THEN** every recipe currently visible in the library list — i.e. matching the active search filter and not already in the cookbook — is selected in one action, and unchecking it clears the selection
