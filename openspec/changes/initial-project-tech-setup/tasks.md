## 1. Project Scaffolding & Dependency Setup

- [ ] 1.1 Initialize the NPM project using Vite's Vue template (`npm create vite@latest -- --template vue`) and configure initial project metadata
- [ ] 1.2 Install Vue Router, Pinia, Dexie.js, and `dexie-export-import` as dependencies
- [ ] 1.3 Configure Vite (`vite.config.js`) and set up standard directory structure (`src/css/`, `src/components/`, `src/views/`, `src/stores/`, `src/router/`)

## 2. Global Styling & Main UI Layout Shell

- [ ] 2.1 Create the global token file `src/css/tokens.css` defining core theme custom properties and CSS resets
- [ ] 2.2 Create `index.html` and the root `App.vue`/`main.js` entry point, wiring in the router and Pinia
- [ ] 2.3 Build `App.vue` and a `Sidebar.vue` component to handle the responsive layout and mobile drawer toggle
- [ ] 2.4 Configure Vue Router with routes for Dashboard (`/`), Recipe Library (`/library`, `/library/:recipeId`), Project view (`/projects/:projectId`, `/projects/:projectId/print`), and Settings (`/settings`), and corresponding placeholder view components

## 3. Relational IndexedDB Database Foundation

- [ ] 3.1 Create database initialization utility `src/js/db.js` defining a Dexie instance targeting a local `cookbook_maker_db`
- [ ] 3.2 Define the versioned Dexie schema (`db.version(1).stores({...})`) for recipes, projects, chapters, and project_recipes, including `order` fields on `chapters` and `project_recipes` and an `isDefault` flag on `chapters`
- [ ] 3.3 Implement database CRUD operations using Dexie's promise-based table API, including cascade-aware `deleteProject()` and `deleteRecipe()` implemented as atomic Dexie transactions (removes the project's chapters/project_recipes rows while preserving global recipes; removes a recipe's project_recipes associations across all projects)
- [ ] 3.4 Implement database seeding logic (e.g. via Dexie's `db.on('populate', ...)` hook) to write a default project and sample recipe if the database is newly initialized, seeding the "Miscellaneous" chapter with `isDefault: true`

## 4. Pinia Store Layer

- [ ] 4.1 Create `useRecipesStore` and `useProjectsStore` Pinia stores that load data via `db.js` and hold it as reactive state
- [ ] 4.2 Implement store actions for reads/writes (create/update recipe, create/update project, chapter/recipe association changes, `deleteProject`/`deleteRecipe`) that call `db.js` for persistence and update reactive state on success, so all mounted views observing the same store stay in sync
- [ ] 4.3 Wire view/placeholder components (from task 2.4) to read from the stores instead of calling `db.js` directly

## 5. Backup & Restore Operations

- [ ] 5.1 Integrate `dexie-export-import` and implement the export function (`exportDB()`) to produce a downloadable backup file from the current database
- [ ] 5.2 Implement the import function (`importDB()`) that surfaces a clear error and leaves existing data untouched if the file is invalid, otherwise replaces the database contents and refreshes Pinia store state afterward
- [ ] 5.3 Add interactive Export and Import controls within the Settings view to invoke the backup/restore operations, including a progress indicator driven by the addon's progress callback
