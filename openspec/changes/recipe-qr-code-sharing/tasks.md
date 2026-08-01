## 1. Cookbook App Setup

- [x] 1.1 Add lz-string dependency to package.json
- [x] 1.2 Add qrcode.js (or equivalent QR rendering library) to package.json
- [x] 1.3 Verify dependencies install without conflicts and update lock file
- [x] 1.4 Create unit tests for QR payload compression and decompression

## 2. QR Code Component Development

- [x] 2.1 Create QRCodeShare.vue component with QR generation logic
- [x] 2.2 Implement `encodeRecipePayload()` function to extract recipe title and ingredients
- [x] 2.3 Implement `compressPayload()` function using lz-string's compressToEncodedURIComponent
- [x] 2.4 Implement `generateQRURL()` function that constructs decoder URL with compressed fragment
- [x] 2.5 Integrate QR rendering library and display generated QR code in component
- [x] 2.6 Add payload size validation and warnings when recipe data exceeds 1500 characters
- [x] 2.7 Add truncation option for oversized recipes (optional user control)

## 3. UI Integration

- [x] 3.1 Integrate QRCodeShare component into RecipeDetail.vue or RecipeLibrary.vue view
      (this branch's redesign merged recipe detail into `RecipeEditor.vue`; integrated there)
- [x] 3.2 Add "Share via QR" button to recipe detail/view interface
- [x] 3.3 Add modal or popup UI to display QR code and decoder URL
- [x] 3.4 Style QR component to be mobile-friendly and print-friendly
- [x] 3.5 Test QR code generation and display across multiple recipes
      (verified in-browser with a 7-ingredient recipe and a synthetic 80-ingredient recipe,
      desktop and mobile viewports)

## 4. Decoder Site Development

- [x] 4.1 Create standalone static HTML decoder page at separate domain
      (page built at `decoder/index.html`; not yet deployed to a live domain — see 6.3/6.4)
- [x] 4.2 Implement `decompressPayload()` function using lz-string's decompressFromEncodedURIComponent
- [x] 4.3 Implement URL fragment extraction via window.location.hash
- [x] 4.4 Render decompressed content as plain text using textContent (XSS prevention)
- [x] 4.5 Implement "Copy to Clipboard" button for decompressed ingredient data
- [x] 4.6 Add graceful error handling for malformed/corrupted QR payloads
- [x] 4.7 Add fallback UI for when no fragment is present (empty state)
- [x] 4.8 Style decoder page for mobile viewing and readability

## 5. Testing & Validation

- [x] 5.1 Write unit tests for payload compression with various recipe sizes
- [x] 5.2 Write unit tests for decompression and XSS prevention scenarios
- [x] 5.3 Verify QR codes stay at Version 15 or below (using Error Correction Level L)
- [x] 5.4 Test QR code generation for recipes with minimum, typical, and maximum ingredient lists
- [ ] 5.5 Test QR scanning on multiple smartphone brands and models (iOS, Android)
      (needs physical devices; not something an agent session can perform)
- [ ] 5.6 Test decoder page on mobile browsers (Chrome, Safari, Firefox)
      (only verified in Chrome/Chromium so far, at a mobile viewport size; Safari/Firefox and
      real-device testing still needed)
- [x] 5.7 Test malformed payload handling in decoder (corrupted base64, truncated data)
- [x] 5.8 Test empty fragment handling in decoder (no QR code scanned)
- [x] 5.9 Verify no XSS vulnerabilities in decoder with malicious payloads

## 6. Documentation & Deployment

- [x] 6.1 Document QR code feature in user-facing help or tutorial
      (no in-app help/tutorial system exists yet; the QR modal itself carries user-facing
      explanatory copy, which is the pragmatic equivalent here)
- [x] 6.2 Document decoder domain URL and fallback instructions (`decoder/README.md`)
- [ ] 6.3 Set up decoder domain and static hosting (CDN or static site host)
      (needs a hosting decision/account from the project owner)
- [ ] 6.4 Deploy decoder site and verify accessibility from cookbook app
      (blocked on 6.3)
- [x] 6.5 Update project README to mention QR sharing capability
- [ ] 6.6 Prepare release notes for QR code feature launch
      (no changelog/release-notes convention exists in this repo yet; deferred to the project
      owner rather than inventing one)

## 7. Launch Checklist

- [ ] 7.1 Coordinate decoder domain availability with hosting provider
      (blocked on 6.3; external coordination)
- [ ] 7.2 Perform end-to-end testing: generate QR → scan → decode → view on mobile
      (the generate → decode → render pipeline was verified end-to-end in-browser; the
      physical camera-scan step needs a real device, see 5.5)
- [x] 7.3 Verify decoder page accessibility and error messages are user-friendly
- [ ] 7.4 Monitor for QR generation or decoding issues post-launch
      (not applicable until the decoder is actually deployed)
- [x] 7.5 Prepare rollback plan if decoder site becomes unavailable
      (documented in `decoder/README.md`: the cookbook app keeps working if the decoder
      domain goes down — only scanning is affected)
