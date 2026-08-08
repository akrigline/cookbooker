# recipe-import (delta)

## Modified Requirements

### Requirement: Fit Measurement After Import Confirm
After the user confirms an import and each selected recipe is written to the Global Recipe Library, the system SHALL asynchronously measure whether each newly created recipe fits on a single printed page and persist the result as `fitsOnPage` on that recipe's record. This measurement SHALL NOT block the user-facing confirmation flow or delay navigation after import.

#### Scenario: Fit measurement fires after import commit
- **WHEN** the user confirms a staged import with one or more recipes checked
- **AND** the system creates each checked recipe in the Global Recipe Library
- **THEN** the system asynchronously measures each created recipe's page fit and updates its `fitsOnPage` field without blocking the UI
