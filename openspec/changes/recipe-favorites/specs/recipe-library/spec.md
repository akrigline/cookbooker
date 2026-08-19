## ADDED Requirements

### Requirement: Favorite Toggle on Library Recipe Rows
The Global Recipe Library SHALL display a favorite-toggle control on each recipe row, positioned with the row's existing action controls (e.g. next to "Edit"), not immediately before the recipe title. The toggle SHALL always render as a heart icon (see the `recipe-favorites` capability's Context-Dependent Favorite Icon requirement), filled when the recipe is marked favorite and outlined when it is not, and toggling it MUST persist the recipe's `favorite` field immediately without opening the editor.

#### Scenario: Toggling favorite from the library
- **WHEN** the user clicks the heart toggle on a recipe row in the Global Recipe Library
- **THEN** the recipe's `favorite` field is updated immediately, without navigating to the recipe editor

#### Scenario: Toggle positioned with row actions
- **WHEN** a Global Recipe Library row is rendered
- **THEN** the favorite toggle appears alongside the row's existing action controls, not immediately before the title
