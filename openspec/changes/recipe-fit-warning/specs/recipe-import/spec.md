## ADDED Requirements

### Requirement: Post-Import Fit Measurement
When the user confirms an import, the system SHALL trigger a single-page fit measurement for each newly created recipe after it is saved, and persist the result to that recipe's `fitsOnPage` field. This measurement SHALL NOT block or delay the confirmation flow's completion.

#### Scenario: Fit measurement runs after a successful import
- **WHEN** the user confirms an import and a recipe is successfully created
- **THEN** the system measures whether the new recipe's rendered sheet fits on a single print page and persists the result as that recipe's `fitsOnPage` value, without delaying the import-confirmation UI
