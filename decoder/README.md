# Recipe QR Decoder

A single dependency-free static HTML file (`index.html`) that decodes recipe
data shared from Cookbook Studio's "Share via QR" feature. See
`openspec/changes/recipe-qr-code-sharing/design.md` for the full design
rationale (Decision 3 explains why this is a separate static site rather
than a route inside the main app).

## How it works

- The cookbook app encodes a recipe's title and ingredients as
  `https://[this-domain]/#[lz-string-compressed-payload]` and renders that
  URL as a QR code (`src/components/QRCodeShare.vue`).
- Scanning the code opens this page. The compressed payload lives entirely
  in the URL fragment, so it is never sent to any server — this page can be
  hosted on any static file host with no backend.
- `index.html` vendors lz-string v1.5.0 inline (MIT licensed, see
  `node_modules/lz-string/LICENSE` in the main app) so the page has zero
  external runtime dependencies and works fully offline once loaded.
- Decompressed content is rendered exclusively via `textContent`/`createElement`,
  never `innerHTML`, so a malicious payload (e.g. `<script>...</script>` in
  the ingredient text) is displayed as inert text rather than executed. See
  `decoder/decoder.test.js` for the regression guard and
  `openspec/changes/recipe-qr-code-sharing/specs/recipe-qr-sharing/spec.md`
  ("Prevent XSS injection from decompressed content") for the requirement.

## Deploying

This page has no build step — deploy `index.html` as-is to any static host
(e.g. a CDN, GitHub Pages, Netlify, Cloudflare Pages).

1. Choose a domain (design.md Open Question 1 is not yet resolved — pick
   one and update `DECODER_BASE_URL` in `src/js/qrShare.js` to match, so
   the app generates QR codes pointing at the real deployment).
2. Upload/deploy `index.html` to that domain's document root.
3. Verify: open a recipe in the cookbook app, click "Share via QR", copy
   the "Decoder link" shown in the modal, and open it against the deployed
   domain — the recipe title and ingredients should render.
4. If the domain becomes unavailable, the cookbook app itself keeps working
   (QR generation just points at a broken link); only scanning is affected.

## Local testing

```
cd decoder
python3 -m http.server 8000
# open http://localhost:8000/#<a-compressed-fragment>
```

Generate a test fragment from a Node REPL in the main app directory:

```js
require('lz-string').compressToEncodedURIComponent('My Recipe\n2 cups flour\n1 egg')
```
