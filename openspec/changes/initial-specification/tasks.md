## 1. Project Setup & Database Layer

- [ ] 1.1 Initialize the codebase structure and install core packages (`fraction.js`, `@magrinj/parse-ingredients`, and `@dailykit/food-units-converter`)
- [ ] 1.2 Implement IndexedDB initialization module (`db.js`) defining object stores for recipes, projects, chapters, and project_recipes
- [ ] 1.3 Create database wrapper functions for CRUD operations on all stores

## 2. Recipe Library, Editor & Unit Conversions

- [ ] 2.1 Develop the recipe form with a textarea-based input utilizing `@magrinj/parse-ingredients` for real-time parser feedback
- [ ] 2.2 Implement the conversion module using `@dailykit/food-units-converter` for volume-to-weight and density conversions
- [ ] 2.3 Implement volume-to-volume fallbacks and the "Quarter-Cup" rule bypass logic
- [ ] 2.4 Add `fraction.js` for formatting quantity values on screen and in print outputs
- [ ] 2.5 Build recipe editor inputs for optional fields (Chef's Notes and Image upload)
- [ ] 2.6 Implement Global Library search bar (searching by title and ingredients)
- [ ] 2.7 Develop multiple visual templates (e.g., standard, image-heavy, text-only) and template selector dropdown
- [ ] 2.8 Style recipe image elements using `object-fit: cover` and build fallback placeholder blocks for empty image slots



## 3. Book Organization & Chapter Sequencing

- [ ] 3.1 Implement Project creation and default "Miscellaneous" chapter auto-initialization
- [ ] 3.2 Implement Chapter CRUD operations and ordering/sequencing logic
- [ ] 3.3 Create the Recipe-to-Chapter association controller, enforcing single chapter assignment per project
- [ ] 3.4 Implement chapter deletion cleanup logic (automatically reassigning recipes to the "Miscellaneous" default chapter)
- [ ] 3.5 Create UI panel for project configuration settings (Title, Subtitle, Author, and page numbers toggle)
- [ ] 3.6 Implement project styling customizer for selecting accent color and cover layout template
- [ ] 3.7 Develop project selector dashboard to support creating, selecting, and deleting multiple cookbooks
- [ ] 3.8 Build project recipe curation UI to associate and dissociate recipes from the Global Recipe Library


## 4. Print Templates & Page-Layout CSS

- [ ] 4.1 Write page layout components for Cover Page, Table of Contents, Chapter Dividers, and Recipe Sheets using native HTML elements
- [ ] 4.2 Develop `@media print` CSS rules using `@page` margin boxes (`@bottom-right { content: counter(page); }`) and named pages to suppress footers on cover and TOC
- [ ] 4.3 Build a 1:1 scale visual page container preview system for the UI (matching the print margins exactly)

## 5. Export, Import, & Native Printing Flow

- [ ] 5.1 Implement full book compilation sequence generator mapping projects to a single printable DOM structure
- [ ] 5.2 Implement single recipe compiler page generation (suppressing page numbers and cover elements)
- [ ] 5.3 Write IndexedDB database exporter utility converting data and image Blobs into Base64 JSON format
- [ ] 5.4 Write Database importer utility validating JSON and converting Base64 images back to binary Blobs
