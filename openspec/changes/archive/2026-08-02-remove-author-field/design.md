## Context

Currently, `author` (or `authorName`) is part of project configuration data stored in IndexedDB (`db.js`), exposed via Pinia (`projects.js` store), configured in `ProjectView.vue`, rendered on cover preview/print (`CoverPage.vue`), and verified in test fixtures (`db.test.js`, `projects.test.js`).
The product requirement has changed to completely eliminate the `author` field from project metadata and cover pages.

## Goals / Non-Goals

**Goals:**
- Remove `author` field from project object structure in `src/js/db.js` and `src/stores/projects.js`.
- Remove author input UI from `src/views/ProjectView.vue`.
- Remove author text rendering from `src/components/CoverPage.vue`.
- Update unit test fixtures to no longer set or expect `author`.

**Non-Goals:**
- DB schema migration scripts or version bumps: indexedDB store `projects` uses inline object properties, so existing stored records with an `author` key will simply ignore the field.

## Decisions

- **Remove property from initial project factory / updates**: `db.addRecipeToProject` / `db.createProject` / `projects.js` will default project state to `{ title, subtitle, accentColor, layout, showPageNumbers }`.
- **Remove UI elements**: In `ProjectView.vue` and `CoverPage.vue`, remove form controls and template interpolation for `project.author`.

## Risks / Trade-offs

- Existing saved projects in IndexedDB or imported backup files may contain an `author` property.
  - *Mitigation*: The app ignores unrecognized properties when loading project objects.
