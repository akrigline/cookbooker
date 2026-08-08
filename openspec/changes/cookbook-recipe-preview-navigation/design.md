## Context

The recipe preview is currently a read-only dialog (`RecipePreviewDialog.vue`) opened from the cookbook project view (`ProjectView.vue`) when a user clicks a recipe in a chapter. Once open, there is no way to jump to the adjacent recipe — the user must close the dialog, click the next recipe, and wait for the dialog to reopen. This is friction when reviewing an entire chapter's lineup.

The project view already holds the full ordered list of `project_recipes` grouped by chapter (via the projects store), so the data needed for navigation is already in memory. What is missing is a way to surface it in the preview.

## Goals / Non-Goals

**Goals:**
- Users can navigate to the previous and next recipe within the currently-open chapter without closing the preview.
- Navigation controls are visually obvious (buttons with arrow icons).
- Keyboard arrow-key shortcuts work when the preview is open.
- The controls correctly disable (or hide) at the first and last recipe in the chapter.
- The preview's displayed content updates instantly without a network round-trip.

**Non-Goals:**
- Cross-chapter wrapping is explicitly out of scope for the initial implementation (left as a future enhancement).
- Swipe gestures on mobile are not required in v1.
- Deep-linking or URL-based navigation to a specific recipe in the preview is not required.

## Decisions

### Decision 1: UI shape — dialog vs. slide-out panel vs. route

**Resolved: extend the current dialog.** See `AGENTS.md` and tasks.md task 1.1 for the recorded
rationale (no focusable/selectable content besides Edit/Close/nav buttons, so arrow keys don't
conflict with text selection; the dialog already had header room for nav controls). This choice is
a stated dependency for the follow-up `cookbook-aware-recipe-editor` change, so the dialog shape
should be preserved rather than swapped for a panel/route later without a deliberate decision.

| Option | Pros | Cons |
|--------|------|------|
| **Extend the current dialog** (chosen) | Minimal scope change; no routing changes | Dialog width limits comfortable layout; arrow keys conflict with text selection if content is selectable |
| **Slide-out panel / drawer** | Wide canvas, natural prev/next feel, doesn't occlude the recipe list behind it | Requires new layout component; moderate scope expansion |
| **Dedicated preview route** | Deeplink-friendly, full-width, browser back/forward works naturally | Larger scope; changes the nature of the preview entirely |

### Decision 2: Navigation scope is within-chapter only (v1)

Recipes are ordered by their `sequence` within a chapter's `project_recipes` rows. The prev/next controls move through that ordered list. When the user is at the first recipe in the chapter, **Prev** is disabled. When at the last, **Next** is disabled. Cross-chapter continuation is a future enhancement.

Rationale: Chapters are the primary organizational unit in the cookbook. Wrapping across chapters risks confusing users about which chapter they are in, especially if chapters have very different lengths.

### Decision 3: Navigation state lives in the parent view, not the preview component

`ProjectView.vue` (or its equivalent) already owns the ordered chapter lists. It should pass a `recipes` array and a `currentIndex` prop into the preview component rather than having the preview re-query the store. The preview emits `navigate(delta)` events (+1 / −1), and the parent increments/decrements the index and updates the displayed recipe.

Rationale: Keeps the preview component stateless with respect to the recipe list, making it easier to test and reuse.

### Decision 4: Keyboard shortcut scope

Arrow-key navigation (← / →) activates only when the preview is open. The handler is attached on `mounted` and removed on `unmounted` (or on dialog close). If the chosen UI shape contains focusable text content, additional care is needed to avoid interfering with text selection; the implementer should evaluate `event.target` gating or limiting shortcuts to non-input elements.

## Risks / Trade-offs

- **Keyboard conflicts** → If the preview contains selectable text or focusable inputs (e.g., the "Edit Recipe" button), arrow keys may need to be gated on `document.activeElement` checks. Mitigation: gate on `!event.target.matches('input, textarea, [contenteditable]')`.
- **Dialog width** → If the dialog shape is kept, long ingredient/instruction lists may feel cramped with nav buttons added. Mitigation: choose the panel/route shape if this becomes an issue during design review.
- **Stale index** → If the user modifies the recipe list (reorder, delete) while the preview is open, the in-memory index could become stale. Mitigation: close the preview on any mutation of the parent chapter's recipe list, or reactively re-derive the index from the store.

## Open Questions

1. ~~**UI shape**: Dialog, slide-out panel, or preview route?~~ *(Resolved — see Decision 1: dialog.)*
2. **Cross-chapter wrapping**: Should next/prev wrap to the start of the next/previous chapter in v1, or stay disabled at chapter boundaries? *(Defaulting to disabled; revisit after v1.)*
3. **Transition animation**: Should the recipe content animate (slide/fade) on navigation, or update instantly? *(Nice-to-have; implementer's call.)*
