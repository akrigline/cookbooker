## Why

The DIY Cookbook Creator needs a formal, structured specification to guide the greenfield development of its offline-first features. By defining the requirements now, we establish clear bounds for the Global Recipe Library, Multi-Project management, Chapter sequencing, and system-native Printing capabilities before writing code.

## What Changes

- Introduce the core capabilities of the system.
- Standardize the IndexedDB schemas for local-only, persistent, relation-capable storage.
- Establish the rules for volume-to-weight ingredient unit conversions.
- Define layout structure and CSS printing properties for browser-native export.

## Capabilities

### New Capabilities
- `recipe-library`: Manage a centralized catalog of recipes, supporting search, permanent deletions, and global propagation of updates.
- `recipe-editor`: Edit individual recipe details (Title, Instructions, Chef's Notes, Image upload) and choose page layout templates.
- `ingredient-conversions`: Parse freeform ingredient textarea input in real-time and automatically compile dual-unit measurements (US/Metric) using density matching rules.
- `book-organization`: Group recipes into projects and sequence them into custom chapters, using a system-default "Miscellaneous" chapter for automatic fallbacks.
- `cookbook-management`: Create and manage multiple independent cookbook projects, including configuring project metadata (Title, Subtitle, Author), cover layout template selection, accent color styling, and page number preferences.
- `print-and-export`: Compile a project's pages (Cover, Table of Contents, Chapter Dividers, and Recipes) into a print-ready HTML page optimized for native browser printing (`window.print()`).


### Modified Capabilities
<!-- None: Greenfield project -->

## Impact

- Project initialization with local storage models.
- CSS and HTML printing templates.
- Entirely local client-side state without external database requirements.
