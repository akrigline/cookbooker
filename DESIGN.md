---
name: Culinary Manuscript
colors:
  ink-99: oklch(99.3% 0.002 75)
  ink-96: oklch(96% 0.004 75)
  ink-93: oklch(93% 0.006 75)
  ink-88: oklch(88% 0.008 75)
  ink-84: oklch(84% 0.008 75)
  ink-78: oklch(80% 0.01 75)
  ink-52: oklch(50% 0.01 75)
  ink-46: oklch(45% 0.01 75)
  ink-42: oklch(40% 0.01 75)
  ink-30: oklch(30% 0.01 75)
  ink-20: oklch(20% 0.01 75)
  focus: oklch(52% 0.16 250)
  danger: oklch(45% 0.14 25)
  danger-bg: oklch(96% 0.03 25)
  danger-border: oklch(85% 0.06 25)
  success: oklch(35% 0.05 140)
  success-bg: oklch(96% 0.05 140)
  success-border: oklch(85% 0.1 140)
  page-bg: '#f7f4ef'
  paper-white: '#ffffff'
  sidebar-accent: '#d97742'
  terracotta: '#d97742'
  forest-green: '#3f6b4a'
  harvest-gold: '#c99a2e'
  plum: '#7a4a6b'
  slate-blue: '#43597a'
  charcoal: '#3a3a3a'
  recipe-bg: '#ffffff'
  recipe-surface-container-low: '#f5f3f3'
  recipe-on-surface: '#1b1c1c'
  recipe-on-surface-variant: '#4c4546'
  recipe-primary: '#000000'
  recipe-outline-variant: '#cfc4c5'
typography:
  page-title:
    fontFamily: Newsreader
    fontSize: 34px
    fontWeight: '600'
    letterSpacing: -0.01em
  page-title-compact:
    fontFamily: Newsreader
    fontSize: 26px
    fontWeight: '600'
  h2:
    fontFamily: Newsreader
    fontSize: 20px
    fontWeight: '600'
  item-title:
    fontFamily: Newsreader
    fontSize: 19px
    fontWeight: '600'
    letterSpacing: -0.01em
  recipe-title:
    fontFamily: EB Garamond
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  section-header:
    fontFamily: Atkinson Hyperlegible Next
    fontSize: 14px
    fontWeight: '700'
    lineHeight: 20px
    letterSpacing: 0.05em
  instruction-step:
    fontFamily: Atkinson Hyperlegible Next
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.2'
  ingredient-list:
    fontFamily: Atkinson Hyperlegible Next
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.2'
  chef-note:
    fontFamily: EB Garamond
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.2'
  body-main:
    fontFamily: Atkinson Hyperlegible Next
    fontSize: 11px
    fontWeight: '400'
    lineHeight: 16px
  meta-label:
    fontFamily: Atkinson Hyperlegible Next
    fontSize: 9px
    fontWeight: '700'
    lineHeight: 12px
  button-text:
    fontFamily: system-ui
    fontSize: 14px
    fontWeight: '600'
rounded:
  sm: 6px
  DEFAULT: 8px
  lg: 14px
  xl: 16px
  full: 999px
spacing:
  xs: 0.25rem
  sm: 0.5rem
  md: 1rem
  lg: 1.5rem
  page-max-dashboard: 1280px
  page-max-form: 840px
  page-max-compact: 640px
  recipe-column-gap: 2rem
  recipe-element-stack: 0.5rem
  recipe-section-stack: 1.5rem
components:
  button-primary:
    backgroundColor: '{colors.ink-20}'
    textColor: '{colors.ink-99}'
    rounded: '{rounded.DEFAULT}'
    padding: 10px 20px
    typography: '{typography.button-text}'
  button-primary-hover:
    backgroundColor: '{colors.ink-30}'
  button-secondary:
    backgroundColor: '{colors.ink-93}'
    textColor: '{colors.ink-20}'
    rounded: '{rounded.DEFAULT}'
    padding: 10px 20px
    typography: '{typography.button-text}'
  button-secondary-hover:
    backgroundColor: '{colors.ink-88}'
  button-danger:
    backgroundColor: '{colors.danger}'
    textColor: '{colors.ink-99}'
    rounded: '{rounded.DEFAULT}'
    padding: 10px 20px
    typography: '{typography.button-text}'
  card:
    backgroundColor: '{colors.ink-99}'
    rounded: '{rounded.lg}'
  modal:
    backgroundColor: '{colors.ink-99}'
    rounded: '{rounded.xl}'
    padding: 28px 32px
  input:
    backgroundColor: '{colors.ink-99}'
    rounded: '{rounded.DEFAULT}'
  pill:
    backgroundColor: '{colors.ink-93}'
    textColor: '{colors.ink-52}'
    rounded: '{rounded.full}'
  bulk-bar:
    backgroundColor: '{colors.ink-20}'
    textColor: '{colors.ink-96}'
