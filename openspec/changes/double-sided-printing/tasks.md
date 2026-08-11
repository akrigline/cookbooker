## 1. Data model & settings UI

- [x] 1.1 Add `doubleSidedEnabled: false` default to `db.js`'s `on('populate')` seed and wherever new projects are created (mirror `pageNumbersEnabled`'s pattern exactly).
- [x] 1.2 Add a "Double-sided printing" checkbox to `EditCookbookModal.vue` next to the existing "Page numbers & Table of Contents" checkbox, using the same `update-field` emit pattern.
- [x] 1.3 Wire the new field through wherever `ProjectView.vue` reads/passes `pageNumbersEnabled` today, so `doubleSidedEnabled` reaches `ProjectPrint.vue`. `ProjectPrint.vue` reads `project.value.doubleSidedEnabled` directly from the store — no extra wiring needed there.

## 2. Page layout logic (`compileBook.js`)

- [x] 2.1 Write a new layout function (`layoutBookPages`) that walks `buildChapterPlan`'s output and produces an ordered list of page descriptors (`toc` | `blank` | `divider` | `recipe`), applying one uniform recto-forcing rule to the TOC entry (when page numbers are enabled) and every chapter divider.
- [x] 2.2 Confirmed: no separate unconditional-blank mechanism is needed. The Title Page is always exactly one physical page, so the next candidate page is always page 2 (even) - the same `forceRecto` rule that handles chapters also fires for the TOC (or the first chapter, when the TOC is off) as a natural consequence, with zero special-casing.
- [x] 2.3 Printed page numbers computed inline in the same pass: front matter unnumbered, numbering starts at 1 on the first divider, blank entries advance the counter but always render `printedNumber: null`.
- [x] 2.4 `dividerPages`/`recipePages` maps derived in the same pass; `TableOfContentsPage.vue` required no changes.
- [x] 2.5 Confirmed via test ("never inserts a blank page when double-sided is off, regardless of chapter/recipe counts") and by code inspection - `forceRecto` is gated on `doubleSided &&`, so the branch is structurally unreachable when off.
- [x] 2.6 Added to `compileBook.test.js`: single-sided passthrough (numbers, no blanks, empty plan), TOC-without-blanks when single-sided, blank-before-TOC + blank-before-chapter with the number-slot gap when double-sided, recto-forcing with no TOC, and the double-sided-off invariant across an odd/even mix of chapters.

## 3. Print margin CSS

- [x] 3.1 Updated `print.css`'s header comment to describe the new margin-ownership split (`@page` owns real print margin; `PagePreview.vue`'s padding becomes screen-preview-only) and the `:left`/`:right`/`:first` gutter mechanism.
- [x] 3.2 Zeroed `.page-preview__margin`'s padding under `@media print` in `PagePreview.vue`.
- [x] 3.3 Added the conditional `<style v-if="doubleSided">` element in `ProjectPrint.vue`'s template containing the `@page :right`/`:left`/`:first` overrides.
- [x] 3.4 Added `nth-of-type`-based screen CSS in `ProjectPrint.vue`, scoped under `.print-project--double-sided` and reaching into `PagePreview.vue`'s scoped elements via `:deep()`, mirroring gutter padding and page-number corner by parity, excluding the Title Page via `:not(:first-of-type)`.

## 4. `ProjectPrint.vue` rendering

- [x] 4.1 Replaced the hand-assembled divider/recipe `v-for` with iteration over `bookLayout.pages`.
- [x] 4.2 Blank entries render a bare `<PagePreview />` with no slot content and no `page-number` prop.
- [x] 4.3 `.print-project--double-sided` class and the conditional gutter `<style>` element are both toggled off the same `doubleSided` computed.

## 5. Fit measurement

- [x] 5.1 N/A — dropped during implementation. `fitsOnPage` is a single field on the recipe record, not the per-project `project_recipes` association, and a recipe can belong to multiple projects with different double-sided settings (library/shared-recipe model). `recipeFitMeasure.js` stays unchanged at today's global 1in margin; confirmed with user rather than guessed. See design.md's fit-measurement decision.

## 6. Verification

- [x] 6.1 `npm test` (179/179 passed) and `npm run build` both green.
- [x] 6.2 Manual print-preview check (dev server + chrome-devtools-axi) with double-sided ON: confirmed 6 physical pages (Title, blank, TOC, blank, divider, recipe) via DOM inspection and screenshots, gutter padding swapping 0.75in/0.5in by parity, Title Page staying symmetric, page numbers mirroring top-right (recto) / top-left (verso), and the `@page :right`/`:left`/`:first` style element present in `document.head`. This caught two real bugs not caught by the design/unit tests, both fixed:
  - A `<style>` tag written directly in `<template>` is rejected by Vue's compiler at dev-server runtime ("tags with side effect are ignored") - the design's assumption was wrong. Fixed by imperatively managing a `document.createElement('style')` element via a `watch`, appended to `document.head` (see design.md's corrected decision).
  - `nth-of-type` counts by tag name among *all* siblings, not just elements matching the rest of the selector - `PrintToolbar`'s own root `<div>` was a sibling of the `.page-preview` divs and shifted every page's parity by one, inverting the gutter/page-number mirroring. Fixed by wrapping the page sequence in a dedicated `.print-project__pages` container so `nth-of-type` counts cleanly.
- [x] 6.3 Manual print-preview check with double-sided OFF: 4 pages (no blanks), no `.print-project--double-sided` class, no gutter `<style>` element injected, all margins uniformly 48px (0.5in) - matches pre-change behavior exactly.
