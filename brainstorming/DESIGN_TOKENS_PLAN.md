> **Status: done (2026-08-16).** Task 1 landed earlier; Tasks 2-6 were completed (and the tokens
> renamed `--gray-*` → `--ink-*`) alongside authoring the root `DESIGN.md`. Kept here for the
> historical record and rationale, not as an open checklist — see `DESIGN.md` for the current
> palette and `brainstorming/design-system-inconsistencies.md` for the (unrelated) component-level
> inconsistencies that survived this pass.

# Plan: consolidate inline `oklch()` colors into design tokens

Follow-on to the color audit (see conversation / commit history around
2026-08-02). Scope is the **chrome/UI palette only** — text, backgrounds,
borders, focus states, danger/success feedback. It explicitly does **not**
cover the per-project `accentColor` (the terracotta/forest-green/etc. swatch
picker in `EditCookbookModal.vue`), which is legitimately dynamic, already
flows through CSS custom properties (`--cover-accent`, `--recipe-accent`,
`--toc-accent`, `--divider-accent`), and is fixed separately (mismatched
palette between `Dashboard.vue` and `templates.js`).

## Current state

444 inline `oklch()` literals across 19 files, 115 distinct values, against a
`tokens.css` that defines 5 neutral colors as hex and nothing else. Grouped by
hue/chroma:

| Family | Occurrences | Notes |
|---|---|---|
| Neutral warm-gray (hue ~75, chroma ≤0.02) | 310 | **36 distinct lightness stops** in ad hoc use (99.5% → 18%) — organic growth, not a designed scale |
| Focus/interactive blue (hue 240–270) | 60 | `oklch(52% 0.16 250)` alone is 43 of these — the single most-repeated literal in the app (every `:focus-visible`, checkbox `accent-color`, drag-over border) |
| Danger/red (hue 15–45, chroma ≥0.06) | 40 | Consistently `oklch(45% 0.14 25)` for delete buttons/error text, paired with `oklch(96% 0.03 25)` bg + `oklch(85% 0.06 25)` border on banners |
| Success/green (hue 130–150) | 5 | `oklch(35% 0.05 140)` text + `oklch(96% 0.05 140)` bg, import-success banner only |
| Brand accent orange | ~17 | `--accent-color` token exists but is `var()`-referenced in exactly one file (`Sidebar.vue`); every redesigned view hardcodes its own approximation |
| Misc one-offs | ~4 | Not part of the chrome palette — leave alone |

`--color-danger` and `--color-success` were removed from `tokens.css` in the
prior cleanup pass because nothing referenced the *token* — this audit shows
~45 call sites reference the *literal color they should have been*.

## Decided: dark mode

**Resolved 2026-08-02 (user decision): light-only.** New tokens get only
light-mode values, matching the "literal-to-token substitution, no visual
design change" scope. None of the redesigned components (`Dashboard.vue`,
`RecipeEditor.vue`, the 8 new modal/panel components, etc.) respond to
`prefers-color-scheme: dark` today — they hardcode light-mode `oklch()`
values directly — and this migration does not change that. `tokens.css`'s
existing dark override block (its sole `var()` consumer is `Sidebar.vue`) is
untouched. Dark-mode parity for the redesigned screens is a separate, later
effort and out of scope for every task below.

## Proposed tokens (additive to `tokens.css`)

```css
/* Focus / interactive */
--color-focus: oklch(52% 0.16 250);

/* Danger */
--color-danger: oklch(45% 0.14 25);
--color-danger-bg: oklch(96% 0.03 25);
--color-danger-border: oklch(85% 0.06 25);

/* Success */
--color-success: oklch(35% 0.05 140);
--color-success-bg: oklch(96% 0.05 140);

/* Neutral scale (hue 75) — collapses the 36 ad hoc stops down to 10,
   picked from the densest real-usage clusters below */
--gray-99: oklch(99.3% 0.002 75);  /* page bg, cards */
--gray-96: oklch(96% 0.004 75);    /* subtle surface */
--gray-93: oklch(93% 0.006 75);    /* hover fill */
--gray-88: oklch(88% 0.008 75);    /* light border / divider */
--gray-84: oklch(84% 0.008 75);    /* default border */
--gray-78: oklch(80% 0.01 75);     /* strong border / disabled text */
--gray-52: oklch(50% 0.01 75);     /* placeholder / tertiary text */
--gray-42: oklch(40% 0.01 75);     /* secondary text */
--gray-30: oklch(30% 0.01 75);     /* strong text */
--gray-20: oklch(20% 0.01 75);     /* primary text, near-black */
```

The neutral stop values are the closest *actually-observed* literals to each
cluster center, not invented numbers — each migrated call site should snap to
the nearest of these 10, not be re-eyeballed.

Existing `--bg-primary`, `--bg-secondary`, `--text-primary`,
`--text-secondary`, `--border-color` (currently hex) stay as-is; they're
sufficient for the one legacy consumer (`Sidebar.vue`) and out of scope here.

