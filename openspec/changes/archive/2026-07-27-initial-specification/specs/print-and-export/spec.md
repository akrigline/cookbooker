## ADDED Requirements

### Requirement: Document Sequence Compilation
When compiling a full cookbook for printing, the system SHALL generate pages in the following sequential order: Title Page (Title, Subtitle, Author, Cover Layout, Accent Color), Table of Contents (only if page numbers are enabled), and Chapter sequences. Each Chapter sequence MUST begin with a Chapter Divider Page followed by its associated recipes in their designated order.

#### Scenario: Full Book Order with Page Numbers
- **WHEN** the user triggers a full export with page numbers toggled ON
- **THEN** the print layout compiles: Title Page, Table of Contents, Chapter Divider, and Recipe Pages

#### Scenario: Full Book Order without Page Numbers
- **WHEN** the user triggers a full export with page numbers toggled OFF
- **THEN** the print layout compiles: Title Page, Chapter Divider, and Recipe Pages, omitting the Table of Contents

### Requirement: Single-Page Recipe Layout Constraint
Every recipe page SHALL be styled to render as a single printed page. Page breaks MUST be enforced to prevent content from spilling across pages.

#### Scenario: Print Page Break Isolation
- **WHEN** the cookbook is printed or previewed
- **THEN** the layout separates each recipe onto its own distinct printed sheet

### Requirement: Single Recipe Export
The system SHALL support exporting a single recipe. Individual recipe exports MUST match the margins, template, and accent color of their parent project, and SHALL NOT display page numbers.

#### Scenario: Single Recipe Print Generation
- **WHEN** the user exports a single recipe from Project A
- **THEN** the system generates a single-page print layout matching the styles of Project A without any Title Page, Table of Contents, or page numbering

### Requirement: System Print Integration
The system SHALL initiate printing using the browser's system print dialog. Page numbers MUST be rendered dynamically on recipe pages, but suppressed on the Title Page and the Table of Contents pages.

#### Scenario: Launching Print Dialog
- **WHEN** the user triggers the print action
- **THEN** the system displays the print preview and opens the system print window

### Requirement: Local Data Export Backup
The system SHALL allow the user to download a backup file containing all of their cookbooks, recipes, and uploaded images. The downloaded file MUST be self-contained so that it can be imported on any other machine.

#### Scenario: Downloading Backup
- **WHEN** the user clicks "Backup Data"
- **THEN** the system generates a single file containing all data and triggers a browser download

### Requirement: Local Data Import Restore
The system SHALL allow the user to restore their cookbooks and recipes by uploading a previously downloaded backup file. Uploading a valid backup file MUST restore all recipes, projects, chapters, and associated images to the user's local library.

#### Scenario: Restoring from Backup
- **WHEN** the user uploads a valid backup file
- **THEN** the system updates the local library with the contents of the backup, recovering all associated recipes and images
