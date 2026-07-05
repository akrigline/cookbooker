## Context

The DIY Cookbook Creator is a client-only, offline-first web application. Because the primary output is a physical, printed book, the user interface and data structure must revolve around physical margins, standardized paper layouts, and native printing pipelines. This design addresses the technical choices to support local storage, image management, structured calculations, and print formatting.

## Goals / Non-Goals

**Goals:**
- Offline-first persistence of recipes, chapters, projects, and associations using browser-native local databases.
- Native storage of recipe image files without external cloud servers.
- Volume-to-weight density-based measurement conversion calculations.
- Portable JSON backup file generation including all local data and images.
- Precise HTML/CSS page templates formatted for browser print-to-PDF compilation.

**Non-Goals:**
- User authentication, online synchronization, or centralized databases.
- Server-side PDF rendering engines or external API integrations.
- Dynamic font resizing to auto-fit text; page content height is managed visually by the user.

## Decisions

### Decision 1: Relational IndexedDB Storage
We will store application state inside IndexedDB using a relational structure.
- **Alternative Considered:** `localStorage` (limited to 5MB, string-only storage).
- **Alternative Considered:** Origin Private File System (OPFS) (great for files, but harder to maintain indexes and relations).
- **Rationale:** IndexedDB allows structured records, references between tables (Recipes, Chapters, Projects), and supports native binary data storage (Blobs) up to gigabytes.
- **DB Schema Layout:**
  - `recipes` store: `id` (auto-incrementing int), `title` (string), `instructions` (string), `ingredients` (array of structured objects: `{ quantity: number, unit: string, name: string }`), `image` (Blob), `notes` (string), `layoutTemplate` (string)
  - `projects` store: `id` (auto-incrementing int), `title` (string), `subtitle` (string), `author` (string), `accentColor` (string), `coverTemplate` (string), `pageNumbersEnabled` (boolean)
  - `chapters` store: `id` (auto-incrementing int), `projectId` (index, int), `name` (string), `sequence` (int)
  - `project_recipes` store: `id` (compound key or index, e.g., string `projectId_recipeId`), `projectId` (index, int), `recipeId` (index, int), `chapterId` (index, int), `sequence` (int)
- **Ingredient Storage:** Parsed ingredients are stored as an embedded array field on each recipe record rather than a separate `ingredients` object store.
  - **Alternative Considered:** A normalized `ingredients` store with a `recipeId` index, mirroring `project_recipes`.
  - **Rationale:** No requirement queries or indexes ingredients independently of their parent recipe (e.g., "find all recipes using flour"). IndexedDB records natively support nested arrays/objects, so embedding avoids an unnecessary join for data that is always read and written as a single unit with its recipe.


### Decision 2: Image Storage & Presentation Rules
Uploaded recipe images will be stored inside IndexedDB as native binary `Blob` objects.
- **Alternative Considered:** Base64-encoded strings directly in the DB.
- **Rationale:** Storing raw Blobs keeps database size small, improves read/write speed, and allows us to generate temporary URLs using `URL.createObjectURL(blob)` for instant visual rendering in `<img>` tags. Base64 will only be used as a serialization format for JSON backups.
- **Image Formatting:** Images in templates will be styled with `object-fit: cover` and centered to fill designated containers without manual cropping. Empty image slots will retain their exact dimensions with a neutral background placeholder to prevent layout shifts.

### Decision 3: Browser-Native Printing & CSS Margin Boxes
We will rely on standard CSS print media styles (`window.print()`) combined with CSS Paged Media Margin Boxes (`@page`) to render the document. This is a strict technical constraint for the project to leverage native styling.
- **Alternative Considered:** Client-side PDF engines (e.g. `jsPDF` or `pdfmake`), which are heavy, complex, and lack styling flexibility.
- **Alternative Considered:** HTML-absolute-positioned footer elements for page numbering, which clutter the HTML structure and require manual JS page-count rendering.
- **Rationale:** Standard browsers (Chrome 131+) natively support `@page` margin boxes (like `@bottom-right`). We can use CSS `counter(page)` to handle numbering natively. By using named pages in CSS (e.g. `@page cover` and `@page toc`), we can suppress footers on the cover and table of contents pages cleanly.
- **Constraint Detail:** The page numbers on the recipe sheets should begin at 1 on the first numbered page. We will implement this by configuring CSS `counter-reset` or other styling rules during development to reset the page counter after the Cover and Table of Contents pages.

### Decision 4: Unit Conversion & Formatting Dependencies
Instead of writing custom mathematical parsers and converters, we will adopt three key open-source packages:
- **`fraction.js`**: Handles precise fraction parsing and mixed-number formatting (e.g. `1.75` -> `1 3/4`). It uses `BigInt` under the hood to prevent JavaScript floating-point errors.
- **`@dailykit/food-units-converter`**: Implements bulk density calculations for converting between mass and volume (e.g. converting liters to kilograms of flour), with custom fallback profiles.
- **`@magrinj/parse-ingredients`**: Automatically parses freeform recipe lines into structured JSON data.

### Decision 5: Real-Time Textarea Ingredient Parsing
To provide a premium user experience, we will offer a single multi-line text input (textarea) for ingredients in the recipe editor rather than individual input fields. 
- **Alternative Considered:** Individual rows of structured fields (Quantity, Unit, Name input boxes).
- **Rationale:** Structured fields require tedious form interaction (clicking "add row", tabbing between fields). A single textarea using `@magrinj/parse-ingredients` allows users to type or copy-paste recipes naturally, compiling the structured fields in the background in real-time.







## Risks / Trade-offs

- **IndexedDB Volatility:** Browser storage can sometimes be wiped if the user clears history/site data.
  - *Mitigation:* Implement a prominent "Backup/Restore" utility that compiles all tables and images (as Base64) into a downloadable `.json` file.
- **Browser Print Setting Variances:** User print dialog selections (margins, headers/footers) can affect layout output.
  - *Mitigation:* Establish wide default margins (0.75in) and display clear user instructions in the print preview screen (e.g. "Check the box for Headers and Footers").
