# project-foundation

## Purpose

Scaffolds the Vite + Vue 3 development environment, the global/component styling system, the Pinia store layer, and a routed, responsive navigation dashboard shell for the DIY Cookbook Creator.

## Requirements

### Requirement: Vite + Vue Development Environment
The application SHALL be initialized and built using Vite with a Vue 3 (Composition API) configuration.

#### Scenario: Running the local Vite dev server
- **WHEN** the user starts the dev server with `npm run dev`
- **THEN** the Vite development server runs successfully and serves the Vue client application at `http://localhost:5173`.

### Requirement: Design System Token Registry
The application SHALL register global CSS custom properties (in `tokens.css`) for central brand colors, neutrals, spacing scales, font hierarchies, transition speeds, and active visual themes (e.g. support for dark mode), consumed by component-scoped styles in individual Vue components.

#### Scenario: Accent Color Configuration
- **WHEN** a Vue component's `<style scoped>` block loads
- **THEN** it resolves styling values from the global custom properties such as `--accent-color`, `--font-main`, and `--bg-primary` defined in `tokens.css`.

### Requirement: Shared Reactive State Layer
The application SHALL maintain shared application data (recipes, projects, chapters, and their associations) in a Pinia store layer backed by `db.js`, so that any change made through one view is reflected in every other mounted view referencing the same data.

#### Scenario: Editing a shared recipe updates all views
- **WHEN** a recipe is updated through a store action
- **THEN** every mounted component reading that recipe from the store re-renders with the updated data, without a manual page refresh.

### Requirement: Responsive Application Dashboard Shell
The user interface SHALL render a split-pane layout consisting of a side-nav bar for feature navigation and a main content viewport panel. On small screens, the side-nav panel SHALL collapse into a collapsible slide-out drawer.

#### Scenario: Resizing viewport to mobile width
- **WHEN** the browser window width is reduced below 768px
- **THEN** the sidebar menu collapses automatically and a hamburger toggle button becomes interactive.

### Requirement: Routed Client-Side View Navigation
The application SHALL use Vue Router to navigate between views (Dashboard, Recipe Library, an individual recipe, a Project view, its Print view, and Settings) without executing full page reloads, with each view addressable by its own URL.

#### Scenario: Switching tabs in sidebar
- **WHEN** the user clicks "Recipe Library" in the side-nav
- **THEN** the router navigates to `/library`, and the application shell swaps the active main container view to the recipe library panel without refreshing the page.

#### Scenario: Reloading on a deep-linked recipe
- **WHEN** the user reloads the page while on `/library/:recipeId`
- **THEN** the application re-mounts directly into that recipe's detail view rather than resetting to the Dashboard.
