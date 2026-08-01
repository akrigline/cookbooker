## Why

Users need a serverless way to share recipe ingredient lists from physical printouts or screens to mobile devices. QR codes provide an offline-friendly, rapid sharing mechanism that requires no backend infrastructure—all data is encoded directly in the QR pattern via compressed URL hash.

## What Changes

- Add QR code generation to the recipe view, displaying a scannable code containing the recipe's ingredient list and metadata
- Create and deploy a static decoder web app that extracts, decompresses, and displays QR-encoded recipe data
- Integrate LZ-String compression library for efficient payload encoding within QR size constraints
- Support URL-fragment-based data transmission so the decoder can retrieve recipe data entirely client-side
- Implement error handling for malformed or corrupted QR codes
- Add warnings when recipe data exceeds the recommended character limit for reliable QR scanning

## Capabilities

### New Capabilities
- `recipe-qr-sharing`: Generate and render QR codes encoding recipe ingredient lists and metadata with LZ-String compression for offline, serverless recipe sharing

### Modified Capabilities

## Impact

- Recipe display and detail views: Add QR code generation and rendering UI
- New dependencies: `lz-string` (compression), `qrcode.js` or equivalent (QR rendering)
- Static decoder site: Deployed separately (not in this repo, but integrated as external reference)
- Security: Decoder must validate and sanitize decompressed content to prevent XSS injection
- No database or backend API changes required
