## MODIFIED Requirements

### Requirement: Single-Page Recipe Layout Constraint

Every recipe page SHALL be styled to render as a single printed page. Page breaks MUST be enforced
to prevent content from spilling across pages. Each recipe page SHALL include an inline QR code
widget in the bottom-right corner of the recipe article, encoding the recipe's ingredient list for
easy transfer to a shopping list application. When the ingredient list is too large to produce a
reliably scannable QR code (Version > 15 at error correction Level L), the widget SHALL display a
brief text notice instead of a QR canvas.

#### Scenario: Print Page Break Isolation
- **WHEN** the cookbook is printed or previewed
- **THEN** the layout separates each recipe onto its own distinct printed sheet

#### Scenario: Inline QR widget present on recipe page
- **WHEN** a recipe page is rendered for print preview or printing
- **THEN** a QR code widget is visible in the bottom-right corner of the recipe article
- **AND** the widget encodes the recipe title and ingredient list

#### Scenario: QR widget shows fallback when ingredients are too long
- **WHEN** a recipe page is rendered and the compressed ingredient payload would produce a QR code larger than Version 15
- **THEN** the QR canvas is replaced by a short text notice
- **AND** the rest of the recipe layout is unaffected
