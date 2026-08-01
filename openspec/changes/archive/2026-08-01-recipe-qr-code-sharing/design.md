## Context

The Cookbook Maker application allows users to create, store, and view recipes. Currently, there is no serverless method for sharing recipe data offline—users would need to copy/paste or manually re-enter ingredient lists when sharing from printouts or between devices. QR codes provide a natural, physical-world-friendly sharing mechanism that encodes all data directly in the pattern, requiring no backend infrastructure or database access.

The application is built on Vue.js with Vite, uses Pinia for state management, and stores recipes in IndexedDB locally. Introducing QR code generation adds a new UI component and a client-side library dependency, but does not require backend or database changes.

## Goals / Non-Goals

**Goals:**
- Enable users to generate QR codes from recipes, encoding ingredient lists and metadata
- Provide a serverless sharing mechanism where recipe data lives entirely in the QR pattern
- Support scanning and decoding on mobile devices via a lightweight static decoder page
- Ensure QR codes remain scannable (Version 15 or smaller) by limiting data density
- Prevent security vulnerabilities when decompressing and displaying untrusted QR payloads

**Non-Goals:**
- Store recipe data on a backend server or in a database
- Support real-time synchronization or collaborative editing via QR codes
- Implement user authentication or access control for QR-encoded recipes
- Build a full recipe-sharing social network (QR is for peer-to-peer, offline sharing only)
- Support sharing of images, videos, or other recipe attachments via QR
- Provide QR code customization (colors, logos, branding)

## Decisions

### Decision 1: Use lz-string for payload compression
**Choice**: Use `lz-string` library (specifically `compressToEncodedURIComponent` and `decompressFromEncodedURIComponent`).

**Rationale**: 
- Achieves 40-60% compression on typical recipe text with ingredients and titles
- Output is URL-safe (Base64 encoded), can be directly embedded in URL fragments
- Well-maintained, small footprint (~10KB minified)
- No server required; entire compression/decompression happens client-side

**Alternatives Considered**:
- Raw Base64 encoding: Would not compress, resulting in larger QR codes and reduced scannability
- gzip with Base64: Requires decompressor library and has larger overhead
- Custom compression: Adds maintenance burden and likely lower compression ratio

### Decision 2: Encode compressed payload in URL fragment (hash)
**Choice**: Construct QR URLs as `https://[decoder-domain].com/#[compressed-payload]`.

**Rationale**:
- Fragments are not sent to the server, so no server sees the recipe data
- Available to client-side JavaScript via `window.location.hash`
- Browser preserves fragments during navigation, so scanning → opening URL works without additional steps
- Supports pure static site deployment (no server-side processing needed)

**Alternatives Considered**:
- Query parameters: Would require server to proxy or process data; violates "no backend" constraint
- Data URIs: Not supported in QR standards and not compatible with typical QR scanners
- Multiple QR codes: Adds complexity; single QR is preferred for user experience

### Decision 3: Decoder as separate static web application
**Choice**: Decoder is a standalone static HTML/JavaScript site deployed to a dedicated domain, not part of the main cookbook app.

**Rationale**:
- Keeps decoder simple and lightweight (no framework overhead)
- Can be deployed and updated independently of cookbook app
- Reduces cookbook app bundle size (QR decoder lib not needed in main app)
- Clearer separation of concerns: encoder (cookbook) vs. decoder (static site)

**Alternatives Considered**:
- Embed decoder in cookbook app: Adds decoder code/deps to all users; increases bundle size
- Serve decoder as route in cookbook: Couples decoder lifecycle to main app updates

### Decision 4: Set QR error correction to Level 'L' (Low)
**Choice**: Use error correction level 'L' (7% capacity) when generating QR codes.

**Rationale**:
- Level L maximizes data capacity within a given QR version (fewer pixels needed)
- Keeps QR codes at Version 15 or below, remaining scannable by standard smartphone cameras
- Trade-off: 7% redundancy is adequate for most printed/screen scanning scenarios; loss of error correction is unlikely in typical use

**Alternatives Considered**:
- Level M/Q/H: Would increase QR size and reduce data capacity, requiring either larger QR codes or truncated recipes
- Adaptive correction levels: Adds complexity without clear user benefit

### Decision 5: Warn user and offer truncation for oversized recipes
**Choice**: If ingredient data exceeds 1500 characters (after compression check), display a warning and allow user to truncate or view the ingredient list.

**Rationale**:
- 1500 characters pre-compression typically results in a URL under 2000 characters (well within browser/scanner limits)
- Gives user visibility into encoding limits and options rather than silently truncating
- Preserves data integrity (no silent data loss)

**Alternatives Considered**:
- Silent truncation: Poor UX; user would not know recipe is incomplete
- Hard limit at 2000 characters: Less transparent to users; algorithm-dependent

## Risks / Trade-offs

**[Risk] Compression ratio varies by recipe content** → *Mitigation*: Conservative 1500-character pre-compression limit ensures URLs stay under 2000 characters even in worst-case scenarios (low-compression text). Application displays clear warnings when payload is large.

**[Risk] QR code scanning failures on small displays or low-quality cameras** → *Mitigation*: Version 15 (77x77 pixels) is a well-tested limit for mobile scanners. User warnings and fallback link option (if decoder domain is also accessible via traditional link) provide alternatives.

**[Risk] Decoder domain availability is external to cookbook app** → *Mitigation*: Decoder is a lightweight static site with no dependencies; can be hosted on a reliable CDN. Loss of decoder domain would only affect scanning; encoder app remains functional.

**[Risk] XSS injection if decompressed content is not properly sanitized** → *Mitigation*: Decoder page MUST use `textContent` or `innerText` exclusively; never `innerHTML`. Security is enforced at the spec level (Requirement: Prevent XSS injection from decompressed content).

**[Risk] URL length limits across browsers/QR scanners** → *Mitigation*: Modern browsers and QR standards support up to 2000+ characters. Compression strategy targets staying under 2000 for all typical recipes. Testing and warnings provide safeguards.

## Migration Plan

1. **Phase 1 (Cookbook App)**:
   - Add `lz-string` and `qrcode.js` (or equivalent) to package dependencies
   - Create QR code UI component (button/modal in recipe view)
   - Integrate component into recipe detail/display views
   - Update tests to cover QR generation and edge cases

2. **Phase 2 (Decoder Site)**:
   - Create separate static HTML/CSS/JS application at dedicated domain
   - Implement LZ-String decompression and plain-text rendering
   - Add error handling for malformed payloads
   - Deploy to CDN or static hosting

3. **Phase 3 (Launch)**:
   - Coordinate decoder domain availability before cookbook release
   - Add user documentation or help text explaining QR scanning
   - Monitor for any QR generation or decoding issues

## Open Questions

1. Which decoder domain should be used? (e.g., `recipe-decode.example.com`, `qr.cookbook-maker.app`, third-party service?)
2. Should the cookbook app provide a fallback mechanism if the decoder domain is unavailable?
3. Should recipe QR codes include metadata beyond ingredients (e.g., cook time, servings)? (Current spec focuses on ingredients + title; expansion would affect payload size.)
4. Should there be a setting to customize what data is encoded (e.g., user could exclude certain ingredients)?
