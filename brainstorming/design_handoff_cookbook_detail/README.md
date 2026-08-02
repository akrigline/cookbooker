# Handoff: Cookbook Detail (v2) — Chapter & Recipe Management

## Overview
The Cookbook Detail screen is where a user organizes a single cookbook's structure at scale: creating/renaming/deleting/reordering chapters, and adding/moving/removing recipes within and across chapters, plus bulk operations on both the cookbook's recipes and the global recipe library sidebar. Designed for cookbooks with dozens of chapters and recipes.

## About the Design Files
The files in this bundle are **design references created in HTML** — interactive prototypes showing intended layout, states, and behavior, not production code to copy directly. The task is to **recreate these HTML designs in the target codebase's existing environment** (React, Vue, SwiftUI, native, etc.) using its established component library, state-management patterns, and styling system — or, if no environment exists yet, to choose the most appropriate framework and implement the designs there.

## Fidelity
**High-fidelity (hifi).** Colors, typography, spacing, and interaction patterns (drag-and-drop, modals, focus management) are final-intent. Recreate pixel-close using the codebase's existing design system/components; only literal color/font values should come from this doc when no system token matches.

## Screens / Views

### Cookbook Detail (single screen, scrolling stack layout)
**Purpose:** Manage one cookbook's chapters and recipe assignments.

**Layout:**
- Sticky header bar (full width, `border-bottom:1px solid oklch(88% 0.008 75)`, background `oklch(99% 0.003 75)`): logo mark + wordmark "Cookbook Studio" on the left, primary nav ("Cookbooks" active, "Recipe Library") on the right. Inner content max-width 1160px, centered, `padding:16px 32px`.
- Main content area: max-width 1160px centered, `padding:22px 32px` (bottom padding becomes 96px when the bulk-selection bar is showing, else 56px).
- Breadcrumb link ("← Cookbooks") above the title.
- Title row: accent-color vertical bar (4×28px, rounded) + cookbook title (Newsreader serif, 23px/600) + inline edit-pencil icon button (opens "Edit cookbook details" modal) + caption line below (subtitle · recipe/chapter counts, 12.5px muted).
- Below the title row: a two-column layout, `display:flex; gap:24px; align-items:flex-start`.
  - **Left column** (`flex:1`): vertical stack of chapter cards, `gap:6px`.
  - **Right column** (fixed `width:300px`, sticky, `top:16px`): a "New chapter" quick-add form sits directly above the Recipe Library panel, both inside one 300px-wide flex column so they stack vertically.

**Chapter card** (`section`, `border-radius:14px`, border `oklch(88% 0.008 75)`, bg `oklch(99.2% 0.002 75)`):
- Header row (bg `oklch(97.5% 0.005 75)`, bottom border): drag handle (6-dot grip icon, hidden for the permanent "Miscellaneous" chapter) + stacked up/down move buttons + chapter name (Newsreader 17px/600, small lock icon for Miscellaneous) + recipe count label + "Select all" checkbox + "Sort A–Z" link (both only shown when the chapter has recipes) + rename/delete icon buttons (hidden for Miscellaneous, which instead shows italic "Default chapter. Omitted from the compiled book when empty.").
- Body: one row per recipe, or an italic empty-state message ('No recipes in this chapter yet…').

**Recipe row** (44px+ tall, bottom border `oklch(92% 0.006 75)`):
- Checkbox (bulk-select) → drag handle (6-dot icon) → 32×32px image thumbnail (placeholder diagonal-stripe pattern if present, dashed box if absent) → recipe title (Newsreader 14.5px/600, truncated with ellipsis) → overflow "⋯" menu button.
- Overflow menu (220px popover): "Open recipe" (link) / "Move up" / "Move down" / divider / "Move to chapter" (select) / divider / "Remove from cookbook" (red, opens double-confirm modal).
- Drag-and-drop: recipes reorder within a chapter via row-level drop targets (top border becomes accent blue as an insertion indicator), or drop directly onto another chapter's section to move (with chapter-level dragover/drop handlers as a catch-all).

**New Chapter quick-add** (sits above the Recipe Library panel, not a modal): single-line text input ("New chapter name…") + "Add" button, submits on Enter, clears on success, inserts the new chapter just before Miscellaneous, and announces via the live region.

