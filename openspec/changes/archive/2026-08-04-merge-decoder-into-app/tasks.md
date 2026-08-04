## 1. `qrShare.js` changes

- [x] 1.1 Add `export const DECODE_ROUTE_PATH = '/decode'` to `src/js/qrShare.js`.
- [x] 1.2 Remove `DECODER_BASE_URL` and rewrite `generateQRURL` to build
      `${window.location.origin}${DECODE_ROUTE_PATH}#${compressPayload(payload)}`.

## 2. `/decode` route

- [x] 2.1 Create `src/views/DecodeRecipe.vue`: read `window.location.hash` on mount and on
      `hashchange`; derive empty/error/result state using `decompressPayload`/`parseRecipePayload`
      from `qrShare.js` (no parsing logic duplicated in the component).
- [x] 2.2 Render the result state via `{{ }}` interpolation only (no `v-html`) — title, ingredient
      list (or the "no ingredients" message), and a copy-to-clipboard button with the same
      "Copied!" / "Couldn't copy — select the text manually" fallback UX as the old page.
- [x] 2.3 Style the view with the app's existing page-shell classes (`cm-page-main--narrow`,
      `text-page-title`, gray/danger color tokens) instead of bespoke CSS.
- [x] 2.4 Register the route in `src/router/index.js` using `DECODE_ROUTE_PATH` from `qrShare.js`
      as the path, `name: 'decode'`, rendered with the app's normal chrome (no special-casing in
      `App.vue`).

## 3. Remove the standalone decoder site

- [x] 3.1 Delete `decoder/index.html`, `decoder/README.md`, `decoder/decoder.test.js`.

## 4. Tests

- [x] 4.1 Update `src/js/qrShare.test.js`'s `generateQRURL` tests for the origin-based URL
      (`DECODE_ROUTE_PATH` instead of `DECODER_BASE_URL`).
- [x] 4.2 Confirm `decompressPayload`/`parseRecipePayload` coverage (round-trip, malformed input,
      malicious-payload-as-inert-string) still fully exercises what `DecodeRecipe.vue` depends on;
      add any gaps found.

## 5. Verification

- [x] 5.1 `npm test` passes.
- [x] 5.2 `npm run build` passes.
- [x] 5.3 Manually verify in the browser: empty state (visit `/decode` with no hash), a valid
      compressed fragment (generate one via `RecipeQRCode.vue` or the Node REPL snippet from the
      old `decoder/README.md`), a malformed fragment (error state), and a malicious payload
      (renders as inert text, not markup).
