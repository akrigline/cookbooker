## ADDED Requirements

### Requirement: Single-Page Fit Warning Badge on Chapter Recipe Rows
Cookbook chapter recipe rows SHALL display the same warning badge as the Global Recipe Library when the recipe's persisted `fitsOnPage` field is `false`. No badge SHALL be shown when `fitsOnPage` is `null` or `true`.

#### Scenario: Badge shown for a chapter recipe row that overflows a page
- **WHEN** a cookbook chapter renders a recipe row whose recipe has `fitsOnPage` equal to `false`
- **THEN** a warning badge is displayed next to that recipe's title in the chapter row

#### Scenario: No badge for a chapter recipe row that fits or is unmeasured
- **WHEN** a cookbook chapter renders a recipe row whose recipe has `fitsOnPage` equal to `true` or `null`
- **THEN** no warning badge is displayed for that row
