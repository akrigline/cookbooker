## MODIFIED Requirements

### Requirement: Generate QR code from recipe ingredient list

The system SHALL generate a scannable QR code encoding a recipe's ingredient list and essential
metadata (recipe title, ingredient data) using lz-string compression and URL-fragment encoding. The
QR code SHALL be rendered inline on the printed recipe page — not in a modal or overlay — and remain
at or below Version 15 (77×77 grid) to ensure reliable scanning by standard smartphone cameras.

The QR code SHALL be visible in the on-screen print preview as well as in the physical printed
output, positioned unobtrusively in the bottom-right corner of the recipe article so it does not
obscure layout content.

#### Scenario: QR code renders on recipe print page for a small ingredient list
- **WHEN** a user opens the print preview for a recipe with fewer than 500 characters of ingredient data
- **THEN** the system renders a QR code canvas inline within the recipe page layout
- **AND** the resulting QR code is at or below Version 15 (77×77 grid)
- **AND** the QR code is positioned in the bottom-right corner of the recipe article

#### Scenario: Recipe page shows fallback notice for an oversized ingredient list
- **WHEN** a user opens the print preview for a recipe with more than 1500 characters of ingredient data OR whose QR version would exceed 15
- **THEN** the system renders a small text notice in place of the QR canvas (e.g., "Ingredient list too long to encode as QR")
- **AND** no QR canvas is displayed

#### Scenario: QR code does not appear in a modal or require user interaction to access
- **WHEN** a user views the print preview
- **THEN** the QR code is visible directly on the recipe page without clicking any button or opening any dialog

## REMOVED Requirements

### Requirement: Display QR sharing modal from recipe editor
**Reason**: The modal entry point is removed. The QR code is now embedded on the printed recipe page
itself, which is the correct physical context for scan-to-shop use. The editor toolbar no longer
needs a QR sharing affordance.
**Migration**: Users who previously used the "Share via QR" modal button should now use the Print /
Save as PDF action; the QR code will appear on the printed recipe page automatically.
