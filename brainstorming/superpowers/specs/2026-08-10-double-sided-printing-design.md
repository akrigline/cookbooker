# Double-sided printing — design

Status: approved (pending user review of this doc)
Date: 2026-08-10

## Summary

Add a per-project "Double-sided printing" toggle to cookbook export/print
(`ProjectPrint.vue` only — `RecipePrint.vue`'s single-recipe export has no
binding concept and is untouched). When on:

- Interior pages (everything after the Cover) get an asymmetric margin: a
  wider **gutter** (binding edge, 0.75in) and a narrower **outer** margin
  (0.5in), swapping sides by page parity — gutter on the left for
  right-hand/recto pages, gutter on the right for left-hand/verso pages.
- The Table of Contents and every chapter start on a recto (right-hand)
  page, inserting a blank verso page before them when they'd otherwise land
  on an even page.
- Page numbers mirror to the outer top corner (top-right on recto, top-left
  on verso) instead of always top-right.
- The Cover stays single-sided (symmetric margin, no gutter) regardless of
  the toggle, and a blank page is always inserted between Cover and TOC.

When the toggle is off, everything behaves exactly as it does today: no
blank pages, no gutter, symmetric 0.5in margins throughout, page numbers
always top-right, `@page` stays a plain uniform-margin rule.

## Why not CSS Paged Media margin-box content (again)?

