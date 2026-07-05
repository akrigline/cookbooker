## Context

The DIY Cookbook Creator is an offline-first, client-only web application that requires a solid local-storage database layer and project structure before implementing user-facing capabilities. This document outlines the initial technical setup, directory layout, library choice, and IndexedDB management architecture.

## Goals / Non-Goals

**Goals:**
- Set up a lightweight, fast, local development environment using Vite + Vue 3 (Composition API).
- Establish a Pinia store layer so shared data (recipes referenced from multiple projects) stays in sync across every view without manual re-render bookkeeping.
- Design a structured, relational-like IndexedDB helper wrapper module (`db.js`) to support recipes, projects, chapters, and recipe association management.
- Provide automatic seeding of a default cookbook project and sample recipe when the database is empty.
- Build a database backup and restore utility (Export/Import) using Dexie's export/import tooling, preserving relational integrity and Blob fields natively.
- Establish a global CSS custom-property token foundation (`tokens.css`) plus component-scoped styles for typography, layout, and color theming.
- Render a responsive navigation shell UI, routed with Vue Router, that allows switching panels without full page refreshes.

**Non-Goals:**
- Setup of build pipelines for cloud-syncing, server-side data, or external API integration.
- Implementing the actual recipe parsing logic, unit conversions, or layout printing engines (these belong to future change scopes).

## Decisions

### Decision 1: Vite + Vue 3 (Composition API)
We will initialize the application using Vite's Vue template, building the UI with Vue 3 single-file components (`.vue`) and the Composition API.
- **Alternative Considered:** Vanilla JavaScript with hand-rolled DOM manipulation (original plan).
- **Alternative Considered:** Svelte.
- **Alternative Considered:** Next.js or React.
- **Rationale:** The product's core requirement that editing a recipe propagates live to every project/chapter view showing it needs a real reactivity model, not manual DOM patching from every mutation site. Vue's `ref`/`reactive` primitives, paired with the Pinia store in Decision 3, solve this directly. The navigation needs identified during design (deep-linkable recipes/projects, a dedicated print route) are well served by the mature, official Vue Router (Decision 7). Vue was chosen over Svelte for its larger ecosystem and community/documentation depth, which matters more for a solo-maintained project than Svelte's smaller compiled output. React/Next were rejected for the same reason as before: there is no server or SSR need, and React's ceremony (hooks, dependency arrays, memoization) is unwarranted overhead at this app's scale.

### Decision 2: Dexie.js IndexedDB Wrapper (`db.js`)
We will use Dexie.js to define and query the IndexedDB schema in `src/js/db.js`, rather than hand-writing a wrapper around the native `indexedDB` API.
- **Alternative Considered:** A raw, hand-written wrapper around the native `indexedDB` API (original plan).
- **Alternative Considered:** `localForage` (simpler key-value abstraction; lacks the indexed/filtered queries `project_recipes` lookups need).
- **Rationale:** The native IndexedDB API is event-based with no built-in promises, and has real footguns (transactions silently auto-committing if a non-IDB `await` happens inside them, manual cursor loops for filtered deletes). Design review already caught two concrete bugs in exactly this territory (import validation ordering, ID preservation on restore) — evidence that hand-rolling this layer is a real risk, not a theoretical one. Dexie gives a promise-based API, declarative versioned schema definition, and filtered bulk operations (`where(...).delete()`) with transaction helpers that make multi-store operations like cascade deletes atomic. The "zero dependency" rationale that originally justified hand-rolling no longer holds now that Vue, Vue Router, and Pinia are already dependencies (Decisions 1 and 3).
- **Schema & Store Definitions (Dexie schema syntax):**
  - Database name: `cookbook_maker_db` (version `1`)
  - `recipes`: `++id`
  - `projects`: `++id`
  - `chapters`: `++id, projectId` — record fields include `order` (integer, chapter sequence within the project) and `isDefault` (boolean, marks the protected "Miscellaneous" chapter)
  - `project_recipes`: `++id, projectId, recipeId, chapterId` — record fields include `order` (integer, recipe sequence within its chapter)
  - **Rationale for `order`/`isDefault` now:** unchanged from the earlier review — `book_organization.md` requires both chapter and recipe-within-chapter sequencing as core v1 behavior, and requires the "Miscellaneous" chapter to be non-deletable and recoverable-into. Adding these fields at initial schema definition avoids a version-upgrade migration later; `isDefault` avoids fragile string-matching against the chapter name.
