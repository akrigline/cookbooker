## 1. Design Decision

- [x] 1.1 Evaluate the current `RecipePreviewDialog.vue` component (width, keyboard handling, scroll behavior) and decide on UI shape: extend the existing dialog, introduce a slide-out panel/drawer, or use a dedicated preview route — document the decision in a brief comment or PR description before coding begins.

  **Decision: extend the existing dialog.** `RecipePreviewDialog.vue` is a read-only `Modal` with no
  focusable/selectable inputs beyond the Edit/Close buttons, so the "arrow keys conflict with text
  selection" risk from `design.md` doesn't apply here. Its width is already `fit-content` up to
  `calc(100vw - 48px)`, with plenty of room in the header for two small nav buttons next to the
  existing Edit/Close actions. This keeps the change minimal scope with no routing changes, matching
  the proposal's stated preference. A slide-out panel or dedicated route remains available as a
  future enhancement if the dialog ever feels cramped.

## 2. Navigation State in Parent View

- [x] 2.1 In `ProjectView.vue` (or the component that opens the preview), identify where the ordered chapter recipe list is derived and add a reactive `previewIndex` tracking which recipe is currently shown.
- [x] 2.2 Pass the chapter's ordered `recipes` array and `currentIndex` as props into the preview component (replacing or augmenting the single `recipe` prop).
- [x] 2.3 Wire a `navigate(delta)` event handler in `ProjectView.vue` that increments/decrements `previewIndex` and updates the displayed recipe.

## 3. Prev/Next Controls in Preview Component

- [x] 3.1 Add Previous and Next button elements to the recipe preview component's template with appropriate icons (e.g., chevron-left / chevron-right).
- [x] 3.2 Disable (or hide) the Previous button when `currentIndex === 0`; disable the Next button when `currentIndex === recipes.length - 1`.
- [x] 3.3 Emit a `navigate(-1)` event on Previous click and `navigate(+1)` on Next click.
- [x] 3.4 Style the controls so they are visually obvious but do not obscure the recipe content (position alongside title or at the bottom of the preview).

## 4. Keyboard Navigation

- [x] 4.1 In the preview component, attach a `keydown` handler on `mounted`/dialog-open that listens for `ArrowLeft` and `ArrowRight`.
- [x] 4.2 Gate the handler so it does not fire when `event.target` matches `input, textarea, [contenteditable]`, to avoid conflicts with any focusable elements inside the preview.
- [x] 4.3 On `ArrowRight`, emit `navigate(+1)` if not at the last recipe; on `ArrowLeft`, emit `navigate(-1)` if not at the first recipe.
- [x] 4.4 Remove the `keydown` handler on `unmounted`/dialog-close to prevent leaking listeners.

## 5. Spec Sync

- [x] 5.1 Run `openspec sync --change "cookbook-recipe-preview-navigation"` (or apply via `/opsx:apply`) to merge the delta spec into `openspec/specs/recipe-preview/spec.md`. (No `sync` subcommand in the installed CLI version; applied the delta by hand and validated with `openspec validate --specs recipe-preview`.)
- [x] 5.2 Verify the merged spec reflects both the original three scenarios and the five new navigation scenarios.

## 6. Verification

- [x] 6.1 Manually open the cookbook project view, click a recipe in the middle of a chapter, and confirm Prev/Next buttons appear and navigate correctly.
- [x] 6.2 Confirm Prev is disabled on the first recipe and Next is disabled on the last recipe in the chapter.
- [x] 6.3 Confirm `ArrowLeft`/`ArrowRight` keyboard navigation works when the preview is open.
- [x] 6.4 Confirm that pressing an arrow key while a text input inside the preview is focused does NOT trigger navigation.
- [x] 6.5 Run `npm test` and confirm all existing tests pass (no regressions).