The project already ruled out `@bottom-right { content: counter(page) }`
for page numbers — Chrome's support for margin-box *content* and
`counter-reset` on the UA page counter proved unreliable (see
`src/css/print.css`'s header comment). This design does **not** repeat
that mistake, but it *does* use a different, narrower feature from the
same spec family: `@page :left`/`@page :right`/`@page :first` overriding
plain `margin` (no counters, no margin-box content). Per the CSS Paged
Media spec, `:left`/`:right`/`:first` may only affect a page box's
`margin`/`padding`/`border`/`background` — never content — and Chromium
has reliably supported exactly that scoped subset for years (it's the
same primitive `@page { margin: 0.5in }` already uses successfully today).
Caniuse's explicit callout is "Chrome supports page size... but not margin
boxes" — margin-box content is the unsupported part, not plain margin
overrides. This is safe to build on.

The one real caveat: `@page` margins are honored by Chrome regardless, but
actual duplex (two-sided) output requires the user to select
"Two-sided"/duplex in the OS print dialog — the CSS can't force that
setting. This is a documentation/UX note, not a support risk.

## Architecture

**Print margins → pure CSS, conditionally rendered.** `@page` is a
top-level at-rule — it cannot be nested inside a class selector, so
scoping it to double-sided projects can't be done by adding a class in
`src/css/print.css`'s static, always-loaded stylesheet. Instead,
`ProjectPrint.vue` renders a plain `<style>` element directly in its
template (not the SFC's compiled `<style>` block, which is static) with
`v-if="project.doubleSidedEnabled"`, containing:

```css
@page :right { margin-left: 0.75in; margin-right: 0.5in; }
@page :left  { margin-left: 0.5in;  margin-right: 0.75in; }
@page :first { margin: 0.5in; } /* Cover: pinned symmetric, overrides :right */
```

Vue treats a `<style>` tag written in `<template>` as an ordinary DOM
element (only the SFC's dedicated `<style>` block gets special
build-time handling), so this mounts/unmounts a real stylesheet in the
document exactly when the toggle is on, taking effect for both print
preview and `window.print()`. When the toggle is off, this element isn't
rendered at all, so `print.css`'s existing plain `@page { margin: 0.5in }`
rule is the only one in effect — unchanged from today.

**Screen preview mirror + page-number position → CSS `:nth-of-type`**, on
the flat sequence of `.page-preview` siblings `ProjectPrint.vue` already
renders (one per physical page, including blanks). DOM order *is*
physical page order, so `nth-of-type` parity is exactly page parity — no
prop threading needed for margin/position styling:

```css
.print-project--double-sided .page-preview:not(:first-of-type):nth-of-type(odd) {
  /* recto: gutter left, outer right, page-number top-right */
}
.print-project--double-sided .page-preview:nth-of-type(even) {
  /* verso: gutter right, outer left, page-number top-left */
}
```

The `:not(:first-of-type)` exclusion keeps the Cover (always position 1,
always odd) out of the gutter ruleset — it stays on the component's
existing default symmetric padding.

This also fixes a latent bug found while investigating: today
`.page-preview__margin`'s 0.5in padding stacks with `@page`'s own 0.5in
margin at actual print time (nothing zeroes the component's padding under
`@media print`), likely producing ~1in real margins against a 0.5in
on-screen preview. Fix bundled with this work: `@page` becomes the sole
source of the *real* print margin; `.page-preview__margin`'s padding is
zeroed under `@media print` (kept only for the screen mockup, matching how
its dashed outline is already print-only).

**JS is only needed for**: deciding where to insert blank pages, and
computing the printed page-number sequence (blank-aware). Both already
live in `src/js/compileBook.js`.

## Data model

New `doubleSidedEnabled: false` boolean field on `projects`, same
non-indexed-field pattern as `pageNumbersEnabled` (default in `db.js`'s
`on('populate')` seed and in whatever creates new projects; no Dexie
version bump needed — existing rows simply read `undefined`/falsy until
edited). Checkbox added to `EditCookbookModal.vue` next to the existing
"Page numbers & Table of Contents" checkbox, labeled "Double-sided
printing", following the identical `update-field` emit pattern.

The toggle works independently of `pageNumbersEnabled`. If page numbers
(and therefore the TOC) are off, the "blank before TOC" step is simply
skipped (there is no TOC page to force recto) and the first chapter
divider becomes the first thing needing recto-forcing after the Cover.

## Page layout / numbering (`compileBook.js`)

`buildChapterPlan` is unchanged. A new function (name TBD, e.g.
`layoutPages`) walks the chapter plan once and produces an ordered list of
page descriptors — `{ type: 'toc' | 'blank' | 'divider' | 'recipe',
chapterId?, recipeId?, printedNumber: number | null }` — plus the existing
`dividerPages`/`recipePages` lookup maps (derived from the same list) so
`TableOfContentsPage.vue` needs no interface change.

Physical page counting starts at 1 for the Cover (rendered separately,
outside this list) and continues through every entry the function
produces. A single shared rule applies uniformly to the TOC entry (when
`pageNumbersEnabled`) and every chapter divider: if inserting it next
would land on an even (verso) physical page, insert a `blank` entry first.
Because the Cover is always exactly one page, this rule always fires for
the TOC when double-sided is on (page 2 is always even) — so no special
casing is needed for "blank before TOC" vs. "blank before chapter N"; it's
the same rule, and the TOC case happens to trigger unconditionally as a
consequence of the Cover always being a single page.

**Numbering**: unchanged in kind — starts at 1 on the first *numbered*
body page, front matter (Cover, TOC) stays unnumbered. Per the earlier
decision, a `blank` entry still consumes a number slot silently (keeps
`printedNumber` in sync with physical position for anyone actually
duplex-printing) but is never displayed (`PagePreview`'s `pageNumber` prop
gets `null` for blank entries, same as it already does for
number-disabled projects).

When `doubleSidedEnabled` is false, this function's blank-insertion branch
is simply never taken — output is identical to today's `assignPageNumbers`
in every case that doesn't involve a blank.

## Component changes

- `ProjectPrint.vue`: renders one extra `<PagePreview>` per `blank` list
  entry (no slot content, no page number), toggles the
  `print-project--double-sided` class on its root based on
  `project.doubleSidedEnabled`, and iterates the new layout list instead
  of hand-assembling divider/recipe pairs from `chapterPlan` directly.
- `PagePreview.vue`: no new props. Its existing `.page-preview__margin`
  padding and `.page-preview__page-number` position become
  parent-selector-driven (via the `nth-of-type` rules above) rather than
  hardcoded, and gain the `@media print { padding: 0 }` fix.
- `print.css`: gains the `@page :left`/`:right`/`:first` block, scoped to
  the double-sided class.
- `EditCookbookModal.vue` / `db.js`: new field + checkbox as described
  above.

## Fit measurement (`recipeFitMeasure.js`)

Gutter (0.75in) + outer (0.5in) sum to the same 1.25in total horizontal
margin on every interior page regardless of which side is which — so this
needs no worst-case guessing, just a different *total* horizontal margin
constant: 1.25in when the project has double-sided enabled, 1in (today's
0.5+0.5) otherwise. Vertical margins are untouched. This does mean some
recipes that fit today at 1in total horizontal margin may newly warn as
not-fitting once a project turns double-sided on — an expected,
real consequence of less usable width, not a bug.

## Out of scope

- `RecipePrint.vue` (single-recipe export/share) — no binding/duplex
  concept, untouched.
- A configurable gutter width — fixed at 0.75in for now, matching the
  project's existing no-config-knobs style for margins.
- Any second export flow for printing the Cover separately from the
  interior — the single continuous `window.print()` flow stays as the
  only print path; the Cover's "single-sided" treatment is achieved via
  `@page :first`/`:not(:first-of-type)`, not a separate document.

## Testing

The new `compileBook.js` layout function is pure data logic — testable in
`compileBook.test.js` with plain fixtures (chapter/recipe counts →
expected page sequence, blank placement, printed numbers), no component
mounting required (matches the project's existing constraint that no
`.vue` file can be mounted in tests). The CSS/print-margin side isn't
unit-testable the same way; verification is a manual print-preview check
with the toggle on, matching how other print-layout work in this project
has been verified.
