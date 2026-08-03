# DIY Cookbook Creator

DIY Cookbook Creator — a local-first, browser-based web app that lets a home cook
build a personal recipe library and assemble curated recipes into printable,
book-style cookbooks (physical gift books, PDFs). All data lives on the user's
device (no accounts, no login, no cloud sync) — it must work fully offline once
loaded, and every action should feel instant with no server round-trips.

## Core concepts

- **Recipe**: a single master record with a Title (required), Instructions/Steps
  (required), a structured list of Ingredients, optional Chef's Notes (supports
  basic bold/italic emphasis), and an optional single photo. Recipes live in one
  Global Recipe Library shared across every cookbook.
- **Cookbook (Project)**: a named collection (Title, optional Subtitle, Author name)
  that curates a subset of recipes from the Global Library and organizes them
  into Chapters for print output. Deleting a cookbook never deletes recipes from
  the Global Library.
- **Chapter**: a named grouping of recipes within one cookbook, in user-defined
  order. Every cookbook has a permanent, undeletable "Miscellaneous" catch-all
  chapter for recipes that aren't otherwise sorted; it's silently omitted from
  the compiled book/table of contents when empty.

## Screens & flows to design

### 1. Cookbook Dashboard (home)
- Grid/list of the user's cookbooks, each showing its title, subtitle, and a
  visual indicator of its chosen accent color.
- Create a new cookbook from a single title field.
- Delete a cookbook (with confirmation, since it's destructive to the
  cookbook itself even though recipes are preserved elsewhere).
- Empty state when no cookbooks exist yet.

### 2. Global Recipe Library
- Searchable list/grid of every recipe the user owns, real-time filtering by
  title or ingredient text as they type.
- Actions to create a new recipe manually, or start a bulk "Import Recipes"
  flow.
- Each recipe entry supports permanent deletion from the library (which
  removes it from every cookbook that references it).

### 3. Recipe Import (bulk, LLM-assisted)
- Two ways to bring in recipe content: uploading a file, or pasting text
  directly into a text box, both leading to the same review step.
- Because recipes are transcribed externally by an LLM into a required
  structured format, the screen should surface a short explanation/help
  section a user can expand, with a copyable prompt/instructions block.
- Before anything is saved, show a staged review: each successfully parsed
  recipe rendered as a preview card with an include/exclude checkbox
  (checked by default), plus a separate list of items that failed to parse
  with a human-readable reason for each. Only checked recipes get committed
  when the user confirms.
- Clear error state when nothing recognizable was found in the file/paste.

### 4. Recipe Detail / View
- Read-focused presentation of one recipe: title, ingredients (each shown in
  dual-unit form, e.g. a US measurement with a metric equivalent alongside
  it), instructions, chef's notes, and photo if present.
- Entry point to edit the recipe, and to export/print just this one recipe.

### 5. Recipe Editor
- Form fields: Title, Ingredients (a free-text multi-line box where each line
  is parsed live into quantity/unit/ingredient-name as the user types),
  Instructions/Steps, optional Chef's Notes (with simple bold/italic
  formatting controls), optional single photo upload.
- A layout-template picker that changes how the recipe will be visually
  printed without altering any of the underlying data — switching templates
  should not lose or reformat content.
- Validation for the two required fields (title, instructions).

### 6. Cookbook / Project workspace
- Edit cookbook metadata: title, subtitle, author.
- Choose an accent color (from a curated set) and a cover layout template
  for the book; these affect the cover, table-of-contents headers, and
  chapter divider pages.
- Toggle page numbers on/off for the whole book (turning them off also
  removes the table of contents entirely from the compiled output).
- Manage chapters: create, rename, delete (flat list only, no nesting);
  deleting a chapter reassigns its recipes to "Miscellaneous" rather than
  deleting them.
- Browse/search the Global Library and add recipes into this cookbook (new
  additions default into "Miscellaneous"); remove a recipe from the
  cookbook without deleting it from the Global Library.
- Reorder chapters, and reorder recipes within a chapter.

### 7. Compiled Book Preview / Print & Export
- A full compiled preview showing, in order: Title Page, Table of Contents
  (only if page numbers are enabled), then each Chapter as a divider page
  followed by its recipes in sequence — every recipe occupying exactly one
  printed page, with content never spilling across a page break.
- A single action that hands off to the browser's native print dialog for
  producing a PDF/hard copy.
- A parallel single-recipe export/print path matching the parent cookbook's
  visual styling but without page numbers, title page, or TOC.

### 8. Settings
- "Backup Data": download one self-contained file containing every
  cookbook, recipe, and image, portable to another device/browser.
- "Restore Data": upload a previously downloaded backup file to fully
  recover cookbooks, recipes, chapters, and images; a bad/corrupt file must
  fail safely, leaving existing data untouched, with a clear error.

## Cross-cutting requirements

- Must be fully usable on both small mobile screens and desktop widths — design
  for responsive layouts throughout, not just desktop.
- Any edit made to a recipe from anywhere in the app must be reflected
  everywhere else that recipe appears (it's one shared master record).
- The on-screen editing/browsing experience and the print/export output are two
  distinct visual contexts — the print output should be a clean, book-like
  page layout while the app's working UI should optimize for fast editing and
  navigation between many recipes/cookbooks.
- Destructive actions (deleting a cookbook, deleting a recipe from the library,
  deleting a chapter, restoring a backup) should make their consequences clear
  before the user commits.
