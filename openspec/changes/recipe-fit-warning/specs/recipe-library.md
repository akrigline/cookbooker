# recipe-library (delta)

## New Requirements

### Requirement: Recipe Overflow Warning Badge
The Global Recipe Library SHALL display a visual warning badge on any recipe list item whose `fitsOnPage` field is `false`. The badge SHALL NOT be shown when `fitsOnPage` is `null` (not yet measured) or `true` (fits). The badge SHALL include a tooltip or accessible label explaining that the recipe may not fit on a single printed page.

#### Scenario: Warning badge shown for overflowing recipe
- **WHEN** a recipe's `fitsOnPage` field is `false`
- **AND** the user views the Global Recipe Library
- **THEN** a warning badge (triangle-with-`!` icon) is visible on that recipe's list item

#### Scenario: No badge shown for unmeasured recipe
- **WHEN** a recipe's `fitsOnPage` field is `null`
- **AND** the user views the Global Recipe Library
- **THEN** no warning badge is shown on that recipe's list item

#### Scenario: No badge shown for recipe that fits
- **WHEN** a recipe's `fitsOnPage` field is `true`
- **AND** the user views the Global Recipe Library
- **THEN** no warning badge is shown on that recipe's list item