---

## Overview

The design system is an editorial, utility-first framework built around a "Culinary Manuscript"
aesthetic — a blend of artisanal kitchen notebooks and professional cookbook publishing. It
prioritizes kitchen legibility, tactile warmth, and archival quality.

The visual style is minimalist and editorial: a light-only warm-gray tonal scale (`ink-*`) that
reduces glare in kitchen environments, sharp high-contrast typography, and a linen-inspired page
background rather than digital-white starkness. The app splits into two coherent design languages
under one shared palette: a functional screen-chrome tool for authoring, and a rigorous,
ink-conscious layout for physical print. Both share the `ink` neutral scale and page-width
discipline, but print output uses its own scoped token namespace (see Colors) since it renders
independently of the live DOM's screen chrome.

## Colors

The neutral scale is named `ink` — warm charcoal tones on cream paper, `oklch` hue 75, low chroma.
Each stop is suffixed with its own lightness percentage (`ink-84` ≈ 84% L), so a stop's name is
also its approximate value; that's deliberate; don't rename a stop's number when it's snapped to a
new call site.

- **`ink-99`/`ink-96`/`ink-93`**: page background, card fill, hover fill.
- **`ink-88`/`ink-84`**: dividers and default borders.
- **`ink-78`/`ink-52`/`ink-46`/`ink-42`**: disabled/placeholder/secondary text.
- **`ink-30`/`ink-20`**: primary text, near-black chrome (primary button fill, bulk-action bar).
- **`focus`**: the single interactive-blue used for every `:focus-visible` ring, checkbox
  `accent-color`, and drag-over border.
- **`danger`/`danger-bg`/`danger-border`** and **`success`/`success-bg`/`success-border`**: paired
  text/surface/border triads for destructive actions and success banners.
- **`sidebar-accent`**: the sidebar wordmark's accent color. Distinct from the per-project accent
  system below even though it defaults to the same terracotta hex — don't conflate the two.
- **Per-project accent palette** (`terracotta`/`forest-green`/`harvest-gold`/`plum`/
  `slate-blue`/`charcoal`): the six swatches a user picks per cookbook in the cover-color picker.
  This is content the user chooses, not app chrome — it themes a cookbook's cover, chapter
  dividers, and table-of-contents rule, nothing in the surrounding app UI.
- **`recipe-*` colors**: a separate, scoped token namespace (`.recipe-sheet`) used only by printed
  recipe sheets and their live preview. Kept apart from the `ink` scale because print output is
  measured and rendered independently of the screen-chrome DOM tree — see Layout.

## Typography

Three type families, each with a distinct job:

1. **Newsreader** (serif) — app-chrome headings: page titles, section headings, list-item titles.
   Literary, authoritative.
2. **EB Garamond** (serif) — recipe titles and Chef's Notes. Classical cookbook-publishing feel.
3. **Atkinson Hyperlegible Next** (sans) — the workhorse for ingredients, instructions, and every
   other dense or numeric recipe text. Chosen for legibility in low-light kitchen settings, so
   `1/2` and `1/4` are never misread.

App-chrome buttons/labels/toolbars use the system font stack (`--font-main`), not a loaded
webfont — keeps chrome feeling like a responsive native tool rather than editorial content.

The recipe/print scale (`recipe-title`, `section-header`, `meta-label`, `instruction-step`,
`chef-note`, `body-main`, `ingredient-list`) is fixed independent of screen size: these sizes are
tuned for an 8.5"×11" printed page, not a responsive viewport.

## Layout

Three deliberate page-width tiers — not one shared width — because data-dense pages
(dashboard/library) and single-column forms/empty-states want different reading widths:

- **`page-max-dashboard`** (1280px): library/dashboard, anything managing a collection.
- **`page-max-form`** (840px): focused single-purpose pages.
- **`page-max-compact`** (640px): modals-as-pages, empty/error states — centered content.

Vertical rhythm outside print is spacing-scale-based (`xs`/`sm`/`md`/`lg` = 4/8/16/24px), though
most components currently hand-write pixel values in that same rough progression rather than
referencing the scale directly.

