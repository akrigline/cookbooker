# print-and-export

## Purpose

Compiles a project's pages (Title Page, Table of Contents, Chapter Dividers, and Recipe Sheets) into a print-ready HTML document optimized for the browser's native print-to-PDF pipeline, and provides local JSON/Base64 backup export and restore so a user's full library survives a browser data wipe.
## Requirements
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

### Requirement: Single-Page Recipe Layout Constraint
Every recipe page SHALL be styled to render as a single printed page at the app's currently configured global paper size (see `app-settings`'s Global Paper Size requirement). Page breaks MUST be enforced to prevent content from spilling across pages. Each recipe page SHALL include an inline QR code widget in the bottom-right corner of the recipe article, encoding the recipe's ingredient list for easy transfer to a shopping list application (see `recipe-qr-sharing` for the widget's truncation and fallback behavior). The system SHALL proactively surface a violation of this constraint by persisting a nullable `fitsOnPage` boolean field on each recipe record, computed by measuring the recipe's rendered sheet against a single print page at the current global paper size, after any write that creates or modifies the recipe, and after the global paper size itself changes. This lets list views warn the user before print time, rather than the recipe silently bleeding onto a second sheet only discovered when printed.

#### Scenario: Print Page Break Isolation
- **WHEN** the cookbook is printed or previewed
- **THEN** the layout separates each recipe onto its own distinct printed sheet

#### Scenario: Inline QR widget present on recipe page
- **WHEN** a recipe page is rendered for print preview or printing
- **THEN** a QR code widget is visible in the bottom-right corner of the recipe article
- **AND** the widget encodes the recipe title and ingredient list

#### Scenario: fitsOnPage is computed after a recipe write
- **WHEN** a recipe is created or edited and saved
- **THEN** the system measures whether the saved recipe's rendered sheet overflows a single print page at the current global paper size and persists the result (`true` or `false`) to that recipe's `fitsOnPage` field

#### Scenario: Unmeasured recipes are distinguishable from measured ones
- **WHEN** a recipe has never been created or edited since this measurement was introduced
- **THEN** its `fitsOnPage` field is `null`, distinct from a definite `true`/`false` measurement result

#### Scenario: fitsOnPage is re-measured when the global paper size changes
- **WHEN** the user changes the global paper size setting
- **THEN** every recipe's `fitsOnPage` field is re-measured against the new paper size and persisted, without requiring the user to open or re-save that recipe

### Requirement: Page Geometry Follows Global Paper Size
The system SHALL derive every page's physical dimensions — the screen preview box, the print `@page` size, and table-of-contents pagination measurement — from the app's currently configured global paper size (Letter or A4). Margin and double-sided binding-gutter widths SHALL remain fixed absolute measurements independent of paper size; only page width and height SHALL vary by paper size.

#### Scenario: Screen preview matches the configured paper size
- **WHEN** the global paper size is set to A4
- **THEN** the print screen preview renders each page at A4 dimensions instead of Letter

#### Scenario: Print output matches the configured paper size
- **WHEN** the global paper size is set to A4 and the user prints or previews a cookbook
- **THEN** the browser's print dialog reports an A4-sized page

#### Scenario: Table of contents paginates against the configured paper size
- **WHEN** the global paper size is set to A4
- **THEN** the table of contents' page-count and column layout are measured against A4's content box, not Letter's

#### Scenario: Margins and gutters are unaffected by paper size
- **WHEN** the global paper size changes between Letter and A4
- **THEN** the absolute margin and double-sided binding-gutter widths remain the same on both sizes

### Requirement: Single Recipe Export
The system SHALL support exporting a single recipe. Individual recipe exports MUST match the margins, template, and accent color of their parent project, and SHALL NOT display page numbers.

#### Scenario: Single Recipe Print Generation
- **WHEN** the user exports a single recipe from Project A
- **THEN** the system generates a single-page print layout matching the styles of Project A without any Title Page, Table of Contents, or page numbering

### Requirement: System Print Integration
The system SHALL initiate printing using the browser's system print dialog. Page numbers MUST be rendered dynamically on recipe pages, but suppressed on the Title Page and the Table of Contents pages. When a project has double-sided printing enabled, each page's number SHALL be positioned at the outer top corner of that page (top-right on a right-hand/recto page, top-left on a left-hand/verso page) instead of always top-right.

#### Scenario: Launching Print Dialog
- **WHEN** the user triggers the print action
- **THEN** the system displays the print preview and opens the system print window

#### Scenario: Page number mirrors to the outer corner on double-sided books
- **WHEN** double-sided printing is enabled and a numbered page falls on a left-hand (verso) physical page
- **THEN** that page's number is positioned in the top-left corner instead of the top-right

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

