## MODIFIED Requirements

### Requirement: Document Sequence Compilation
When compiling a full cookbook for printing, the system SHALL generate pages in the following sequential order: Title Page (Title, Subtitle, Cover Layout, Accent Color), Table of Contents (only if page numbers are enabled), and Chapter sequences. Each Chapter sequence MUST begin with a Chapter Divider Page followed by its associated recipes in their designated order.

#### Scenario: Full Book Order with Page Numbers
- **WHEN** the user triggers a full export with page numbers toggled ON
- **THEN** the print layout compiles: Title Page, Table of Contents, Chapter Divider, and Recipe Pages

#### Scenario: Full Book Order without Page Numbers
- **WHEN** the user triggers a full export with page numbers toggled OFF
- **THEN** the print layout compiles: Title Page, Chapter Divider, and Recipe Pages, omitting the Table of Contents
