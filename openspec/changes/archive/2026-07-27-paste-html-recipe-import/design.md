## Context

`RecipeImport.vue` currently has one entry point: `handleFileChange`, which reads each
selected `File` via `file.text()` and calls `parseRecipeImportHtml(text)` (in
`src/js/recipeImport.js`), pushing the result into three refs (`candidates`,
`failures`, `rejectedFiles`) that drive the staged-review template. `parseRecipeImportHtml`
already operates on a plain string with no knowledge of where it came from.

## Goals / Non-Goals

**Goals:**
- Add a second way to get a raw HTML string into the same `parseRecipeImportHtml` call
  and the same staged-review state, without duplicating the per-source processing
  (pushing into `candidates`/`failures`/`rejectedFiles`).
- Keep the existing file-picker path's behavior and code path untouched.

**Non-Goals:**
- No change to `parseRecipeImportHtml` itself — it already takes a string and needs no
  new parameters or behavior for this change.
- No drag-and-drop, no auto-parse-on-paste-event; the paste path is a textarea plus an
  explicit trigger button, mirroring the file path's explicit "select file(s)" trigger.

## Decisions

- **Shared per-source processing helper.** Extract the body of `handleFileChange`'s
  per-file loop (call `parseRecipeImportHtml`, then push into `candidates`/`failures`/
  `rejectedFiles`) into a small function, e.g. `processImportSource(text, sourceLabel)`.
  `handleFileChange` calls it once per selected file with `file.name` as the label;
  the new `handlePasteImport` calls it once with the textarea's value and a fixed label
  (`"Pasted HTML"`). This is the mechanism that satisfies "one code path for validation
  and review, not two" — both entry points differ only in how they obtain `text` and
  `sourceLabel`, not in what happens after.
- **Mode toggle, not two permanently-visible controls.** A two-button toggle
  (`Upload file` / `Paste HTML`) switches which input is shown. Keeps the top of the
  view uncluttered and matches the existing single-purpose "Select Recipe File(s)"
  button's visual weight. Alternative considered: show both the file input and textarea
  simultaneously — rejected as visually busier for no functional benefit, since a user
  only ever uses one path per import.
- **Empty-paste guard lives in the UI, not the parser.** Selecting zero files is
  already a no-op guarded by `if (!files.length) return` in `handleFileChange`. The
  paste path's analogous empty case (trigger clicked with an empty/whitespace textarea)
  is guarded the same way, before `processImportSource` is called, so
  `parseRecipeImportHtml` is never asked to parse an empty string and misreport it as a
  "rejected" file-shaped error.
- **Rejected-source and failure labels generalize from "file" to "source".** The
  existing "Files not recognized" section and its copy
  (`"{{ name }}" doesn't look like a cookbook-maker recipe file...`) is reworded
  slightly so `"Pasted HTML" doesn't look like...` reads naturally too, without
  changing the underlying data shape (`rejectedFiles` stays a flat array of labels).

## Risks / Trade-offs

- Reusing `rejectedFiles`/`failures` label strings for both files and pasted text means
  the UI copy must stay source-agnostic; mitigated by keeping the wording generic
  ("doesn't look like a cookbook-maker recipe import") rather than file-specific.
