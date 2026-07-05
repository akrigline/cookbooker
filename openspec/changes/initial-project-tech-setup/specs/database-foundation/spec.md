## ADDED Requirements

### Requirement: IndexedDB Database Schema Initialization
The system SHALL initialize a local IndexedDB database named `cookbook_maker_db`, defined via Dexie.js, containing four relational tables: `recipes` (auto-increment key `id`), `projects` (auto-increment key `id`), `chapters` (auto-increment key `id`, indexed on `projectId`, with an `order` field for chapter sequencing and an `isDefault` boolean marking the protected "Miscellaneous" chapter), and `project_recipes` (auto-increment key `id`, indexed on `projectId`, `recipeId`, and `chapterId`, with an `order` field for recipe sequencing within a chapter).

#### Scenario: Database schema upgrade
- **WHEN** the application starts for the first time
- **THEN** it triggers Dexie's versioned schema initialization, creating all four required tables with their respective indices, key paths, and ordering/default-marker fields.

### Requirement: Database Seeding on Initialization
If the database is empty upon initialization, the system SHALL seed a default project ("My First Cookbook"), a default chapter ("Miscellaneous", with `isDefault: true`), and one sample recipe.

#### Scenario: First application launch seeds defaults
- **WHEN** the IndexedDB is newly created
- **THEN** it automatically seeds the database with a default project and sample recipe records, marking the seeded "Miscellaneous" chapter as `isDefault: true`.

### Requirement: Cascade-Aware Deletion
The system SHALL provide database helper functions that maintain referential integrity when a project or a global recipe is deleted, even though no delete UI ships in this change.

#### Scenario: Deleting a project
- **WHEN** `deleteProject(id)` is called
- **THEN** the project's `chapters` and `project_recipes` records are removed, while its recipes remain untouched in the global `recipes` store.

#### Scenario: Deleting a global recipe
- **WHEN** `deleteRecipe(id)` is called
- **THEN** the recipe record is removed along with every `project_recipes` association referencing it across all projects.

### Requirement: Database Backup (Export)
The system SHALL support exporting the full database (all four tables, including image Blob fields) into a single downloadable backup file, using the `dexie-export-import` addon.

#### Scenario: Exporting database backup
- **WHEN** the user initiates database export in settings
- **THEN** the system calls the addon's `exportDB()` to build a complete backup file, including Blob-valued fields natively, and downloads it.

### Requirement: Database Restore (Import)
The system SHALL support restoring a previously exported backup file via the `dexie-export-import` addon, replacing the existing local database contents while preserving each record's original `id` and relations, and SHALL leave existing data completely untouched if the file is invalid.

#### Scenario: Importing a valid database backup
- **WHEN** the user uploads a valid database backup file
- **THEN** the system calls the addon's `importDB()`, which replaces the existing database contents while preserving original ids and `projectId`/`recipeId`/`chapterId` relations, after which the Pinia store state is refreshed to reflect the restored data.

#### Scenario: Importing an invalid or corrupt backup file
- **WHEN** the user uploads a file that the import addon rejects as invalid or corrupt
- **THEN** the system surfaces a clear error to the user and leaves the existing IndexedDB data completely untouched.
