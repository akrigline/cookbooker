# Recipe Template Implementation Plan

## 1. Architectural Overview

The goal is to implement a robust, highly predictable template system utilizing Vue components. To maintain a unified design language (fonts, styling, spacing) while supporting distinct layouts, we will use a **Three-Tier Component Architecture**.

### Tier 1: The Atomic Recipe Components
Instead of hardcoding HTML tags in every layout, we will build atomic presentation components. These enforce the typography and ink-saving rules globally.
*   `RecipeTitle.vue`: Handles `EB Garamond` typography and alignment.
*   `RecipeImage.vue`: Handles aspect ratios, object-fit, and the `printGrayscale` CSS filter.
*   `RecipeNotes.vue`: Renders the subtle `#F2F2F2` background box or blockquote.
*   `IngredientList.vue`: Takes the array of ingredients and handles `columnar` vs `tabular` layouts.
*   `InstructionList.vue`: Handles the `Atkinson Hyperlegible Next` typography, spacing, and numbering style.

### Tier 2: The Template Layouts (The Canned Grids)
These are the 6 distinct layout components. They contain **zero visual styling** (no fonts, colors, or borders). Their only job is to provide the structural Flexbox containers and import the Tier 1 components.
All layouts will accept the exact same unified `recipeData` prop object.

### Tier 3: The Recipe Renderer (Parent Wrapper)
A dynamic wrapper component (`RecipeRenderer.vue`) that receives the raw recipe data from the Pinia store/IndexedDB and a `templateVariant` string. It uses Vue's `<component :is="...">` to dynamically inject the correct Tier 2 layout template.

---

## 2. Unified Data Schema (Props)

Every layout template will expect a prop, e.g., `recipe`, with the following strict interface:

```typescript
{
  title: String,
  image: {
    src: String,
    altText: String,
    aspectRatio: String // e.g., '16/9', '4/3', '1/1'
  },
  notes: String, // Nullable
  ingredients: Array<{ quantity: String, name: String }>,
  instructions: Array<String>,
  config: {
    ingredientsLayout: String, // 'columnar' or 'tabular'
    ingredientColumns: Number, // 1, 2, or 3
    numberingStyle: String // 'standard-list' or 'prominent-sidebar'
  }
}
```

---

## 3. Implementation Plan for the 6 Layouts

### A. `LayoutAsymmetricSidebar.vue`
*   **Structure:** A main flex row container (`flex-row`, `gap-8`).
*   **Left Column:** `w-1/3 flex flex-col gap-4`. Contains `<RecipeTitle>`, `<RecipeImage>`, `<RecipeNotes>`.
*   **Right Column:** `w-2/3 flex flex-col gap-6`. Contains `<IngredientList>`, `<InstructionList>`.

### B. `LayoutHeroSplitBalanced.vue`
*   **Structure:** A main flex column container (`flex-col`).
*   **Top (Full Width):** `<RecipeTitle>`, `<RecipeImage>`, `<RecipeNotes>`.
*   **Bottom (Split):** A flex row (`flex-row gap-8`).
    *   Left column: `w-1/2 flex flex-col`. Contains `<IngredientList>`.
    *   Right column: `w-1/2 flex flex-col`. Contains `<InstructionList>`.

### C. `LayoutHeroSplitAsymmetric.vue`
*   **Structure:** Identical to Balanced Hero Split, but the bottom flex row uses asymmetric widths.
*   **Bottom (Split):**
    *   Left column: `w-1/3 flex flex-col`. Contains `<IngredientList>`.
    *   Right column: `w-2/3 flex flex-col`. Contains `<InstructionList>`.

### D. `LayoutColumnOptimized.vue`
*   **Structure:** A main flex column container.
*   **Top (Full Width):** `<RecipeTitle>`.
*   **Bottom (Split):** A flex row (`flex-row gap-8`).
    *   Left column (Flex flow): Contains `<RecipeNotes>` followed by `<IngredientList>`.
    *   Right column (Flex flow): Contains `<RecipeImage>` followed by `<InstructionList>`.

### E. `LayoutBalancedHeader.vue`
*   **Structure:** A strict vertical stack of full-width rows (`flex-col gap-6`).
*   **Row 1 (Header):** A flex row (`flex-row items-center gap-6`). `<RecipeTitle>` (`flex-1`) and `<RecipeImage>` (`w-2/5` or `w-1/3`).
*   **Row 2:** `<RecipeNotes>` (Full width).
*   **Row 3:** `<IngredientList>` (Full width, relies on internal columns).
*   **Row 4:** `<InstructionList>` (Full width).

### F. `LayoutDualColumnBottomSplit.vue`
*   **Structure:** A main flex column container (`flex-col gap-6`).
*   **Top:** `<RecipeTitle>` (Centered), followed by `<IngredientList>` (Full width).
*   **Bottom (Split):** A flex row (`flex-row gap-8`).
    *   Left column (`w-1/3` or `w-1/2`): Contains `<RecipeImage>` (Square) followed by `<RecipeNotes>`.
    *   Right column (`flex-1`): Contains `<InstructionList>`.

---

## 4. Next Steps for Execution
1.  **Build Tier 1 (Atomic):** Scaffold the 5 base components with Tailwind classes conforming strictly to the `DESIGN.md` guidelines (grayscale print optimization, specific fonts).
2.  **Build Tier 2 (Layouts):** Create the 6 `.vue` files utilizing standard Tailwind flex utilities (`flex`, `flex-col`, `gap-X`, `w-X`). No absolute positioning or complex CSS Grid matrices required.
3.  **Build Tier 3 (Renderer):** Integrate `<RecipeRenderer>` into the main viewing/printing page, mapping the database recipe object into the expected prop schema.
