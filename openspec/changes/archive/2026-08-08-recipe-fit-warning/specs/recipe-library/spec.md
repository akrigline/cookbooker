## ADDED Requirements

### Requirement: Single-Page Fit Warning Badge
The Global Recipe Library SHALL display a warning badge on a recipe list item when that recipe's persisted `fitsOnPage` field is `false`. No badge SHALL be shown when `fitsOnPage` is `null` (not yet measured) or `true`.

#### Scenario: Badge shown for a recipe that overflows a page
- **WHEN** the Global Recipe Library renders a recipe whose `fitsOnPage` field is `false`
- **THEN** a warning badge (triangle-with-`!` icon) is displayed next to the recipe's title in its list row

#### Scenario: No badge for a recipe that fits
- **WHEN** the Global Recipe Library renders a recipe whose `fitsOnPage` field is `true`
- **THEN** no warning badge is displayed for that recipe

#### Scenario: No badge for an unmeasured recipe
- **WHEN** the Global Recipe Library renders a recipe whose `fitsOnPage` field is `null`
- **THEN** no warning badge is displayed for that recipe
