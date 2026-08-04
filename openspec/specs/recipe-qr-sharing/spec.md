# recipe-qr-sharing

## Purpose

Lets a user share a recipe's title and ingredient list to a phone as a scannable QR
code, entirely offline and serverless — the compressed payload lives in the QR
code's URL fragment, so no backend or account is involved on either end. The
app's own `/decode` route extracts and renders the payload as plain text.

## Requirements

### Requirement: Generate QR code from recipe ingredient list

The system SHALL generate a scannable QR code encoding a recipe's title and ingredient list using
lz-string compression and URL-fragment encoding. The QR code SHALL be rendered inline on the printed
recipe page — not in a modal or overlay — and remain at or below Version 15 (77×77 grid) to ensure
reliable scanning by standard smartphone cameras.

The QR code SHALL be visible in the on-screen print preview as well as in the physical printed
output, positioned unobtrusively in the bottom-right corner of the recipe article so it does not
obscure layout content.

When the full ingredient list would produce a QR code denser than Version 15, the system SHALL
progressively drop ingredients from the end of the list — largest prefix first — until the remaining
list fits at or below Version 15, and SHALL label the QR code with how many of the total ingredients
it encodes. Only when no prefix (down to zero ingredients) fits SHALL the system render a text
fallback notice instead of a QR canvas.

#### Scenario: QR code renders on recipe print page for a small ingredient list
- **WHEN** a user opens the print preview for a recipe with fewer than 500 characters of ingredient data
- **THEN** the system renders a QR code canvas inline within the recipe page layout
- **AND** the resulting QR code is at or below Version 15 (77×77 grid)
- **AND** the QR code is positioned in the bottom-right corner of the recipe article

#### Scenario: QR code truncates ingredients to stay scannable
- **WHEN** a user opens the print preview for a recipe whose full ingredient list would exceed
  Version 15
- **THEN** the system encodes the largest prefix of the ingredient list that still fits at or below
  Version 15
- **AND** the printed caption discloses how many of the total ingredients are included (e.g. "first
  12 of 20")

#### Scenario: Recipe page shows fallback notice when even a truncated list won't fit
- **WHEN** a user opens the print preview for a recipe whose title and metadata alone would exceed
  Version 15
- **THEN** the system renders a small text notice in place of the QR canvas (e.g., "Ingredient list
  too long to encode as QR")
- **AND** no QR canvas is displayed

#### Scenario: QR code does not appear in a modal or require user interaction to access
- **WHEN** a user views the print preview
- **THEN** the QR code is visible directly on the recipe page without clicking any button or opening
  any dialog

### Requirement: Compress payload using LZ-String

The system SHALL use lz-string's `compressToEncodedURIComponent` method to compress recipe ingredient data before encoding into the QR URL fragment. Compression SHALL reduce payload size by 40-60% on typical recipe text to keep the final URL under 2000 characters.

#### Scenario: Compress typical recipe ingredient list
- **WHEN** system encodes a recipe with 800 characters of ingredient data
- **THEN** compressed payload is at most 480 characters (60% of original)
- **AND** the URL with compressed payload is less than 2000 characters total

#### Scenario: Decompression on scanner device
- **WHEN** a user scans the QR code on a mobile device
- **THEN** the browser extracts `window.location.hash` containing the compressed payload
- **AND** the system uses lz-string's `decompressFromEncodedURIComponent` to recover the original ingredient data

### Requirement: URL-fragment-based data transmission

The system SHALL construct QR code URLs using the format `[app-origin]/decode#[compressed-payload]`,
where `[app-origin]` is the origin the app is currently running from, so that recipe data is
transmitted entirely in the URL fragment and processed client-side without server access to the
encoded data.

#### Scenario: QR code encodes full recipe data
- **WHEN** system generates a QR code for a recipe
- **THEN** the QR URL contains the full compressed ingredient payload in the fragment
- **AND** no data is sent to any backend or decoder server endpoint

#### Scenario: Scanner opens QR URL with fragment intact
- **WHEN** a mobile device scans the QR code and opens the `/decode` URL
- **THEN** the URL fragment (compressed payload) is preserved by the browser
- **AND** the `/decode` route's code can access and decompress it via `window.location.hash`

### Requirement: Prevent XSS injection from decompressed content

The system SHALL render decompressed recipe data in a way that never interprets it as HTML markup,
so a maliciously crafted payload (e.g. containing script tags) is always displayed as inert text.

#### Scenario: Malicious input in compressed payload
- **WHEN** a maliciously crafted QR code contains script tags or HTML in the compressed payload
- **THEN** the `/decode` route renders the payload as plain text
- **AND** no JavaScript executes and no HTML elements are rendered

#### Scenario: Copy-to-clipboard action preserves plain text
- **WHEN** user clicks "Copy to Clipboard" on the `/decode` route
- **THEN** the plain text ingredient data is copied to the clipboard
- **AND** HTML entities or tags are not interpreted

### Requirement: Graceful error handling for malformed QR codes

The decoder application SHALL detect and handle decompression failures gracefully. When a QR code payload cannot be decompressed or is corrupted, the system SHALL display a user-friendly error message.

#### Scenario: Corrupted or invalid QR payload
- **WHEN** user scans a QR code with a corrupted compressed payload
- **THEN** lz-string decompression throws an error
- **AND** the decoder page displays "Invalid or corrupted recipe code." or similar error message
- **AND** the page remains functional and does not crash

#### Scenario: Empty or missing fragment
- **WHEN** user navigates to the decoder URL without a fragment or with an empty fragment
- **THEN** the decoder page displays a message prompting the user to scan a QR code
- **AND** the page provides a fallback action (e.g., "Scan a recipe QR code to get started")