- **Cascade-aware deletion:** `db.js` will expose `deleteProject()` and `deleteRecipe()` helpers, implemented as atomic Dexie transactions (`db.transaction('rw', ...)`) so a cascade either fully succeeds or fully rolls back — a correctness guarantee a hand-rolled cursor-loop version would not automatically have:
  - `deleteProject(id)` removes the project plus its `chapters` and `project_recipes` rows (`where('projectId').equals(id).delete()`), but never touches `recipes` (the global library must survive project deletion).
  - `deleteRecipe(id)` removes the recipe plus all of its `project_recipes` associations across every project.

### Decision 3: Pinia Reactive Store Layer
We will introduce a Pinia store layer (e.g. `useRecipesStore`, `useProjectsStore`) sitting between Vue components and `db.js`. Components read and mutate data exclusively through store state/actions, never by calling `db.js` directly or fetching into their own local component state.
- **Alternative Considered:** Hand-rolled `reactive()` singleton modules (no extra dependency).
- **Alternative Considered:** Each component independently calling `db.js` and holding its own local copy of the data.
- **Rationale:** Vue's reactivity only auto-updates consumers that share the *same* reactive reference — two components each independently fetching the same recipe into separate local `ref`s would go stale exactly like the manual DOM-patching problem this Vue pivot was meant to solve. A single shared store is what actually delivers the "editing a recipe updates it everywhere" requirement from `book_organization.md`; choosing Vue alone does not. Pinia was chosen over a hand-rolled reactive module — unusually, for this project's normal "hand-roll unless justified" pattern — because the payoff here (correctly propagating shared master-recipe edits) is a functional correctness requirement, not a nice-to-have, and Pinia's Devtools integration and now-idiomatic conventions make that correctness easier to verify.
- **Store responsibility split:** Store actions call `db.js` for persistence and update the store's reactive state on success, so IndexedDB and in-memory state never drift apart. `db.js` itself remains framework-agnostic (plain functions, no Vue import), keeping the persistence layer testable independently of the UI.

### Decision 4: Database Seeding on DB Initialization
We will implement automatic seeding of a default project and a sample recipe when the IndexedDB database version upgrades or initializes for the first time.
- **Alternative Considered:** Prompt the user to create their first project manually.
- **Rationale:** Seeding default records provides immediate visual feedback, makes the UI functional on first launch, and validates that database reads are working immediately without requiring form completion.
- **Seeded Objects:**
  - A project named "My First Cookbook"
  - A chapter named "Miscellaneous" (the required project fallback), seeded with `isDefault: true`
  - A recipe titled "Classic Pancake Recipe"
  - A relational record mapping the pancake recipe into the project's "Miscellaneous" chapter, with `order: 0`.

