# cookbook-management (delta)

## New Requirements

### Requirement: Recipe Overflow Warning Badge in Cookbook Chapter Rows
Within a cookbook project's chapter recipe lists, the system SHALL display a visual warning badge on any recipe row whose `fitsOnPage` field is `false`. The badge SHALL NOT be shown when `fitsOnPage` is `null` or `true`. The badge SHALL match the badge shown in the Global Recipe Library (same component, same tooltip).

#### Scenario: Warning badge shown on cookbook recipe row for overflowing recipe
- **WHEN** a recipe's `fitsOnPage` field is `false`
- **AND** the user views that recipe's row within a cookbook chapter
- **THEN** a warning badge is visible on the recipe row in the chapter list

#### Scenario: No badge shown for recipe that fits or has not been measured
- **WHEN** a recipe's `fitsOnPage` field is `null` or `true`
- **AND** the user views that recipe's row within a cookbook chapter
- **THEN** no warning badge is shown on the row
