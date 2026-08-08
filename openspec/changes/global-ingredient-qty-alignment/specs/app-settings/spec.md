## ADDED Requirements

### Requirement: Global App Settings Storage
The system SHALL persist a single set of app-wide settings in IndexedDB, independent of any
recipe or project, surviving reload and covered by the existing backup/restore flow. A missing
settings row SHALL NOT be an error: reads SHALL merge stored values over defaults, and writes
SHALL create the row if absent.

#### Scenario: Reading settings with no row yet persisted
- **WHEN** the app reads settings and no settings row exists (fresh install, or after restoring a
  backup made before this table existed)
- **THEN** the system returns the standard default settings without error

#### Scenario: Writing settings for the first time
- **WHEN** the app writes a settings change and no settings row exists yet
- **THEN** the system creates the settings row with the written value merged over defaults

#### Scenario: Settings persist across reload
- **WHEN** a setting is changed and the app is reloaded
- **THEN** the app reads back the previously written value, not a default

### Requirement: Global Ingredient Quantity Alignment
The system SHALL apply a single ingredient-quantity alignment (left or right, defaulting to
right) to every rendered recipe across the app — the recipe editor's live preview, the import
review preview, and both print views — with no per-recipe override. The value SHALL be editable
from Settings.

#### Scenario: Changing the global default updates every recipe
- **WHEN** the user changes the ingredient quantity alignment setting
- **THEN** every recipe's ingredient list, in the editor preview, print, and project print,
  renders with the new alignment — none retain a different value

#### Scenario: A recipe carries no per-recipe alignment override
- **WHEN** a recipe is created, edited, or imported
- **THEN** no per-recipe alignment control or field is available to set a different alignment for
  that recipe alone