### Decision 5: Backup & Restore via `dexie-export-import`
We will use Dexie's official `dexie-export-import` addon to implement backup (export) and restore (import), rather than hand-writing JSON serialization and Blob/Base64 conversion.
- **Alternative Considered:** Hand-written JSON export/import with a custom envelope and manual Blob↔Base64 conversion (original plan).
- **Alternative Considered:** Exporting separate CSV files per table.
- **Rationale:** `dexie-export-import` is a maintained, tested addon purpose-built for this exact problem: it natively supports Blob-valued fields (no manual Base64 round-tripping in application code), preserves primary keys and relations correctly on restore, and understands Dexie's schema/versioning. Adopting it directly replaces the two riskiest bugs found in the original hand-written design — validating before any destructive write, and preserving original ids so `project_recipes` foreign keys don't dangle — with logic the Dexie project already tests, rather than re-implementing and re-debugging both ourselves.
- **Format:** Export produces the addon's native export file (a self-contained Blob/JSON bundle including binary data), downloaded from the Settings view as a `.json` file. Import uses the addon's import flow to fully replace existing data (no partial-merge import is needed for this app).
- **Import safety:** The addon parses and validates the input as part of import; the application must still catch a failed import, surface a clear error to the user, and confirm existing data is untouched before treating the operation as failed — the "don't destroy data on a bad file" requirement stands regardless of which layer performs the validation.

### Decision 6: Component-Scoped Styles (Vue SFC) + Global CSS Custom Property Tokens
We will split styling into a global `src/css/tokens.css` (plain, unscoped CSS custom properties for colors, spacing, typography, and dark-mode overrides) plus a `<style scoped>` block inside each `.vue` component.
- **Alternative Considered:** A single global `index.css` file for all styling (original plan; would not scale past the initial handful of views).
- **Alternative Considered:** CSS Modules (moot once Vue SFCs were adopted — `<style scoped>` gives the same collision-safe scoping natively, with no separate build step and no `styles.className` indirection; class names are written directly in the `<template>` block).
- **Alternative Considered:** TailwindCSS.
- **Rationale:** Custom properties must stay global/unscoped because dynamic per-project theming works by setting `element.style.setProperty('--accent-color', color)` on a container and relying on cascade — scoping would break that. Component-level layout/structural styles, on the other hand, benefit from scoping to avoid collisions as the number of views grows (Dashboard, Library, Recipe editor, Settings, chapter dividers, print templates). Vue's built-in `<style scoped>` gives both without adding a dependency: components freely read the global tokens via `var(--accent-color)` inside their scoped rules.

### Decision 7: Vue Router Navigation
We will use Vue Router (official) to drive navigation, with routes for the top-level views and the deep-linkable entities identified during design:
  - `/` — Dashboard (project list)
  - `/library` — Recipe Library
  - `/library/:recipeId` — Recipe detail/editor
  - `/projects/:projectId` — Project view (chapters, sequencing)
  - `/projects/:projectId/print` — Print preview/export (opened in its own tab so print output is free of app chrome)
  - `/settings` — Settings
- **Alternative Considered:** Hand-rolled History API router (viable, but Vue Router is the standard pairing with Vue and effectively already a dependency once Vue was chosen).
- **Alternative Considered:** DOM-visibility toggling with no URL state (original plan; breaks browser back/forward and reload-to-same-view, and gives recipes/projects no addressable identity).
- **Rationale:** Recipes and projects are real entities with IndexedDB identity that users need to reload, bookmark, or navigate back to directly — a container-visibility toggle has no way to represent "which recipe" survives a refresh. A dedicated print route also lets the print preview render as a clean, chrome-free document rather than fighting `@media print` overrides against the live app shell.

## Risks / Trade-offs

- **IndexedDB Volatility:** Browser storage can sometimes be wiped if the user clears history/site data.
  - *Mitigation:* Implement a prominent "Backup/Restore" utility that compiles all tables and images (as Base64) into a downloadable `.json` file.
- **Export/Import Performance:** Serializing large or numerous image Blobs is delegated to `dexie-export-import`, which is written to handle this more efficiently than a naive Base64/JSON round-trip, but very large libraries could still take noticeable time.
  - *Mitigation:* The addon exposes progress callbacks; surface these as a progress loader in the Settings view during exports and imports.
- **Data-Loss on Restore:** A corrupt or invalid backup file must never be allowed to destroy existing data mid-import.
  - *Mitigation:* Treat any failure from the import addon as a hard stop — surface an error and confirm existing IndexedDB data is untouched — rather than assuming partial success per Decision 5.
