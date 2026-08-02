# recipe-preview

## Purpose

Provides a read-only preview of a recipe directly within the cookbook view context, allowing users to glance at recipe contents without navigating away to the full editor.

## Requirements

### Requirement: Cookbook Recipe Preview Dialog
The system SHALL present a read-only preview dialog when a user clicks on a recipe from within a cookbook project view, rather than immediately routing to the recipe editor.

#### Scenario: Opening the preview dialog
- **WHEN** a user clicks on a recipe item in a cookbook chapter
- **THEN** a dialog opens displaying the recipe's title, ingredients, instructions, and other details in a read-only format

#### Scenario: Navigating to the editor from the preview
- **WHEN** a user clicks the "Edit Recipe" button inside the recipe preview dialog
- **THEN** the dialog closes and the system navigates to the full recipe editor page for that recipe

#### Scenario: Closing the preview dialog
- **WHEN** a user dismisses the recipe preview dialog (e.g., by clicking outside, pressing Escape, or clicking a close button)
- **THEN** the dialog closes and the user remains on the cookbook project view, maintaining their previous scroll position and context
