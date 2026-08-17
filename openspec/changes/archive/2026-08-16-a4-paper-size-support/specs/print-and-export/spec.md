## MODIFIED Requirements

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

## ADDED Requirements

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
