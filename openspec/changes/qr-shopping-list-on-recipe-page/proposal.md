## Why

The QR code feature was built around a "share to a decoder website" model, but the real use case is
much simpler: a person prints their cookbook, hands it to someone, and that person wants to copy the
ingredient list to a shopping-list app. The QR code should live on the printed recipe page itself —
not behind a modal in the editor — so it's physically present whenever the page is in someone's hand.

## What Changes

- **Remove the "Share via QR" modal** from `RecipeEditor.vue`; the QR code is no longer triggered
  interactively from the editor toolbar.
- **Embed a compact QR code widget directly on each printed recipe page**, positioned in an available
  corner of the recipe layout (bottom-right of the ingredients column). The widget is screen-visible
  in preview but clearly labelled as a "scan for shopping list" affordance.
- **Remove the `emit('close')` / overlay interaction model** from `QRCodeShare.vue`; replace or
  refactor into a `RecipeQRCode.vue` component designed for inline layout embedding (no dialog, no
  backdrop, no print-specific CSS tricks).
- **No change to `qrShare.js`** encoding logic — the URL-fragment payload, lz-string compression, and
  the decoder page remain untouched.
- **No change to the decoder** at `decoder/index.html`.
- Update the `recipe-qr-sharing` spec to reflect the new placement and remove the modal-interaction
  requirements that no longer apply.
- Update the `print-and-export` spec to note that recipe pages may carry an inline QR widget.

## Capabilities

### New Capabilities
- (none — this is a reorientation of an existing capability, not a new one)

### Modified Capabilities
- `recipe-qr-sharing`: Placement changes from an interactive modal in the editor to an inline widget
  embedded in the printed recipe page; modal/overlay interaction requirements are removed; size and
  styling requirements are updated for inline print use.
- `print-and-export`: Recipe pages now optionally include an inline QR widget; the spec must document
  this as part of the single-page recipe layout.

## Impact

- `src/components/QRCodeShare.vue` — refactored or replaced with a lean inline component
  (`RecipeQRCode.vue` or similar); overlay/dialog scaffolding removed
- `src/views/RecipeEditor.vue` — "Share via QR" button removed; modal wiring removed
- `src/components/RecipeSheet.vue` (and/or the individual `RecipeLayout*.vue` files) — QR widget
  injected into the layout; needs to be graceful when ingredients are empty or oversized
- `openspec/specs/recipe-qr-sharing/spec.md` — updated (delta spec)
- `openspec/specs/print-and-export/spec.md` — updated (delta spec)
- No new npm dependencies; `qrcode` and `lz-string` are already in the bundle
