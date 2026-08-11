## Context

`src/css/print.css` currently sets a single uniform `@page { margin: 0.5in }`, and `src/components/PagePreview.vue` pads every page 0.5in on all sides with the page number fixed in the top-right corner. `src/js/compileBook.js`'s `assignPageNumbers` numbers pages sequentially starting at 1 on the first chapter divider, with the Title Page and Table of Contents unnumbered front matter. Page numbers are deliberately rendered as normal JS-computed HTML elements, not CSS Paged Media margin-box content (`@bottom-right { content: counter(page) }`) — Chrome's support for margin-box *content* and `counter-reset` on the UA page counter proved unreliable in this project's original design and was replaced (see `print.css`'s header comment).

This change adds a per-project double-sided printing toggle requiring a gutter margin, recto-forced chapter/TOC starts, and mirrored page numbers. Full design rationale and exploration live in `brainstorming/superpowers/specs/2026-08-10-double-sided-printing-design.md`; this document summarizes the decisions relevant to implementation.

## Goals / Non-Goals

**Goals:**
- Gutter margin (0.75in) vs. outer margin (0.5in) on interior pages, swapping sides by physical page parity, only when the project's `doubleSidedEnabled` toggle is on.
- Table of Contents and every chapter start on a recto (right-hand) page, via blank-page insertion.
- Title Page stays single-sided (symmetric margin) always; a blank page always separates it from the TOC.
- Page numbers mirror to the outer top corner.
- Fix a latent bug found during design: `@page`'s print margin and `PagePreview.vue`'s own padding currently stack at real print time.

**Non-Goals:**
- `RecipePrint.vue` (single-recipe export) — no binding concept, untouched.
- Configurable gutter width — fixed at 0.75in, matching the project's existing no-config-knobs style for margins.
- A separate print flow for the Cover vs. the interior — stays one continuous `window.print()` document.

## Decisions

**Decision: Use `@page :left`/`:right`/`:first` margin overrides, not margin-box content.** These pseudo-classes are spec'd to affect only `margin`/`padding`/`border`/`background` on the page box — never content — and Chromium has reliably supported that scoped subset for years (the same primitive the existing `@page { margin: 0.5in }` already uses). This is a different, narrower feature than the `counter(page)` margin-box content that was previously found unreliable; caniuse's own callout is that Chrome supports page size/margin but not margin-box content specifically. Verified via research before committing to this approach given the project's prior history here.

**Decision: `@page` rules are injected via an imperatively-managed `<style>` element in `document.head`, not a static class-scoped block in `print.css` or a template-level tag.** `@page` is a top-level at-rule and cannot be nested inside a class selector, ruling out a static addition to `print.css`. A `<style>` tag written directly in an SFC's `<template>` was also tried and rejected by Vue's compiler at dev-server runtime ("Tags with side effect (`<script>` and `<style>`) are ignored in client component templates") — verified empirically, not assumed. The working mechanism: `ProjectPrint.vue` `watch`es `doubleSided` and creates/removes a plain `document.createElement('style')` element appended to `document.head`, containing the `:left`/`:right`/`:first` overrides, cleaned up `onBeforeUnmount`. When off, `print.css`'s existing plain `@page { margin: 0.5in }` is the only rule in effect — unchanged from today.

**Decision: Screen-preview mirroring and page-number position use `:nth-of-type` CSS, not a JS-computed parity prop.** `ProjectPrint.vue` already renders one `.page-preview` DOM sibling per physical page (including inserted blanks) in a flat, unbroken sequence — DOM order is physical page order, so `nth-of-type(odd)`/`nth-of-type(even)` parity is exactly page parity. `:not(:first-of-type)` excludes the Title Page (always position 1) from the gutter ruleset, keeping it on the component's default symmetric padding. This avoids threading a new prop through `PagePreview.vue` entirely.

**Decision: JS in `compileBook.js` is only responsible for blank-page placement and number-slot bookkeeping**, not margins or visual position. A new layout function walks the chapter plan once, applying one uniform rule to both the TOC entry (when page numbers are enabled) and every chapter divider: if placing it next would land on an even (verso) physical page, insert a blank entry first. Because the Title Page is always exactly one page, this rule always fires for the TOC when double-sided is on (page 2 is always even) — no special-casing needed between "blank before TOC" and "blank before chapter N," it's the same rule applied uniformly, and the TOC case happens to trigger unconditionally as a natural consequence.

**Decision: numbering keeps its current front-matter-unnumbered, body-starts-at-1 semantics, extended to make blank entries consume a silent number slot.** A blank entry advances the running page-number counter (keeping numbers in sync with true physical position for anyone actually duplex-printing) but is never displayed (`PagePreview`'s `pageNumber` prop receives `null` for blank entries, same as any front-matter page).

**Decision: fix the `@page`/component-padding stacking bug as part of this change, not separately.** Today `.page-preview__margin`'s 0.5in padding is never zeroed under `@media print`, so it stacks with `@page`'s own 0.5in margin at real print time. This change makes `@page` the sole source of the *real* print margin; `.page-preview__margin`'s padding is zeroed under `@media print` (kept only for the on-screen mockup, matching how the page's dashed outline is already print-only). This is bundled here because the same code path is being touched anyway, and shipping the gutter feature on top of an unfixed doubled-margin baseline would make the bug harder to isolate later.

**Decision: fit measurement (`recipeFitMeasure.js`) stays unchanged, global, at today's 1in total horizontal margin.** `fitsOnPage` is a single field on the recipe record, not on the per-project `project_recipes` association, and a recipe can belong to multiple projects (library/shared-recipe model) that may disagree on the double-sided setting. There is no single correct project-scoped margin to measure against without a larger schema change (moving `fitsOnPage` onto `project_recipes`), which is out of scope here. Accepted as a known imprecision: a recipe that just barely fits at 1in but not at double-sided's 1.25in total margin won't be flagged. This was raised and confirmed during implementation, not assumed.

## Risks / Trade-offs

- **[Risk]** Real duplex output requires the user to select "Two-sided" in the OS print dialog; the CSS can't force that setting, so a user could print double-sided-styled pages on a single-sided printer and get single-sided sheets with lopsided gutters. → **Mitigation**: none in this change (documentation-only concern); flagged here so it isn't mistaken for a bug later.
- **[Risk]** Some recipes that fit today at 1in total horizontal margin may newly warn as not-fitting once a project turns double-sided on. → **Mitigation**: this is an accurate, expected consequence of genuinely less usable width, not a measurement bug — no mitigation needed beyond the warning already surfacing correctly.
- **[Trade-off]** The `@page`/padding stacking fix changes real print output for every existing project (not just double-sided ones), shrinking today's likely-doubled ~1in real margin back to the intended 0.5in. → **Mitigation**: this is a correctness fix, not a new behavior; call it out explicitly in the changelog/PR description so it isn't a surprise.

## Migration Plan

No data migration — `doubleSidedEnabled` is a new non-indexed boolean field on the `projects` table (same pattern as `pageNumbersEnabled`), defaulting to `false`/undefined for existing rows, requiring no Dexie version bump. No rollback concerns beyond reverting the change; nothing is destructive.

## Open Questions

None outstanding — all resolved during brainstorming (see the linked design doc for the full Q&A trail on cover handling, TOC recto-forcing, and blank-page numbering semantics).
