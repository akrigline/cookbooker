## 1. Data model & settings UI

- [ ] 1.1 Add `doubleSidedEnabled: false` default to `db.js`'s `on('populate')` seed and wherever new projects are created (mirror `pageNumbersEnabled`'s pattern exactly).
- [ ] 1.2 Add a "Double-sided printing" checkbox to `EditCookbookModal.vue` next to the existing "Page numbers & Table of Contents" checkbox, using the same `update-field` emit pattern.
- [ ] 1.3 Wire the new field through wherever `ProjectView.vue` reads/passes `pageNumbersEnabled` today, so `doubleSidedEnabled` reaches `ProjectPrint.vue`.

## 2. Page layout logic (`compileBook.js`)

- [ ] 2.1 Write a new layout function that walks `buildChapterPlan`'s output and produces an ordered list of page descriptors (`toc` | `blank` | `divider` | `recipe`), applying one uniform recto-forcing rule to the TOC entry (when page numbers are enabled) and every chapter divider.
- [ ] 2.2 Always insert a `blank` entry immediately after the Title Page before the TOC/first-chapter entry (unconditional, per the design's "Title Page is always exactly one page" reasoning — confirm it still holds as one rule, not two).
- [ ] 2.3 Compute printed page numbers from this list: front matter unnumbered, numbering starts at 1 on the first numbered body page, blank entries silently consume a number slot (`printedNumber` advances) but are never displayed.
- [ ] 2.4 Derive `dividerPages`/`recipePages` lookup maps from the same list so `TableOfContentsPage.vue` needs no interface change.
- [ ] 2.5 Confirm the function's blank-insertion branch is never taken when `doubleSidedEnabled` is false, producing output identical to today's `assignPageNumbers` in that case.
- [ ] 2.6 Add `compileBook.test.js` cases: blank-page placement for chapters landing on verso vs. recto, the unconditional Title-Page→TOC blank, printed-number sync across blanks, and the double-sided-off passthrough case.

## 3. Print margin CSS

- [ ] 3.1 Update `print.css`'s header comment to describe the new margin-ownership split (`@page` owns real print margin; `PagePreview.vue`'s padding becomes screen-preview-only).
- [ ] 3.2 Zero `.page-preview__margin`'s padding under `@media print` in `PagePreview.vue` (fixes the stacking bug called out in the design).
- [ ] 3.3 Add a template-level (not SFC-compiled) `<style v-if="doubleSidedEnabled">` element in `ProjectPrint.vue` containing the `@page :right`/`:left`/`:first` gutter/outer/Title-Page-symmetric margin overrides.
- [ ] 3.4 Add `nth-of-type`-based screen CSS (scoped to a class toggled on `ProjectPrint.vue`'s root) mirroring the gutter side and page-number corner by parity, excluding the Title Page via `:not(:first-of-type)`.

## 4. `ProjectPrint.vue` rendering

- [ ] 4.1 Replace the current hand-assembled divider/recipe `v-for` with iteration over the new layout list from step 2.1.
- [ ] 4.2 Render a `<PagePreview>` with no slot content and no page number for each `blank` entry.
- [ ] 4.3 Toggle the double-sided screen-preview class and the conditional gutter `<style>` element based on `project.doubleSidedEnabled`.

## 5. Fit measurement

- [ ] 5.1 Update `recipeFitMeasure.js` to use 1.25in total horizontal margin when the recipe's project has `doubleSidedEnabled`, 1in otherwise.
- [ ] 5.2 Verify `triggerFitMeasurement()`'s call sites already have access to the project's `doubleSidedEnabled` flag at measurement time; thread it through if not.

## 6. Verification

- [ ] 6.1 Run `npm test` and `npm run build`; both must stay green.
- [ ] 6.2 Manual print-preview check: a project with double-sided ON shows the gutter swapping sides, mirrored page numbers, the forced blank after the Title Page, and correct recto starts for TOC and chapters.
- [ ] 6.3 Manual print-preview check: a project with double-sided OFF is pixel-identical in behavior to before this change (no blanks, symmetric margins, top-right numbers) — including confirming the print-margin stacking fix didn't visibly regress single-sided output beyond correcting the margin size.
