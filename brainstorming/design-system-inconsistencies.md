# Design-system inconsistencies checklist

Plain resolve-later checklist, not a plan or spec — per `CLAUDE.md`, content under
`brainstorming/` isn't authoritative and shouldn't be referenced unless a task specifically
points here. Compiled 2026-08-16 while renaming `--gray-*` → `--ink-*`, finishing the
literal-to-token color migration, and authoring the root `DESIGN.md`.

Resolved 2026-08-16 via a 4-member Claude council (Architect/Skeptic/Pragmatist/Researcher,
independent investigations) debating and cross-checking each item against the actual code — the
council caught that several items' premises no longer matched the codebase (noted inline below).
Fixed items are checked off; deferred items keep their original rationale plus why they were left.

- [x] Three unrelated button class-naming schemes exist for the same functional
  primary/secondary/danger button: `modal-btn--*` (`ChapterNameModal.vue`, `ConfirmDialog.vue`,
  `EditCookbookModal.vue`), flat `btn-primary/secondary/danger` (`RecipeEditor.vue`,
  `Settings.vue`), and `btn-new/open/icon` (`Dashboard.vue`, `RecipeLibrary.vue`,
  `ProjectView.vue`). **Deferred** — unanimous council verdict: consolidating onto one shared
  `Button` component is a real component-library effort (8+ files, several inline `style=`
  buttons that a class rename wouldn't even reach), with no `@vue/test-utils` to catch
  regressions. Do this when a behavioral requirement (loading state, icon slots) forces a real
  component, not as a naming pass.

- [x] Button vertical padding drift: `10px 20px` vs `11px 20px`. **Fixed** — snapped every
  `11px 20px` site to `10px 20px` (`Settings.vue` ×3, `DecodeRecipe.vue`, plus the inline
  `btn-primary` in `NotFound.vue`/`RecipeEditor.vue`), matching `DESIGN.md`'s documented value.

- [x] Danger-button chroma drift: `ConfirmDialog.vue`'s `.modal-btn--danger` used
  `oklch(45% 0.18 25)` where the `--color-danger` token is `oklch(45% 0.14 25)`. **Fixed** —
  base now references `var(--color-danger)`; hover snapped to `oklch(38% 0.14 25)` (matching
  `Dashboard.vue`'s `.btn-delete:hover`, the app's existing convention for the hover shade).

- [x] `.btn-secondary` (`RecipeEditor.vue`/`Settings.vue`) uses `background: none` (transparent
  ghost) vs every other secondary/ghost button's filled `var(--ink-93)` background. **Corrected
  and fixed** — the council found the checklist's framing backwards: `modal-btn--ghost`
  (`AboutModal.vue`/`ChapterNameModal.vue`/`ConfirmDialog.vue`/`EditCookbookModal.vue`, despite
  its name) was already filled `ink-93`/border `ink-84`/hover `ink-88`, matching `DESIGN.md`
  exactly. The real outliers were the *transparent* ones: `.btn-secondary` in
  `Settings.vue`/`DecodeRecipe.vue`/`RecipeImport.vue`, and the inline cancel buttons in
  `RecipeEditor.vue`/`RecipeLibrary.vue`/`RecipeImport.vue`. All switched to filled `ink-93` +
  `ink-84` border (hover `ink-88` where a scoped `:hover` rule exists; the two delete-confirm
  inline buttons have no hover state to set since inline `style=` can't express `:hover`).

- [x] Input border-color drift: `Dashboard.vue`'s `.form-input` uses `var(--ink-78)` where every
  other form input/search input in the app uses `var(--ink-84)`. **Fixed, narrowly** — only
  `Dashboard.vue`'s `.form-input` changed. The council flagged that other `--ink-78` hits
  (`DecodeRecipe.vue`/`RecipeImport.vue`/`Dashboard.vue`/`RecipeLibrary.vue`'s dashed
  empty-state borders, `RecipeEditor.vue`'s SVG stroke/fill) are a legitimately different role
  and were left untouched.

- [x] Pill/fully-round radius drift: `99px` (`ChapterCard.vue`'s `.chapter-badge`) vs `999px`
  (`Dashboard.vue`'s `.btn-swatch`). **Fixed** — `ChapterCard.vue` snapped to `999px`, matching
  `DESIGN.md`'s documented target.

- [x] Modal radius drift: the shared `Modal.vue` uses `border-radius: 16px`, but ad hoc
  `.modal-box` clones duplicate its backdrop/shadow/border values by hand at `14px` instead of
  reusing `Modal.vue`. **Corrected and partially fixed** — the checklist's "three clones" claim
  was stale: `RecipeEditor.vue`/`RecipeLibrary.vue` no longer contain a `.modal-box` class (grep
  confirmed). Only `Dashboard.vue` has a real one; its radius is now `16px` to match `Modal.vue`
  and `DESIGN.md`'s `rounded.xl`. **Not done**: refactoring `Dashboard.vue`'s modal onto
  `Modal.vue` itself — that's a focus-trap/Teleport/Escape-key behavior change, not a radius
  tweak, and `RecipePreviewDialog.vue` already has an unscoped `<style>` block reaching into
  `.modal-box`, so this needs its own careful pass with manual keyboard testing, not a bundled
  cosmetic fix.

- [x] Dead token: `--recipe-accent` is set (via inline `:style`) by `RecipeSheet.vue` but never
  consumed by it or any of its `RecipeLayout*.vue` variants. **Fixed by removal** — deleted from
  both the inline `:style` binding and the `<style>` block's fallback declaration. Unanimous
  council verdict: wiring it into the title/section-header rule as originally intended is a
  design decision nobody has made, not implied by "clean up dead code" — left undone
  deliberately. Note: `RecipeSheet.vue`'s `accentColor` prop is now otherwise unconsumed within
  the component (still received from `RecipePreviewDialog.vue`) — left in place rather than
  chasing the whole prop chain, which was out of scope for this pass.

- [x] `#d97742` (terracotta, the default accent) is duplicated as a hex literal in ~9 places
  instead of referencing `ACCENT_COLORS[0].value` from `src/js/templates.js`. **Fixed** —
  exported `DEFAULT_ACCENT_COLOR` from `templates.js`; imported at every JS-reachable site
  (`db.js` ×2, `CoverPage.vue`, `ChapterDividerPage.vue`, `RecipeSheet.vue`,
  `TableOfContentsPage.vue`, `RecipePreviewDialog.vue`, `Dashboard.vue` ×4). Left as literals:
  `tokens.css`'s `--sidebar-accent` (CSS can't import JS, and `DESIGN.md` documents it as
  semantically distinct despite the shared hex) and each component's CSS custom-property
  fallback inside its own `<style>` block (same reason).

- [x] "Elevation is modal-only" — inaccurate claim already corrected in `DESIGN.md`; no code
  change needed, kept here only for the record.

- [x] `App.vue`'s body font stack duplicated `--font-main` with a slightly different, unloaded
  stack. **Fixed** — replaced with `var(--font-main)`.

- [ ] Untokenized one-off heading/body sizes recur often enough to be de facto tokens but aren't
  named anywhere: 18px, 22px, 15px (a muted-subtitle size repeated across ~9 files). **Deferred**
  — council split on the 15px case (two of four suggested a `.text-subtitle`/`.text-subtle`
  utility now) but converged on doing it opportunistically next time one of those views is
  touched, per the checklist's own original recommendation, rather than adding new utilities
  with no migration.

- [ ] Translucent shadow/scrim colors hand-duplicate the `--ink-20`/`--ink-99` hue as
  opaque-looking literals with an alpha channel. **Deferred, with a correction**: the council
  found the literals are actually `oklch(10% 0.01 75 / …)` and `oklch(20% 0.02 75 / …)` — L=10 is
  *not* `--ink-20` (that's `oklch(20% … )`), so the original "hand-duplicating ink-20" framing
  was imprecise; a naive relative-color rewrite based on that framing would have silently
  lightened every shadow. Still blocked on the same decision as before: new semantic tokens
  (`--scrim`, `--shadow-modal`, etc.) vs. relative-color syntax, preserving the as-authored L
  values rather than "correcting" them to the nearest `--ink-*` stop.

- [ ] `RecipeImage.vue`'s `.recipe-image` defaults to `height: 100%`, only overridden to
  `height: auto` for an explicit `imageAspectRatio`, causing a real layout bug (image balloons,
  squeezes out content below it) in 3 legacy templates when `imageAspectRatio` is `'auto'`.
  **Deferred from this pass, unanimous top priority for the next one** — every council member
  flagged this as the only genuine user-facing *bug* on the list, not design debt, and said it
  needs its own session with the app running: the fix requires a real choice between two
  implementations (an `'auto'` entry in `ASPECT_RATIO_CSS` vs. explicit-height wrapper divs) and
  visual verification across all 5 recipe layouts plus a `fitsOnPage` re-check, none of which is
  reviewable from a diff alone. Still tracked in `AGENTS.md`'s Known Issues.