**Recipe Library panel** (right sidebar, `width:300px`, sticky, own scroll region, `max-height:calc(100vh - 32px)`):
- Header: "Recipe Library" title, search input (icon-prefixed), count label ("N available" / "M of N available" while filtered), helper text ("Drag a recipe onto a chapter, or use +."), and "Select all" / "Deselect all" text links (select all applies to the **currently visible/filtered** rows only; deselect all clears the entire selection including hidden rows).
- List: each row = checkbox → drag handle → 28×28px thumbnail → title (truncated) → small "+" quick-add button (adds directly to Miscellaneous).
- **Bulk action bar** (only rendered when 1+ library items are selected; sits as a fixed last child at the bottom of the panel, not the viewport): "N recipes selected" + "Deselect all" link, a full-width "Add to chapter…" `<select>` (adding immediately on choice, no separate submit button), and a two-button row — "Add to Misc." (secondary) and "New chapter…" (primary, opens the chapter-name modal in "new chapter from selection" mode).
- Selection persists across filter changes — selecting library rows, then typing a search query, does not drop hidden selections; only "Deselect all" clears everything.

## Interactions & Behavior

**Bulk bar for in-cookbook recipes** (fixed to the viewport bottom when 1+ recipes selected across any chapter): "N recipes selected" + "Clear" + "Move to" select + "New chapter from these" button + "Remove from cookbook" button (red, opens double-confirm modal for all selected).

**Modals** (all use the same accessible shell: fixed overlay `oklch(20% 0.01 75 / 0.45)`, `role="dialog"` or `role="alertdialog"`, focus trap via Tab/Shift+Tab cycling, Escape closes, focus returns to the triggering element on close, first field auto-focused on open):
1. **Edit cookbook details** — title (required), subtitle, accent color swatches (6 preset colors, radio-button-like `aria-pressed` swatches).
2. **Chapter name form** — shared by "New chapter" (from a chapter/library bulk-selection), "Rename chapter", and drives the "new chapter from selection" flows for both the in-cookbook bulk bar and the library bulk bar (heading and subheading adapt to context, e.g. "N selected library recipes will move into it.").
3. **Delete chapter** (alertdialog) — recipes in the chapter move to Miscellaneous, not deleted; copy adapts to recipe count.
4. **Remove recipe** (alertdialog, single) — explains the recipe stays in the Global Library / other cookbooks.
5. **Bulk remove** (alertdialog, multiple) — same reassurance copy, count-aware.
6. **Add recipes from Library** (legacy modal, currently unreachable from any button — the quick-add row, library drag-and-drop, and the two library bulk actions replaced its entry point, but the modal and its logic remain in the file for reference/reuse if a future flow needs a dedicated add dialog).

**Double confirmation on removal:** removing a recipe or bulk-removing always opens an alertdialog requiring an explicit second click; there is no direct/instant delete.

**Drag and drop, all types:**
- Chapters reorder via a wrapper-level dragover computing before/after position from cursor Y, shown as a blue insertion line above the chapter card.
- Recipes reorder within/between chapters (row-level and chapter-section-level drop targets).
- Library rows drag directly onto a chapter to add-and-remove-from-pool in one action.
- All drag operations announce their result via the live region (e.g. `Moved "X" to {chapter}.`).

**Live region announcements:** a visually-hidden `aria-live="polite"` status region receives a message on every state-changing action (create/rename/delete chapter, move/remove recipe, bulk actions), auto-clearing after 4s.