## Global Constraints

These bind every task below:

- Light-only. Do not add `@media (prefers-color-scheme: dark)` values for
  any new token (see "Decided: dark mode" above).
- Pure literal-to-token substitution. Do not change any color's perceptible
  value except where a neutral literal is snapped to the nearest of the 10
  `--gray-*` stops (Task 6) — that snap should be visually imperceptible,
  not a redesign.
- Leave untouched: per-project `accentColor`/`--cover-accent` etc., the
  Dashboard decorative accent palette (ochre/plum/teal/slate), and any
  "misc one-off" literal that isn't part of the chrome palette families
  above (see "Explicitly out of scope" below).
- After the task's edits: run `npm test` and `npm run build`; both must be
  clean. Then grep for stray `oklch(` literals in the family this task
  covers to confirm the sweep was complete (a leftover literal is a spec
  gap, not a judgment call — either migrate it or the task must explain in
  its report why that specific occurrence is out of scope, per this file's
  "Explicitly out of scope" section).
- Do the visual check with the `run` skill / chrome-devtools against
  whichever of these screens the task's family actually touches: Dashboard,
  ProjectView (chapters + bulk actions), RecipeEditor, RecipeImport (both
  input and review stages), Settings, print views. Confirm no perceptible
  color shift before marking the task done.
- Every file/occurrence count below (files, line counts, "43+", "~17") is
  this plan's estimate from the original audit — treat it as a starting
  point for `grep`, not a hard ceiling; migrate every real occurrence you
  find in the stated family, and note in your report if the actual count
  differs materially from the estimate.

## Task 1: Add the proposed tokens to `tokens.css`

Add the full token block below to `src/css/tokens.css`'s `:root` rule,
alongside the existing `--accent-color`/`--bg-primary`/etc. tokens. Add it
as a new group (e.g. under a `/* Chrome palette (design-token migration) */`
comment) — do not reorder or touch the existing tokens or the
`@media (prefers-color-scheme: dark)` block.

```css
/* Focus / interactive */
--color-focus: oklch(52% 0.16 250);

/* Danger */
--color-danger: oklch(45% 0.14 25);
--color-danger-bg: oklch(96% 0.03 25);
--color-danger-border: oklch(85% 0.06 25);

/* Success */
--color-success: oklch(35% 0.05 140);
--color-success-bg: oklch(96% 0.05 140);

/* Neutral scale (hue 75) — collapses the 36 ad hoc stops down to 10,
   picked from the densest real-usage clusters below */
--gray-99: oklch(99.3% 0.002 75);  /* page bg, cards */
--gray-96: oklch(96% 0.004 75);    /* subtle surface */
--gray-93: oklch(93% 0.006 75);    /* hover fill */
--gray-88: oklch(88% 0.008 75);    /* light border / divider */
--gray-84: oklch(84% 0.008 75);    /* default border */
--gray-78: oklch(80% 0.01 75);     /* strong border / disabled text */
--gray-52: oklch(50% 0.01 75);     /* placeholder / tertiary text */
--gray-42: oklch(40% 0.01 75);     /* secondary text */
--gray-30: oklch(30% 0.01 75);     /* strong text */
--gray-20: oklch(20% 0.01 75);     /* primary text, near-black */
```

The neutral stop values are the closest *actually-observed* literals to each
cluster center, not invented numbers — later tasks snap each migrated call
site to the nearest of these 10, not a re-eyeballed value. Leave the
existing `--bg-primary`, `--bg-secondary`, `--text-primary`,
`--text-secondary`, `--border-color` (currently hex) as-is; they're
sufficient for their one legacy consumer (`Sidebar.vue`) and out of scope
here.

Verification: `npm run build` (no CSS syntax errors) and `npm test`. No
component files change in this task — it only adds unused-so-far custom
properties, so there is nothing to visually check yet.

## Task 2: Migrate the focus ring family

