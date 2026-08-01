## ADDED Requirements

### Requirement: Generate QR code from recipe ingredient list

The system SHALL generate a scannable QR code encoding a recipe's ingredient list and essential metadata (recipe title, ingredient data) using lz-string compression and URL-fragment encoding. The QR code SHALL be displayable in the recipe view and remain at or below Version 15 (77x77 grid) to ensure reliable scanning by standard smartphone cameras.

#### Scenario: Generate QR code for recipe with small ingredient list
- **WHEN** user views a recipe with fewer than 500 characters of ingredient data
- **THEN** system generates and displays a QR code with error correction level 'L'
- **AND** the resulting QR code is at or below Version 15 (77x77 grid)

#### Scenario: User views recipe with large ingredient list
- **WHEN** user views a recipe with more than 1500 characters of ingredient data
- **THEN** system displays a warning that the recipe data is too large for reliable QR scanning
- **AND** provides an option to view or truncate the ingredient list

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

The system SHALL construct QR code URLs using the format `https://[decoder-domain].com/#[compressed-payload]` so that recipe data is transmitted entirely in the URL fragment and processed client-side without server access to the encoded data.

#### Scenario: QR code encodes full recipe data
- **WHEN** system generates a QR code for a recipe
- **THEN** the QR URL contains the full compressed ingredient payload in the fragment
- **AND** no data is sent to any backend or decoder server endpoint

#### Scenario: Scanner opens QR URL with fragment intact
- **WHEN** a mobile device scans the QR code and opens the decoder URL
- **THEN** the URL fragment (compressed payload) is preserved by the browser
- **AND** the decoder page JavaScript can access and decompress it via `window.location.hash`

### Requirement: Prevent XSS injection from decompressed content

The decoder application SHALL render decompressed recipe data strictly as plain text using `textContent` or `innerText`, never as HTML via `innerHTML`, to prevent XSS injection attacks.

#### Scenario: Malicious input in compressed payload
- **WHEN** a maliciously crafted QR code contains script tags or HTML in the compressed payload
- **THEN** the decoder application renders the payload as plain text
- **AND** no JavaScript executes and no HTML elements are rendered

#### Scenario: Copy-to-clipboard action preserves plain text
- **WHEN** user clicks "Copy to Clipboard" on the decoder page
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
