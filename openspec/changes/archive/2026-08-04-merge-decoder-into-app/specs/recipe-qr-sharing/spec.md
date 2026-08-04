## MODIFIED Requirements

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
