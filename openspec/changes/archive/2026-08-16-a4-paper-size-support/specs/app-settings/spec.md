## ADDED Requirements

### Requirement: Global Paper Size
The system SHALL apply a single paper size (Letter or A4, defaulting to Letter) to every page-size-dependent surface across the app — the print screen preview, the physical print output, and table-of-contents pagination — with no per-cookbook or per-recipe override. The value SHALL be editable from Settings.

#### Scenario: Changing the global paper size updates every cookbook's print output
- **WHEN** the user changes the paper size setting
- **THEN** every cookbook's screen preview and print output render at the new paper size — none retain a different size

#### Scenario: A cookbook carries no per-project paper size override
- **WHEN** a cookbook project is created, edited, or imported
- **THEN** no per-project paper-size control or field is available to set a different paper size for that cookbook alone

#### Scenario: Changing the paper size re-evaluates recipe fit warnings
- **WHEN** the user changes the paper size setting
- **THEN** the system re-measures whether each recipe fits on a single page at the new size and updates any overflow warning badges accordingly, without requiring the user to re-save each recipe
