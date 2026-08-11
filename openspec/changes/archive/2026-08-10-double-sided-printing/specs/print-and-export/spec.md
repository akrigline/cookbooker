## ADDED Requirements

### Requirement: Double-Sided Printing Toggle
Each project SHALL have a `doubleSidedEnabled` setting, defaulting to off, independent of the existing page-numbers setting. When off, the full cookbook compiles exactly as it does with double-sided printing unsupported: no blank pages, uniform margins, page numbers (if enabled) always in the top-right corner.

#### Scenario: Toggle available in cookbook settings
- **WHEN** the user opens the Edit Cookbook Details dialog
- **THEN** a "Double-sided printing" checkbox is shown alongside the existing page-numbers checkbox, reflecting the project's current setting

#### Scenario: Toggle off preserves existing single-sided output
- **WHEN** a project has double-sided printing OFF
- **THEN** the compiled book contains no blank pages, every page uses the same uniform margin, and page numbers (if enabled) are positioned in the top-right corner of every page

### Requirement: Gutter Margins on Double-Sided Interior Pages
When a project has double-sided printing enabled, every interior page (every page after the Title Page) SHALL use an asymmetric margin: a wider gutter margin on the binding edge and a narrower outer margin on the opposite edge. The binding edge SHALL be the left edge on a right-hand (recto) page and the right edge on a left-hand (verso) page. The Title Page SHALL always use the standard uniform margin regardless of the toggle.

#### Scenario: Recto interior page has left-side gutter
- **WHEN** double-sided printing is enabled and an interior page falls on an odd (right-hand) physical page position
- **THEN** that page's left margin is wider than its right margin

#### Scenario: Verso interior page has right-side gutter
- **WHEN** double-sided printing is enabled and an interior page falls on an even (left-hand) physical page position
- **THEN** that page's right margin is wider than its left margin

#### Scenario: Title Page margin unaffected by the toggle
- **WHEN** double-sided printing is enabled
- **THEN** the Title Page still uses the same uniform margin as when double-sided printing is off

### Requirement: Recto-Forced Section Starts
When a project has double-sided printing enabled, the system SHALL insert a blank page wherever needed so that the Table of Contents and every Chapter Divider begin on a right-hand (recto) physical page, and SHALL always insert a blank page immediately after the Title Page. Inserted blank pages SHALL occupy a physical page position (and, where page numbers are enabled, silently consume a page-number slot) without displaying any content or visible page number.

#### Scenario: Blank page always follows the Title Page
- **WHEN** double-sided printing is enabled
- **THEN** the page immediately after the Title Page is blank, and the Table of Contents (or, if page numbers are off, the first Chapter Divider) begins on the next page

#### Scenario: Blank page inserted before a chapter landing on a verso page
- **WHEN** double-sided printing is enabled and a Chapter Divider would otherwise fall on an even (left-hand) physical page
- **THEN** a blank page is inserted immediately before that Chapter Divider so it falls on an odd (right-hand) page instead

#### Scenario: No blank page needed when a chapter already lands on recto
- **WHEN** double-sided printing is enabled and a Chapter Divider already falls on an odd (right-hand) physical page
- **THEN** no blank page is inserted before it

## MODIFIED Requirements

### Requirement: Document Sequence Compilation
When compiling a full cookbook for printing, the system SHALL generate pages in the following sequential order: Title Page (Title, Subtitle, Cover Layout, Accent Color), Table of Contents (only if page numbers are enabled), and Chapter sequences. Each Chapter sequence MUST begin with a Chapter Divider Page followed by its associated recipes in their designated order. When the project has double-sided printing enabled, blank pages MAY be inserted into this sequence per the Recto-Forced Section Starts requirement, without otherwise changing the relative order of the Title Page, Table of Contents, chapters, and recipes.

#### Scenario: Full Book Order with Page Numbers
- **WHEN** the user triggers a full export with page numbers toggled ON
- **THEN** the print layout compiles: Title Page, Table of Contents, Chapter Divider, and Recipe Pages

#### Scenario: Full Book Order without Page Numbers
- **WHEN** the user triggers a full export with page numbers toggled OFF
- **THEN** the print layout compiles: Title Page, Chapter Divider, and Recipe Pages, omitting the Table of Contents

#### Scenario: Full Book Order with Double-Sided Printing
- **WHEN** the user triggers a full export with double-sided printing toggled ON
- **THEN** the print layout compiles the same relative sequence (Title Page, optionally Table of Contents, then chapters and recipes) with blank pages inserted per the Recto-Forced Section Starts requirement

### Requirement: System Print Integration
The system SHALL initiate printing using the browser's system print dialog. Page numbers MUST be rendered dynamically on recipe pages, but suppressed on the Title Page and the Table of Contents pages. When a project has double-sided printing enabled, each page's number SHALL be positioned at the outer top corner of that page (top-right on a right-hand/recto page, top-left on a left-hand/verso page) instead of always top-right.

#### Scenario: Launching Print Dialog
- **WHEN** the user triggers the print action
- **THEN** the system displays the print preview and opens the system print window

#### Scenario: Page number mirrors to the outer corner on double-sided books
- **WHEN** double-sided printing is enabled and a numbered page falls on a left-hand (verso) physical page
- **THEN** that page's number is positioned in the top-left corner instead of the top-right
