## Why

The DIY Cookbook Creator is an offline-first, client-side web application. Before implementing recipe editing or rendering, it needs a highly reliable greenfield application shell, a standardized styling system, and a relational local database (IndexedDB) with backup/restore capabilities to ensure data persistence and stability.

## What Changes

- Initialize the NPM project with Vite + Vue 3 (Composition API) and configure the folder hierarchy.
- Establish the base styling system: global CSS custom-property tokens (`tokens.css`) for accents, spacing, typography, and dark mode, plus component-scoped styles via Vue SFC `<style scoped>` blocks.
- Develop the core application shell UI with a responsive layout, navigation sidebar, and Vue Router-driven navigation (including deep-linkable recipe/project views and a dedicated print route).
- Establish a Pinia store layer so shared data (recipes referenced from multiple projects) stays reactively in sync across every view.
- Implement the client-side database layer (`db.js`) using Dexie.js, managing the IndexedDB instance for recipes, projects, chapters, and recipe-to-project mappings.
- Implement a database Export/Import (Backup/Restore) capability, via the `dexie-export-import` addon, to prevent data loss from browser cache clears.

## Capabilities

### New Capabilities
- `project-foundation`: Scaffolds the Vite + Vue development environment, the global/component styling system, Pinia store layer, and a routed, responsive navigation dashboard shell.
- `database-foundation`: Establishes the local Dexie/IndexedDB database, sets up relational tables, supports seed data, and provides backup/restore utilities.

### Modified Capabilities

## Impact

- Greenfield repository setup, introducing Vite dev server, entry-point HTML, CSS design variables, and package configurations.
- Client-side database module managing all application state.
