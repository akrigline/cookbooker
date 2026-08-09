## MODIFIED Requirements

### Requirement: Single-Page Recipe Layout Constraint
Recipe layouts are designed to fit on a single printed page. The system SHALL proactively surface a violation of this constraint by persisting a nullable `fitsOnPage` boolean field on each recipe record, computed by measuring the recipe's rendered sheet against a single print page after any write that creates or modifies the recipe. This lets list views warn the user before print time, rather than the recipe silently bleeding onto a second sheet only discovered when printed.

#### Scenario: fitsOnPage is computed after a recipe write
- **WHEN** a recipe is created or edited and saved
- **THEN** the system measures whether the saved recipe's rendered sheet overflows a single print page and persists the result (`true` or `false`) to that recipe's `fitsOnPage` field

#### Scenario: Unmeasured recipes are distinguishable from measured ones
- **WHEN** a recipe has never been created or edited since this measurement was introduced
- **THEN** its `fitsOnPage` field is `null`, distinct from a definite `true`/`false` measurement result
