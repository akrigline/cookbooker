## Context

The QR code feature (`2026-08-01-recipe-qr-code-sharing`) was built as a modal triggered from the
recipe editor's toolbar. The encoding and decoder infrastructure is solid — lz-string compression,
URL-fragment delivery, a separate static `decoder/index.html` — but the entry point is wrong.

The feature's actual job: a cook **prints** a recipe, then someone wants to shop for it. The QR code
bridges that physical gap. It must be **on the printed page**, not reachable only through an
on-screen modal. The current model requires the user to open the modal, then print just that modal
(which hides the recipe body), which is backwards.

No backend, auth, or data model changes are involved. The `qrShare.js` encoding library, the
`decoder/index.html`, and the `DECODER_BASE_URL` constant remain unchanged.

## Goals / Non-Goals

**Goals:**
- QR code appears directly on the printed recipe page, alongside the ingredients it encodes
- QR code is also visible in screen preview (so users can verify it before printing)
- Remove the editor-toolbar modal; the QR experience is solely print-side
- Keep the component lean — no dialog, no backdrop, no overlay-specific print CSS
- Graceful degradation: if the ingredient list is too large, show a small text note instead of the QR

**Non-Goals:**
- Changing the encoding format, compression, or decoder page
- Providing an interactive truncation UI on the recipe page (too complex for print context)
- Adding QR codes to the cover page, table of contents, or chapter dividers
- Making QR opt-out per-recipe in this change (can be a future setting)
- Changing where the "Share via QR" concept is surfaced in the web UI (removed entirely for now)

## Decisions

### Decision 1: Inline component, not a modal

**Choice**: Replace `QRCodeShare.vue` (modal/overlay) with a new `RecipeQRCode.vue` component
designed for inline embedding inside any `RecipeLayout*.vue`.

**Rationale**:
- The modal model was serving the wrong use case. A modal triggers a print of just itself; the inline
  model prints as part of the full page.
- Inline also means the QR is visible in the on-screen preview, giving users confidence before they
  print.
- Simpler component: no `emit('close')`, no overlay, no print-mode CSS that fights the page layout.

**Alternatives Considered**:
- Keep the modal and add a "print page with QR" path: adds complexity without solving the core issue
  (QR must be physically on the page the user hands to someone).
- Add QR to the modal print and also inline: dual entry points with duplicated state; harder to
  maintain.

### Decision 2: QR widget placed in the bottom-right corner of the recipe page

**Choice**: Each `RecipeLayout*.vue` receives the inline `<RecipeQRCode>` component via the shared
`RecipeSheet.vue` wrapper, positioned as an absolute element in the bottom-right corner of the recipe
article at small size (~72–80 px canvas).

**Rationale**:
- Bottom-right is least likely to collide with layout-specific content in any of the 7 layout
  templates (which tend to be left-heavy).
- A single injection point in `RecipeSheet.vue` avoids duplicating placement logic across all 7
  layout files.
- Using SVG output (`QRCode.toString(url, { type: 'svg' })`) means the QR is resolution-independent
  and its `width`/`height` can be set directly in CSS inches (e.g., `1.25in × 1.25in`) with no
  pixel-density math required.

**Alternatives Considered**:
- Inject into each layout individually: allows per-layout fine-tuning but means 7 files to maintain.
- Below the ingredients column: more semantically obvious but layout-specific; not feasible from
  `RecipeSheet`.
- Fixed bottom-right of `PagePreview`: would bleed outside the recipe article boundary.

### Decision 3: No interactive truncation on print page; fallback to text notice

**Choice**: If `isPayloadOversized` returns true (> 1500 chars pre-compression) or the resulting QR
version exceeds 15, render a small italic note ("Ingredient list too long to encode as QR") instead
of the canvas.

**Rationale**:
- A number input for truncation makes sense in the interactive modal but is jarring on a printed page.
- Print context: the user cannot interact with it; a notice is the right graceful degradation.
- The existing `INGREDIENT_WARNING_LENGTH` threshold is reused unchanged.

**Alternatives Considered**:
- Auto-truncate silently to fit: loses data without user consent; violates the design principle from
  the original QR design.md Decision 5.
- Show nothing at all: the space is wasted and user doesn't know why.

### Decision 4: Remove the "Share via QR" button from RecipeEditor entirely

**Choice**: Delete the `showQRModal` state, the `<QRCodeShare>` import, and the toolbar button from
`RecipeEditor.vue`.

**Rationale**:
- With the QR on the printed page, there's no need for a separate screen trigger.
- Reduces cognitive surface: QR is now a "print benefit", not a feature to hunt for in the UI.
- Cleans up the editor toolbar (one fewer action).

**Alternatives Considered**:
- Keep the button as a preview: adds maintenance burden; the preview in `RecipePrint.vue` already
  shows the QR inline.

## Risks / Trade-offs

**[Risk] QR not crisp at printer resolution** → *Mitigation*: SVG output is resolution-independent;
the QR will be sharp at any DPI. Size is declared in CSS inches (1.25in × 1.25in), so no
pixel-density conversion is needed and the physical size is guaranteed on any printer.

**[Risk] Absolute positioning overlaps layout content on narrow or dense templates** → *Mitigation*:
Use `z-index` and a small white padding halo around the canvas to ensure legibility. Monitor across
all 7 layouts in QA.

**[Risk] Screen rendering of a tiny QR is not scannable** → *Mitigation*: The on-screen display is
for preview only ("does a QR appear?"); actual scanning is expected from the printed page. A tooltip
or small caption can explain this.

**[Risk] `QRCodeShare.vue` is removed; any future reference breaks** → *Mitigation*: Delete the file
entirely; the new `RecipeQRCode.vue` is the canonical component. Update any imports.

## Migration Plan

1. Create `src/components/RecipeQRCode.vue` — inline, no dialog scaffolding.
2. Inject `<RecipeQRCode :recipe="recipe" />` into `RecipeSheet.vue` as an absolutely-positioned
   overlay within the article.
3. Remove `QRCodeShare.vue`, the toolbar button, and `showQRModal` from `RecipeEditor.vue`.
4. Update tests: remove QRCodeShare modal tests; add RecipeQRCode inline rendering tests.
5. Update delta specs for `recipe-qr-sharing` and `print-and-export`.

## Open Questions

1. Should we add a per-project or per-recipe toggle to hide the QR from the printed page? (Probably
   yes in a future change; out of scope here.)
2. Should the QR caption/label text be "Scan for shopping list" or something else?