Replace every occurrence of the literal `oklch(52% 0.16 250)` with
`var(--color-focus)`. This is the single most-repeated literal in the
app (~43 occurrences) — every `:focus-visible` rule, checkbox
`accent-color`, and drag-over border that uses it. Start with
`grep -rn "oklch(52% 0.16 250)" src/` to find every file (the audit named
`ChapterNameModal`, `LibrarySidebarPanel`, `PrintToolbar`,
`EditCookbookModal`, `ChapterCard` among ~8 files total — confirm the full
list yourself, don't assume that list is exhaustive). Depends on Task 1
(the token must exist in `tokens.css` first).

Verification: after the edits, `grep -rn "oklch(52% 0.16 250)" src/` must
return nothing. `npm test` and `npm run build` clean. Visual check
(`:focus-visible` state, e.g. tab to a focusable control) on at least one
screen with a checkbox or focusable input — e.g. ProjectView bulk-select
checkboxes, or RecipeEditor's fields.

## Task 3: Migrate the danger family

Replace the danger literal triad — text `oklch(45% 0.14 25)`, background
`oklch(96% 0.03 25)`, border `oklch(85% 0.06 25)` — with `var(--color-danger)`,
`var(--color-danger-bg)`, `var(--color-danger-border)` respectively, across
`Dashboard.vue`, `RecipeEditor.vue`, `RecipeImport.vue`, `RecipeLibrary.vue`,
`Settings.vue` (confirm this file list with
`grep -rln "oklch(45% 0.14 25)\|oklch(96% 0.03 25)\|oklch(85% 0.06 25)" src/`
— migrate every file it finds, not just the five named here). Where the
three appear together as an error-banner set, migrate all three together,
not just the text color in isolation — a banner with a migrated text color
but a stray literal border is a partial migration and fails this task's
verification. Depends on Task 1.

Verification: `grep -rn "oklch(45% 0.14 25)\|oklch(96% 0.03 25)\|oklch(85% 0.06 25)" src/`
returns nothing. `npm test` and `npm run build` clean. Visual check: trigger
a delete-confirmation or error state in RecipeImport and Dashboard/Settings
to see the danger banner/button render unchanged.

## Task 4: Migrate the success family

Replace the success pair — text `oklch(35% 0.05 140)`, background
`oklch(96% 0.05 140)` — with `var(--color-success)` and
`var(--color-success-bg)` in `RecipeImport.vue` (5 occurrences per the
audit; confirm with
`grep -rn "oklch(35% 0.05 140)\|oklch(96% 0.05 140)" src/`, which should
only hit that one file — if it hits others, migrate those too). Depends on
Task 1.

Verification: `grep -rn "oklch(35% 0.05 140)\|oklch(96% 0.05 140)" src/`
returns nothing. `npm test` and `npm run build` clean. Visual check: run an
AI recipe import to completion and confirm the import-success banner in
`RecipeImport.vue` renders unchanged.

## Task 5: Migrate the brand accent family

Audit the ~17 call sites in hue 35–45, chroma ≥0.06 (the brand-orange
approximation range — start from
`grep -rn "oklch(" src/ | grep -E "oklch\([0-9.]+% 0\.(0[6-9]|[1-9][0-9]*) (3[5-9]|4[0-5])\)"`
as a starting filter, then eyeball each hit) **individually** — this family
is judgment, not mechanical. For each hit, decide: is this the app's brand
chrome color (swap to `var(--accent-color)`), or a legitimate per-project/
one-off use (e.g. `PagePreview.vue`'s cover-preview border) that must be
left as a literal per this plan's "Explicitly out of scope" section? Do not
swap a site you're not confident is the app-chrome brand color — leaving a
genuine one-off as a literal is correct, not a missed migration. Record
your reasoning for each left-as-literal site in your task report so the
reviewer can check the call. Depends on Task 1.

Verification: `npm test` and `npm run build` clean. Visual check: Sidebar
(the pre-existing `var(--accent-color)` consumer, confirm unchanged) plus
whichever other screens you migrated.

## Task 6: Migrate the neutral scale (last, largest, most judgment)

Across all 19 files carrying chrome-palette literals, map each hue-75
low-chroma (≤0.02) neutral literal to the nearest of the 10 new `--gray-*`
stops from Task 1 (`--gray-99` down to `--gray-20`). Go file by file. Do
not silently round a literal that doesn't cleanly fit one of the 10
clusters — flag it in your task report as a candidate for an 11th stop
rather than forcing it to the nearest one if the gap is visually
significant (a few % lightness snap is fine and expected; don't flag every
single migration, only genuine outliers). Depends on Task 1; independent of
Tasks 2-5 but do it last per this plan's stated order since it's the
riskiest and benefits from the other families already being clear of the
`oklch(` grep noise.

Verification: `npm test` and `npm run build` clean. Grep for remaining
hue-75 low-chroma `oklch(` literals in the touched files to confirm the
sweep — remaining hits are only acceptable if flagged as an outlier in the
report. Visual check: Dashboard, ProjectView (chapters + bulk actions),
RecipeEditor, RecipeImport (both stages), Settings, and print views —
before/after screenshots, since this touches the most surface area and a
regression here is the easiest to miss.

## Explicitly out of scope

- Per-project `accentColor` / cover-accent swatch system (separate fix, see
  the Dashboard/EditCookbookModal palette-mismatch bug).
- The Dashboard-only decorative accent palette (ochre/plum/teal/slate) —
  that's product content, not chrome, and is being reconciled with
  `templates.js`'s `ACCENT_COLORS` as part of the bug fix, not this plan.
- Introducing new colors or changing the app's visual design — this is a
  literal-to-token substitution, values should not shift perceptibly except
  where a literal is snapped to the nearest of the 10 neutral stops.
