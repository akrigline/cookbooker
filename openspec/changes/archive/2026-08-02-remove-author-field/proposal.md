## Why

Cookbooks should not have an author field as project metadata or on the title cover page. The requirement for an optional author field in project metadata was incorrect and needs to be completely removed.

## What Changes

- **BREAKING**: Remove the `author` metadata field from cookbook project configuration.
- **BREAKING**: Remove author input field from project configuration/metadata UI forms.
- **BREAKING**: Remove author display from the cookbook Cover Page / Title Page component and compiled print/export layouts.
- Update project data model and Pinia store to stop storing or managing `author`.

## Capabilities

### Modified Capabilities

- `cookbook-management`: Remove author from project metadata configuration requirements and scenarios.
- `print-and-export`: Remove author from title page document sequence compilation requirement.

## Impact

- Database schema & storage: `author` field removed from project objects/Dexie schema.
- UI components: `src/views/ProjectView.vue` (project details form) and `src/components/CoverPage.vue` (cover/title page preview and print render).
- Pinia store: `src/stores/projects.js` project creation and update actions.
- Tests: `src/stores/projects.test.js` and `src/js/db.test.js` where author field was referenced in project fixtures or expectations.
