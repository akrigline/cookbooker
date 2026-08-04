## Why

The QR decoder currently ships as a second, dependency-free static site in `decoder/`, deployed to
its own dedicated domain (design.md Decision 3 of the original `recipe-qr-code-sharing` change, and
still-unresolved Open Question 1 on which domain to use). The user now intends to host the whole app
on GitHub Pages, which only serves one site per deployment — there is no way to keep the decoder as a
separately-deployed site alongside the main app. Folding it into the SPA as an ordinary route removes
that constraint and closes the domain open question entirely.

## What Changes

- Add a `/decode` route to the Vue app (`router/index.js`), rendered with the same header/nav chrome
  as every other route.
- Add `src/views/DecodeRecipe.vue`, replicating the standalone decoder page's behavior (empty/error/
  result states, title + ingredient list, copy-to-clipboard) using the app's existing page-shell
  styles instead of bespoke inline CSS. It reuses `decompressPayload`/`parseRecipePayload` from
  `src/js/qrShare.js` unchanged.
- **BREAKING**: Remove the `DECODER_BASE_URL` constant from `src/js/qrShare.js`. `generateQRURL` now
  builds the link from `window.location.origin` + `/decode` + the compressed fragment instead of a
  dedicated external domain — any previously-printed QR codes pointing at the old placeholder domain
  will no longer resolve (that domain was never actually deployed, so nothing live breaks).
- Delete `decoder/index.html`, `decoder/README.md`, and `decoder/decoder.test.js` — the standalone
  static site is retired entirely.
- Update `qrShare.test.js`'s `generateQRURL` coverage for the origin-based URL.

## Capabilities

### New Capabilities
(none)

### Modified Capabilities
- `recipe-qr-sharing`: the decoder is no longer a standalone static site on its own domain — it's the
  `/decode` route of the main app, and the QR URL is built from the app's own origin instead of a
  dedicated decoder domain. The XSS-safety requirement is rephrased to be implementation-agnostic
  (never interprets decompressed content as HTML markup) rather than mandating the `textContent`/
  `innerHTML` DOM APIs specifically, since rendering now goes through Vue's template compiler instead
  of hand-written DOM code.

## Impact

- `src/router/index.js` — new route.
- `src/views/DecodeRecipe.vue` — new file.
- `src/js/qrShare.js` — `DECODER_BASE_URL` removed, `generateQRURL` behavior changes, new exported
  route-path constant.
- `src/js/qrShare.test.js` — updated assertions.
- `decoder/` — deleted (`index.html`, `README.md`, `decoder.test.js`).
- No changes to GitHub Pages deployment configuration itself (base path, workflow, custom domain) —
  that remains separate follow-up work.
