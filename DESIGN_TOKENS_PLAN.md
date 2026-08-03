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

## Open decision: dark mode

None of the redesigned components (`Dashboard.vue`, `RecipeEditor.vue`, the 8
new modal/panel components, etc.) respond to `prefers-color-scheme: dark` —
they hardcode light-mode `oklch()` values directly. `tokens.css` still carries
a dark override block, but it only affects `Sidebar.vue` (its sole `var()`
consumer). **Before starting, decide:** does this migration restore dark-mode
parity for the redesigned screens, or stay light-only and treat dark mode as a
separate, later effort? The token names/values below work either way, but it
changes whether Phase 2 needs a `@media (prefers-color-scheme: dark)` value
alongside every new token.

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

## Migration order

Do the unambiguous, highest-value families first; save the neutral scale
(most files, most judgment calls) for last.

1. **Focus ring** — replace all 43+ instances of `oklch(52% 0.16 250)` with
   `var(--color-focus)`. Single value, mechanical, touches 8 files
   (`ChapterNameModal`, `LibrarySidebarPanel`, `PrintToolbar`,
   `EditCookbookModal`, `ChapterCard`, others found by grep).
2. **Danger** — `Dashboard.vue`, `RecipeEditor.vue`, `RecipeImport.vue`,
   `RecipeLibrary.vue`, `Settings.vue`. Replace the text/bg/border triad
   together where they appear as a set (error banners), not just the text
   color in isolation.
3. **Success** — `RecipeImport.vue` only, 5 occurrences.
4. **Brand accent** — audit the ~17 hue 35–45 chroma≥0.06 call sites
   individually; some may be legitimate one-offs (e.g. `PagePreview.vue`'s
   cover-preview border) rather than the app chrome accent. Only swap to
   `var(--accent-color)` where the intent is clearly "the app's brand color,"
   not a per-project accent already carried via `--cover-accent` etc.
5. **Neutral scale** — largest and riskiest. Go file by file (19 files), map
   each literal to its nearest new `--gray-*` stop, and flag (don't silently
   round) any literal that doesn't cleanly fit one of the 10 clusters —
   that's a sign the scale is missing a stop, not that the literal should be
   forced to fit.

## Verification

- `npm test` and `npm run build` after each phase, not just at the end.
- Visual check (via the `run` skill / chrome-devtools) of at least: Dashboard,
  ProjectView (chapters + bulk actions), RecipeEditor, RecipeImport (both
  input and review stages, to catch the danger/success banners), Settings,
  and the print views — before/after screenshots per phase, since this is a
  pure visual refactor with no behavior change to verify functionally.
- Grep for stray `oklch(` literals remaining in the touched families after
  each phase to confirm the sweep was complete.

## Explicitly out of scope

- Per-project `accentColor` / cover-accent swatch system (separate fix, see
  the Dashboard/EditCookbookModal palette-mismatch bug).
- The Dashboard-only decorative accent palette (ochre/plum/teal/slate) —
  that's product content, not chrome, and is being reconciled with
  `templates.js`'s `ACCENT_COLORS` as part of the bug fix, not this plan.
- Introducing new colors or changing the app's visual design — this is a
  literal-to-token substitution, values should not shift perceptibly except
  where a literal is snapped to the nearest of the 10 neutral stops.
