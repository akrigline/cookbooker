# Follow-on: wire the persistence-layer errors into the UI

Your DB-layer pass is landed and verified — I mutation-tested the `removeChapter`
regression (reverting the old implementation fails exactly that test) and probed
`updateOrThrow` against Dexie directly (`update()` returns 1 for identical values
and empty changes, 0 only for a missing row, so the helper is correct). The three
incidental finds were all real. No need to revisit any of that.

This is the consumer-side half, which was outside the DB brief: `updateOrThrow`
and the swap helpers introduced a rejection path where there previously wasn't
one, and nothing in the view layer consumes it yet. Two pieces of work.

## 1. Catch `RecordNotFoundError` where it can surface

`RecordNotFoundError`'s docstring promises callers can catch it "to tell the user
their change was not persisted." Right now no caller does — every consumer is
`try`/`finally` with no `catch`, or a floating promise. For the modal flows this
is a regression in UX: `modal.type = null` is skipped on throw, so the dialog
hangs open with no message while an unhandled rejection goes to the console.
Previously the write silently no-op'd and the modal closed claiming success.
Neither is right; the dialog should close or explain itself.

Call sites (line numbers as of the current tree — the patterns matter more):

- Floating, not awaited: `ProjectView.vue:242` (`updateField`), and the inline
  `@click="projectsStore.reorderChapter(...)"` handlers at `:702` and `:710`.
- `await` in an async handler, no catch: `onChapterDrop:453`,
  `onRecipeDrop:516,544,548`, `moveRecipeToChapter:304`, `sortChapterAZ:317`,
  `bulkMoveToChapter:331`.
- `try`/`finally` with no `catch`: `confirmDeleteChapter:217`,
  `saveEditCookbook:229`, `submitChapterName:251`, `confirmRemoveRecipe:289`,
  `confirmBulkRemove:350`, plus `Dashboard.vue:151` and `:174`.

`RecipeEditor.save()` is the shape to copy — it already does this correctly.

Two things worth deciding rather than assuming: whether a stale-row error should
close the modal with an error banner or keep it open with an inline message, and
whether `ProjectView` wants one shared error surface (it already has `announce()`
and a live region) instead of per-handler handling. Pick one and apply it
consistently; say which you picked and why.

## 2. The four `Promise.all` batches over now-throwing writes

`moveProjectRecipe` could not reject before this change. Four call sites fan it
out over `Promise.all`, so one stale row now rejects the whole batch after some
writes have already committed — no rollback, no message:

- `sortChapterAZ:317-319`  ← worst case: rewrites every sequence in the chapter,
  so a partial failure leaves it half-sorted
- `bulkMoveToChapter:331-335`
- `submitChapterName:269-271` (newFromLibrary)
- `libBulkAddToChapter:396-398`

This is the same defect your `swapSequences` work removed for two-row swaps, just
at N-row scale. Preference is to push each batch into `db.js` as a single
transaction returning the persisted values, matching `swapChapterSequences` —
`sortChapterAZ` in particular is naturally one transactional "reassign all
sequences in this chapter" call. If any batch doesn't fit that shape, sequential
writes with a partial-failure report is an acceptable fallback; don't leave a
bare `Promise.all` over writes that can reject.

## 3. Minor, while you're in these files

- The progress indicator works now, which exposes that it runs twice:
  `restoreDatabase` passes the same callback to the snapshot (`backup.js:53`) and
  the import (`:59`), so the counter climbs to N, resets to 0, climbs to M. Needs
  a phase label ("Backing up current data…" / "Restoring…").
- `onRecipeDrop:517` announces `"X" added to chapter.` on the duplicate-reconcile
  path, where the recipe stayed in its original chapter. Unreachable through the
  UI (`availableRecipes` filters in-project recipes) but the wording is wrong.
- `deleteChapter:181` returns `{ reassigned: [] }` for a missing chapter instead
  of throwing `RecordNotFoundError`, inconsistent with the four `updateOrThrow`
  sites. Your call whether to align it.

## Constraints

- `npm test` and `npm run build` must stay green (currently 103 tests / 14 files).
- `@vue/test-utils` is not installed, so none of this is coverable by component
  tests today. Don't add the dependency as a side effect of this task — if you
  think it's warranted, raise it separately. Store-level tests can cover the
  batch-transaction work in `db.js`/`stores` even though the handlers can't be
  mounted.
- Flag anything you find that contradicts the above; the line numbers came from a
  read of the current tree and the reasoning may not survive contact with the code.
