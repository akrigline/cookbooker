## 1. Project Scaffolding & Dependency Setup

- [x] 1.1 Initialize the NPM project using Vite's Vue template (`npm create vite@latest -- --template vue`) and configure initial project metadata
- [x] 1.2 Install Vue Router, Pinia, Dexie.js, and `dexie-export-import` as dependencies
- [x] 1.3 Configure Vite (`vite.config.js`) and set up standard directory structure (`src/css/`, `src/components/`, `src/views/`, `src/stores/`, `src/router/`)

## 2. Global Styling & Main UI Layout Shell

- [x] 2.1 Create the global token file `src/css/tokens.css` defining core theme custom properties and CSS resets
- [x] 2.2 Create `index.html` and the root `App.vue`/`main.js` entry point, wiring in the router and Pinia
- [x] 2.3 Build `App.vue` and a `Sidebar.vue` component to handle the responsive layout and mobile drawer toggle
- [x] 2.4 Configure Vue Router with routes for Dashboard (`/`), Recipe Library (`/library`, `/library/:recipeId`), Project view (`/projects/:projectId`, `/projects/:projectId/print`), and Settings (`/settings`), and corresponding placeholder view components

## 3. Relational IndexedDB Database Foundation

- [x] 3.1 Create database initialization utility `src/js/db.js` defining a Dexie instance targeting a local `cookbook_maker_db`
- [x] 3.2 Define the versioned Dexie schema (`db.version(1).stores({...})`) for recipes, projects, chapters, and project_recipes, including `order` fields on `chapters` and `project_recipes` and an `isDefault` flag on `chapters`
- [x] 3.3 Implement database CRUD operations using Dexie's promise-based table API, including cascade-aware `deleteProject()` and `deleteRecipe()` implemented as atomic Dexie transactions (removes the project's chapters/project_recipes rows while preserving global recipes; removes a recipe's project_recipes associations across all projects)
- [x] 3.4 Implement database seeding logic (e.g. via Dexie's `db.on('populate', ...)` hook) to write a default project and sample recipe if the database is newly initialized, seeding the "Miscellaneous" chapter with `isDefault: true`

## 4. Pinia Store Layer

- [x] 4.1 Create `useRecipesStore` and `useProjectsStore` Pinia stores that load data via `db.js` and hold it as reactive state
- [x] 4.2 Implement store actions for reads/writes (create/update recipe, create/update project, chapter/recipe association changes, `deleteProject`/`deleteRecipe`) that call `db.js` for persistence and update reactive state on success, so all mounted views observing the same store stay in sync
- [x] 4.3 Wire view/placeholder components (from task 2.4) to read from the stores instead of calling `db.js` directly

## 5. Backup & Restore Operations

- [x] 5.1 Integrate `dexie-export-import` and implement the export function (`exportDB()`) to produce a downloadable backup file from the current database
- [x] 5.2 Implement the import function (`importDB()`) that surfaces a clear error and leaves existing data untouched if the file is invalid, otherwise replaces the database contents and refreshes Pinia store state afterward
- [x] 5.3 Add interactive Export and Import controls within the Settings view to invoke the backup/restore operations, including a progress indicator driven by the addon's progress callback
