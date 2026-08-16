# Design-system inconsistencies checklist

Plain resolve-later checklist, not a plan or spec — per `CLAUDE.md`, content under
`brainstorming/` isn't authoritative and shouldn't be referenced unless a task specifically
points here. Compiled 2026-08-16 while renaming `--gray-*` → `--ink-*`, finishing the
literal-to-token color migration, and authoring the root `DESIGN.md`. Each item is a real,
currently-shipped inconsistency found by inventorying the actual CSS across the app — none of
these are fixed by that work; they're logged here for a future cleanup pass.

- [ ] Three unrelated button class-naming schemes exist for the same functional
  primary/secondary/danger button: `modal-btn--*` (`ChapterNameModal.vue`, `ConfirmDialog.vue`,
  `EditCookbookModal.vue`), flat `btn-primary/secondary/danger` (`RecipeEditor.vue`,
  `Settings.vue`), and `btn-new/open/icon` (`Dashboard.vue`, `RecipeLibrary.vue`,
  `ProjectView.vue`). Recommendation: consolidate onto one shared `Button`-style
  component/class set once a component library is worth introducing.

- [ ] Button vertical padding drift: `10px 20px` (`modal-btn`/`.btn-cancel`/`.btn-submit`/
  `.btn-delete`) vs `11px 20px` (`RecipeEditor.vue`/`Settings.vue`'s
  `.btn-primary/secondary/danger`). Recommendation: standardize on `10px 20px`, the more common
  value.

- [ ] Danger-button chroma drift: `ConfirmDialog.vue`'s `.modal-btn--danger` uses
  `oklch(45% 0.18 25)` where every other danger button uses `var(--color-danger)`
  (`oklch(45% 0.14 25)`). Recommendation: snap to the token — the chroma difference is subtle and
  this looks like independent drift, not a deliberate choice.

- [ ] `.btn-secondary` (`RecipeEditor.vue`/`Settings.vue`) uses `background: none` (transparent
  ghost) vs every other secondary/ghost button's filled `var(--ink-93)` background.
  Recommendation: decide which is the intended ghost-button treatment and align the other.

- [ ] Input border-color drift: `Dashboard.vue`'s `.form-input` uses `var(--ink-78)` where every
  other form input/search input in the app uses `var(--ink-84)`. Recommendation: snap to
  `--ink-84` unless there's a reason `Dashboard.vue`'s form specifically needs a darker border.

- [ ] Pill/fully-round radius drift: `99px` (`ChapterCard.vue`'s `.chapter-badge`) vs `999px`
  (`Dashboard.vue`'s `.btn-swatch`) for the same "fully round" intent. Both render identically at
  these sizes; `DESIGN.md` documents `999px` as the target — recommend updating
  `ChapterCard.vue` to match.

- [ ] Modal radius drift: the shared `Modal.vue` uses `border-radius: 16px`, but three ad hoc
  inline `.modal-box` clones (`Dashboard.vue`'s modal, `RecipeEditor.vue`'s delete-confirm,
  `RecipeLibrary.vue`'s delete-confirm) duplicate its backdrop/shadow/border values by hand at
  `14px` instead of reusing the `Modal.vue` component. Recommendation: refactor those three call
  sites onto `Modal.vue` directly rather than hand-duplicating its styles — fixes both the radius
  drift and the duplication.

- [ ] "Elevation is modal-only" was an inaccurate claim in an earlier draft design doc — shadows
  also legitimately appear on `ChapterCard.vue`'s overflow-menu popover, the docked
  `BulkActionBar.vue`/`LibrarySidebarPanel.vue`, `PagePreview.vue`'s page thumbnail, and
  `RecipeImport.vue`'s candidate cards. `DESIGN.md` now states the corrected rule (elevation for
  floating/overlaid or permanently-docked surfaces, not static cards/buttons) — no code change
  needed, listed here only so the correction's rationale isn't lost.

- [ ] Dead token: `--recipe-accent` is set (via inline `:style`) by `RecipeSheet.vue` but never
  consumed by it or any of its `RecipeLayout*.vue` variants — no visible effect today.
  Recommendation: either wire it into the recipe title/section-header rule as originally intended,
  or remove it.

- [ ] `#d97742` (terracotta, the default accent) is duplicated as a hex literal in ~9 places
  (component prop defaults in `CoverPage.vue`/`ChapterDividerPage.vue`/`RecipeSheet.vue`/
  `TableOfContentsPage.vue`/`RecipePreviewDialog.vue`, the `db.js` default project shape, and
  `Dashboard.vue`'s decorative-card fallback) instead of referencing `ACCENT_COLORS[0].value`
  from `src/js/templates.js` in one place. Recommendation: export a named constant from
  `templates.js` (e.g. `DEFAULT_ACCENT_COLOR`) and import it at each site.

- [ ] `App.vue`'s body font stack (`-apple-system,BlinkMacSystemFont,'Helvetica Neue',Helvetica,
  Arial,sans-serif`) duplicates `--font-main` (`system-ui, -apple-system, "Segoe UI", sans-serif`)
  with a slightly different, unloaded stack. Recommendation: replace with `var(--font-main)`.

- [ ] Untokenized one-off heading/body sizes recur often enough to be de facto tokens but aren't
  named anywhere: 18px (`ChapterCard.vue`'s card title, between `.text-h2`'s 20px and
  `.text-item-title`'s 19px), 22px (`Dashboard.vue`/`RecipeLibrary.vue` empty-state headers), and
  15px (a muted-subtitle size repeated across ~9 files — `Dashboard.vue`, `RecipeLibrary.vue`,
  `DecodeRecipe.vue`, `ProjectView.vue`, `RecipeEditor.vue`, `RecipeImport.vue`, `NotFound.vue`).
  Recommendation: formalize whichever of these are still in use as new `.text-*` utility classes
  in `tokens.css` next time one of these views is touched, rather than adding a new one-off size.

- [ ] Translucent shadow/scrim colors (`Modal.vue`, `ChapterCard.vue`'s popover,
  `BulkActionBar.vue`, `LibrarySidebarPanel.vue`, `Dashboard.vue`/`RecipeLibrary.vue`/
  `RecipeEditor.vue`'s modal backdrops) hand-duplicate the `--ink-20`/`--ink-99` hue
  (`oklch(10-20% 0.01-0.02 75 / alpha%)`) as opaque-looking literals with an alpha channel, since
  none of the `--ink-*` tokens carry transparency. Not migrated as part of the token-literal pass
  because forcing them onto an opaque token isn't a real "snap" — it would need either new
  alpha-aware tokens or CSS relative-color syntax (`oklch(from var(--ink-20) l c h / 22%)`).
  Recommendation: if/when relative-color syntax is adopted elsewhere in the app, revisit this
  family together.

- [ ] `RecipeImage.vue`'s `.recipe-image` defaults to `height: 100%` and only resolves to
  `height: auto` for an explicit `imageAspectRatio`, so a lone image in a column-flex container
  with `imageAspectRatio: 'auto'` balloons and squeezes out content below it. Already logged in
  `AGENTS.md`'s Known Issues — cross-referenced here rather than duplicated, since it's the same
  class of "component styling didn't get the full sweep a design pass implies" issue as the rest
  of this list.
