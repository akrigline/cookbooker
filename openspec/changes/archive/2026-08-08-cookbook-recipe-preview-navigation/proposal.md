## Why

When reviewing a cookbook's recipe lineup in the project view, users must close and reopen the recipe preview each time they want to inspect a different recipe in the same chapter. This repeated open/close cycle creates unnecessary friction and interrupts the natural flow of reviewing recipes sequentially.

## What Changes

- The recipe preview gains **previous** and **next** navigation controls that move between recipes ordered within the same chapter, without closing and reopening the preview.
- Keyboard shortcuts (arrow keys) will support navigation for power users.
- The preview tracks which recipe is currently displayed so navigation controls know where they are in the ordered list.
- Edge behavior (first/last recipe in a chapter, optional cross-chapter wrapping) will be resolved during implementation.

## Capabilities

### New Capabilities

*(none — this change extends an existing capability)*

### Modified Capabilities

- `recipe-preview`: Adds a new requirement for prev/next navigation controls within an open preview, so users can move between recipes in a chapter without closing and reopening the dialog.

## Impact

- **`openspec/specs/recipe-preview/spec.md`** — a delta spec will add the navigation requirements.
- **`src/views/ProjectView.vue`** (or equivalent cookbook project view) — passes ordered recipe list and current index into the preview component.
- **`src/components/RecipePreviewDialog.vue`** (or equivalent) — renders prev/next controls and emits navigation events; handles arrow-key keyboard shortcuts.
- No new routes, stores, or API changes anticipated for the core requirement; any larger UI shape change (e.g., slide-out panel) would be a design-time decision that could affect routing.