Printed recipe sheets use their own spacing triad (`recipe-column-gap`/`recipe-element-stack`/
`recipe-section-stack`) scoped to `.recipe-sheet`, sized for the fixed 8.5"×11" page rather than
the app's responsive spacing scale.

## Elevation & Depth

This system avoids drop shadows on static surfaces in favor of tonal layers and crisp 1px
`ink-88`/`ink-84` outlines — cards and buttons read as flat, bordered surfaces, not lifted ones.

Elevation (`box-shadow`) is reserved for surfaces that float over or dock against the rest of the
UI: modal dialogs, popover/overflow menus, and permanently fixed/docked bars and panels (the bulk
action bar, the library sidebar's bottom-docked bulk bar, the print page-preview thumbnail). It is
not a general-purpose "important surface" treatment — a static card or button never gets a shadow
regardless of how prominent it is.

## Shapes

Corner radius follows a small scale, distinct between screen-chrome and print:

- **`sm`** (6px): small chips and menu items.
- **`DEFAULT`** (8px): buttons, inputs, form fields.
- **`lg`** (14px): cards and panels.
- **`xl`** (16px): modal dialogs — deliberately rounder than a card, to read as a distinct,
  temporary surface.
- **`full`** (999px): fully-round pills, badges, and swatch pickers.

Printed recipe sheets and Chef's Note boxes use sharp (0px) corners — architectural precision that
evokes a historical manuscript layout, in contrast to the softer screen-chrome shapes above.

## Components

- **Buttons** — Primary: `ink-20` fill, `ink-99` text, hover `ink-30`. Secondary/ghost: `ink-93`
  fill, `ink-20` text, `ink-84` border, hover `ink-88`. Danger: `danger` fill, `ink-99` text. All
  three: `rounded.DEFAULT`, `10px 20px` padding, `button-text` typography,
  `:focus-visible { outline: 2px solid focus; outline-offset: 2px }`, `:disabled { opacity: 0.5 }`.
- **Cards** — `ink-99` fill, 1px `ink-88` border, `rounded.lg`. No shadow.
- **Modal** — `ink-99` fill, 1px `ink-88` border, `rounded.xl`, `28px 32px` padding, dual-layer
  shadow (diffused + tight), backdrop is a flat translucent dark scrim (not blurred).
- **Inputs** — `ink-99` fill, 1px `ink-84` border, `rounded.DEFAULT`. Focus state replaces the
  border with `focus` and adds a 2px outline at 1px offset.
- **Checkboxes** — `accent-color: focus` (the blue interactive token) on every checkbox in the
  app; not the per-project terracotta/brand accent.
- **Pills/badges** — `ink-93` fill, 1px `ink-84` border, `rounded.full`, `ink-52` text.
- **Bulk action bar** — fixed, full-width, bottom-docked, `ink-20` fill, `ink-96` text, upward
  shadow, slide-up transition.

## Do's and Don'ts

- Do use `ink-*` for every screen-chrome surface, text, and border color. Don't introduce a new
  gray literal when an existing `ink-*` stop is within a few percent lightness of what you need.
- Do use `focus` for every interactive/selected-state blue (focus rings, checkboxes, drag-over
  borders, active-tab treatments). Don't reach for the per-project accent palette for app chrome —
  that palette is cookbook content, not UI state.
- Do treat the six `ACCENT_COLORS` swatches (terracotta/forest-green/harvest-gold/plum/
  slate-blue/charcoal) as per-cookbook decoration only — cover, chapter dividers, table of
  contents. Don't use them to theme app-chrome buttons, links, or status states.
- Do reserve elevation (`box-shadow`) for floating or permanently-docked surfaces — modals,
  popovers, fixed bars/panels, the print thumbnail. Don't add a shadow to a static card or button
  to make it feel "more important" — use a border-color or fill change instead.
- Do keep the recipe/print token namespace (`recipe-*` colors, `.text-recipe-*` typography,
  `recipe-column-gap`/`element-stack`/`section-stack` spacing) scoped to `.recipe-sheet` and its
  measurement/preview mounts. Don't reach into it from screen-chrome components, and don't reach
  into the `ink-*`/screen-chrome scale from a `.recipe-sheet` descendant — the two are measured
  and rendered independently on purpose (see `AGENTS.md`'s notes on `recipeFitMeasure.js` and
  `tocLayout.js`).
- Do round buttons/inputs to `rounded.DEFAULT` (8px), cards/panels to `rounded.lg` (14px), modals
  to `rounded.xl` (16px), and fully-round elements to `rounded.full` (999px). Don't invent a new
  radius value for a new component without checking which of these four tiers it belongs to.
