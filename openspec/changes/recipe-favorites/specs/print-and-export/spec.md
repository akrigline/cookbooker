## ADDED Requirements

### Requirement: Favorite Badge and Title Prefix on Table of Contents and Recipe Pages
When a recipe is marked as a favorite, both its Table of Contents row and its printed/previewed recipe page SHALL display a read-only favorite badge using the active cookbook's configured favorites icon, positioned adjacent to the recipe title. When the active cookbook's favorites terminology is non-blank, the recipe title SHALL be rendered with that terminology as a prefix (formatted as `"<Terminology>: <Title>"`) in both locations. When the recipe is not marked as a favorite, no badge or prefix is rendered.

#### Scenario: Favorite badge on Table of Contents row
- **WHEN** the Table of Contents renders a row for a favorite recipe in a cookbook configured with the "sock" icon
- **THEN** the row displays the sock icon next to the recipe title

#### Scenario: Favorite badge on printed recipe page
- **WHEN** a favorite recipe's page is rendered for print preview or printing
- **THEN** the page header displays the cookbook's configured favorites icon next to the title

#### Scenario: Title prefix applied when terminology is configured
- **WHEN** a favorite recipe is rendered in a cookbook whose favorites terminology is "Sacred"
- **THEN** both the Table of Contents row and the printed recipe page show the title as "Sacred: <Recipe Title>"

#### Scenario: No prefix when terminology is blank
- **WHEN** a favorite recipe is rendered in a cookbook whose favorites terminology is blank
- **THEN** the title is rendered unprefixed, with only the favorite badge shown

#### Scenario: No badge or prefix for non-favorite recipes
- **WHEN** a recipe with `favorite` equal to `false` is rendered in the Table of Contents or on a printed page
- **THEN** no favorite badge or title prefix is shown
