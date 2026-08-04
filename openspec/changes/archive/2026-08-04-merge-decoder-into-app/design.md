## Context

The QR decoder (`decoder/index.html`) was originally built as a standalone, dependency-free static
site so it could be deployed independently of the main app (see the archived
`recipe-qr-code-sharing` change's design.md, Decision 3). That domain was never actually chosen or
deployed — `DECODER_BASE_URL` in `src/js/qrShare.js` still points at a placeholder
(`https://recipe-decode.cookbooker.app/`), and design.md's Open Question 1 ("which decoder domain")
was left open.

The user now plans to deploy the app to GitHub Pages, which serves one site per deployment. Keeping
the decoder as a second, separately-deployed static site is no longer workable, and Decision 3's
original rationale (smaller main-app bundle, independent deploy lifecycle, separation of concerns)
was a preference, not a hard constraint — the decoder can become a normal route without violating any
requirement in `recipe-qr-sharing`'s spec beyond the ones this change explicitly modifies.

## Goals / Non-Goals

**Goals:**
- Fold the decoder's functionality into the SPA as a route indistinguishable in structure/styling
  from any other route (`/library`, `/settings`, etc.) — same chrome, same page-shell CSS classes.
- Preserve the decoder's existing behavior: empty/error/result states, title + ingredient rendering,
  copy-to-clipboard with the same fallback messaging.
- Preserve the existing XSS-safety guarantee (decompressed, untrusted payload text is never
  interpreted as HTML) using Vue's default template escaping in place of manual `textContent` calls.
- Remove the now-unnecessary standalone `decoder/` site and its placeholder domain entirely.

**Non-Goals:**
- Configuring the actual GitHub Pages deployment (vite `base` path, GH Actions workflow, custom
  domain/CNAME). Separate follow-up work.
- Changing the QR payload format, compression scheme, or encoding limits (Decisions 1, 2, 4, 5 of the
  original design are untouched).
- Adding new decoder features (e.g. "save to my recipes" from a scanned code) — out of scope for this
  change.

## Decisions

### Decision 1: `/decode` route lives inside the normal app chrome, not a bare page
**Choice**: `DecodeRecipe.vue` is a regular route rendered inside `App.vue`, with the same
header/nav as every other view.

**Rationale**: Direct user instruction — "this decoder should be no different than the other routes
in the webapp." Also simpler: no second layout branch to maintain in `App.vue`.

**Alternatives considered**: A bare/chromeless layout for `/decode` (on the theory that someone
opening a scanned link has no data in this app and the nav might be confusing) — rejected per user
direction; not worth a special case for one route.

### Decision 2: QR links are built from `window.location.origin`, not a stored base-URL constant
**Choice**: `generateQRURL` computes `${window.location.origin}${DECODE_ROUTE_PATH}#${compressed}`
at generation time. `DECODER_BASE_URL` is deleted; no replacement placeholder constant is introduced.

**Rationale**: There's no longer a separate domain to point at — the decoder is wherever the app
itself is deployed. Deriving it at generation time also removes a manual step (updating a hardcoded
domain once GitHub Pages hosting is finalized) that was never completed for the old constant either.

**Trade-off accepted**: A QR code generated while running `npm run dev` or a preview build encodes
that origin (e.g. `http://localhost:5173`) rather than production. This only matters if someone
actually prints/shares a QR code generated from a non-production build — acceptable given this was
an explicit, discussed trade-off, and the previous placeholder-domain approach was equally broken in
practice (it pointed at a domain that was never deployed).

**Alternatives considered**: Keep a stored `APP_BASE_URL` constant the developer updates once after
choosing a production domain — rejected; adds a manual step with no automated enforcement, matching
the exact failure mode (`DECODER_BASE_URL` never being updated) this change is cleaning up.

### Decision 3: Single source of truth for the route path
**Choice**: `DECODE_ROUTE_PATH = '/decode'` is exported from `src/js/qrShare.js` and imported by
`src/router/index.js`, rather than the string `'/decode'` being written in both places.

**Rationale**: `qrShare.js` (URL generation) and the router (URL resolution via the actual route)
must never disagree about the path. A single exported constant makes that structurally impossible
instead of relying on two files staying in sync by convention.

**Alternatives considered**: Define the constant in the router and import it into `qrShare.js` —
equally valid; `qrShare.js` was chosen since it's already the module that owns QR-URL-generation
concerns and has no dependency on `vue-router`.

### Decision 4: Rendering safety moves from "never use innerHTML" to "Vue template escaping"
**Choice**: `DecodeRecipe.vue` renders the title and each ingredient via `{{ title }}` / `{{ line }}`
interpolation. No `v-html` is used anywhere in the component.

**Rationale**: Vue's `{{ }}` interpolation HTML-escapes its value by default — functionally
equivalent to the old page's `textContent` assignments, for the same reason (a malicious payload
like `<script>...</script>` is displayed as inert text, never parsed as markup). This is enforced by
the framework rather than by a manual coding discipline of "always use `textContent`, never
`innerHTML`."

**Alternatives considered**: Keep manually calling `.textContent =` inside the component via template
refs — rejected; fights the framework for no benefit, and would look inconsistent with the rest of
the codebase's Vue usage.

## Risks / Trade-offs

**[Risk] `DecodeRecipe.vue` can't be unit-tested directly** (repo has no `@vue/test-utils`; see
CLAUDE.md) → *Mitigation*: no new logic is introduced in the component beyond state derivation from
already-tested `qrShare.js` functions (`decompressPayload`, `parseRecipePayload`). All meaningful
logic paths (empty/error/result, malformed payload, malicious payload round-tripping as inert text)
stay covered at the `qrShare.test.js` level, matching this repo's existing pattern for other views.

**[Risk] Losing the old `decoder.test.js`'s source-scan regression guards** (e.g. asserting no
`.innerHTML =` appears in the file) → *Mitigation*: that entire class of mistake (a stray
`innerHTML` assignment) isn't representable the same way once rendering goes through Vue's compiler;
a source-text regex scan of a `.vue` SFC isn't a meaningful equivalent. Relying on "no `v-html` in
the component" as a code-review-time property is consistent with how the rest of the codebase treats
this concern (no automated `v-html` lint exists elsewhere either).

**[Risk] Dev/preview-origin QR codes** → see Decision 2's accepted trade-off above.

## Migration Plan

1. Add `DECODE_ROUTE_PATH` export and rewrite `generateQRURL` in `src/js/qrShare.js`; remove
   `DECODER_BASE_URL`.
2. Add `src/views/DecodeRecipe.vue` and register the `/decode` route in `src/router/index.js`.
3. Update `src/js/qrShare.test.js` for the new `generateQRURL` behavior.
4. Delete `decoder/index.html`, `decoder/README.md`, `decoder/decoder.test.js`.
5. Run `npm test` and `npm run build` to confirm both stay green (per CLAUDE.md's requirement).

No rollback complexity: this is a pure code change with no data migration or deployed-state
dependency — reverting the commit fully reverses it.

## Open Questions

None outstanding. (The original design.md's Open Question 1 — "which decoder domain" — is resolved
by this change: there is no longer a separate decoder domain.)