## State Management
Key state (see the component's `state` object for the authoritative shape):
- `chapters`: ordered list, each `{id, name, isMisc?}`; Miscellaneous is a permanent last-position chapter.
- `recipes`: flat list, each `{id, title, hasImage, chapterId}` — chapter membership and order both live in this single array's shape/order.
- `libraryPool`: recipes not yet in this cookbook, each `{id, title, hasImage}`.
- `selectedIds` / `libSelectedIds`: two independent selection maps (id → true) — one for in-cookbook recipe rows (used by the fixed bottom bulk bar), one for library rows (used by the library panel's own bulk bar). Library selection is NOT filtered by the library search query — it persists across filter changes by design.
- `modal`: `null | {type, id?}` — single source of truth for which dialog is open; `type` values: `editDetails`, `newChapter`, `renameChapter`, `deleteChapter`, `removeRecipe`, `bulkRemove`, `newChapterFromSelection` (from the in-cookbook bulk bar), `newChapterFromLibrarySelection` (from the library bulk bar), `addRecipes` (legacy, unreachable).
- `dragType` / `dragId` / `dragOverChapterIndex` / `dragOverRecipeId`: transient drag-and-drop state, cleared on drop/dragend.
- `query` / `libQuery`: current in-cookbook and library search strings (the top-of-page recipe search was removed per product decision; only the library search remains).
- `toastMessage`: drives the live-region announcement text.

State transitions of note: deleting a non-empty chapter reassigns its recipes to Miscellaneous rather than deleting them; creating a chapter always inserts it immediately before Miscellaneous so Miscellaneous stays last.

## Design Tokens

**Colors** (all in OKLCH; convert to hex/RGB as the target system requires):
- Page background: `oklch(97.5% 0.006 75)`
- Card/panel background: `oklch(99.2% 0.002 75)`, header-strip background `oklch(97.5% 0.005 75)`
- Borders: `oklch(88% 0.008 75)` (card), `oklch(90% 0.008 75)` (header strip), `oklch(92% 0.006 75)` (row divider), `oklch(85% 0.008 75)` (control border, bulk bar top border)
- Primary text: `oklch(18% 0.01 75)`; secondary/muted text: `oklch(45–55% 0.01 75)` range
- Primary action (buttons, links): `oklch(20% 0.015 75)` bg / `oklch(98% 0.004 75)` text; hover `oklch(28% 0.02 75)`
- Link/accent blue (selection tint, focus rings, "Select all"/"Sort A–Z" links): `oklch(45–52% 0.14–0.16 250)`
- Destructive: `oklch(45% 0.14 25)` text/bg, border `oklch(80% 0.06 25)`, hover bg `oklch(94% 0.04 25)`
- Accent color swatches (cookbook theming): Terracotta `oklch(62% 0.13 35)`, Sage `oklch(62% 0.09 145)`, Ochre `oklch(70% 0.12 85)`, Plum `oklch(50% 0.11 325)`, Teal `oklch(55% 0.09 200)`, Slate Blue `oklch(55% 0.10 265)`

**Typography:**
- Display/headings: "Newsreader" serif (Google Font, weights 500/600, italic 500 available), letter-spacing -0.01em on headings.
- Body/UI: system sans stack (`-apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, Arial, sans-serif`).
- Scale in use: 23px (page title) · 20px (modal heading) · 17px (chapter name) · 15.5px (panel heading) · 14.5px (recipe title) · 14px (body/buttons) · 13–13.5px (secondary buttons, labels) · 11.5–12.5px (meta text, counts).

**Spacing / radius:**
- Card/panel radius 14px; small controls 6–8px; pill/circular swatches 999px.
- Standard row padding ~9–12px vertical, 12–16px horizontal; modal padding 26px (22px bottom).
- Column gap 24px; chapter-card stack gap 6px.

**Shadows:** modal `0 20px 60px oklch(20% 0.02 75 / 0.25)`; bulk bar `0 -8px 24px oklch(20% 0.02 75 / 0.12)`; overflow menu `0 12px 30px oklch(20% 0.02 75 / 0.2)`.

**Focus ring:** `outline: 2px solid oklch(52% 0.16 250); outline-offset: 1–2px` on every interactive element — required for WCAG 2.x keyboard-navigation compliance; do not drop this in the recreated implementation.

## Assets
No photographic or illustration assets. Recipe/library thumbnails are placeholder blocks: a repeating 45°-diagonal-stripe gradient (`oklch(90% 0.02 250)` / `oklch(94% 0.015 250)`) when `hasImage` is true, or a dashed-border empty box (`oklch(95% 0.004 75)` bg, `oklch(83% 0.008 75)` dashed border) when false. Icons are inline hand-drawn SVGs (Lucide-style stroke icons at 11–17px) — recreate with the target codebase's icon library (e.g. swap for the closest equivalent glyphs: grip/drag, chevron up/down, pencil, trash, plus, search, more-vertical, lock, x, chevron-left).

## Files
- `Cookbook Detail v2.dc.html` — the full interactive prototype for this screen (markup + inline styles + state/logic class), included in this handoff folder.
