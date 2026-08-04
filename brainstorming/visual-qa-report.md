# Visual QA Report

## Overview
As a creative director reviewing the Cookbook Maker application, I've conducted a thorough audit of the user interface to ensure visual consistency and a cohesive layout. The application generally uses a strong, modern aesthetic with consistent coloration (primarily `oklch` grays like `--gray-96` backgrounds and `--gray-99` cards). However, as a system expands, minor inconsistencies start to compound, creating an experience that feels "pieced together" rather than systematically designed. 

Below is a detailed breakdown of the inconsistencies and visual nitpicks found in the codebase.

## 1. Container Widths and Page Bounds
The app lacks a unified maximum width for main content areas, which will cause the layout to jump around as users navigate.
- **1280px (The Standard):** `Dashboard.vue`, `RecipeLibrary.vue`, and `Settings.vue` consistently use `max-width: 1280px`.
- **840px:** `RecipeImport.vue` restricts its main container to `max-width: 840px`. While perhaps intentional for a focused form, this sudden narrowing disrupts layout predictability.
- **640px:** `RecipeEditor.vue`'s "Not found" state abruptly shrinks to `max-width: 640px`.
- **Full Width (No Bound):** `ProjectView.vue` is the most egregious. It completely drops the `max-width` constraint, using a CSS grid (`1fr 340px`) that will stretch infinitely on ultra-wide monitors, making it feel completely detached from the rest of the application's bounded layout.

## 2. Main Padding and Spacing
The padding around the primary `<main id="cm-main">` wrappers fluctuates randomly across views.
- **40px 32px 80px (Top Right/Left Bottom):** Used in `Dashboard.vue`, `RecipeLibrary.vue`, `Settings.vue`, `ProjectPrint.vue`, and `RecipePrint.vue`. This appears to be the intended baseline.
- **32px 32px 100px:** Used in `RecipeEditor.vue`. (Top padding is 8px too small, bottom is 20px too large).
- **40px 32px 100px:** Used in `RecipeImport.vue`. (Bottom padding is 20px too large).
- **28px 32px 140px:** Used in `ProjectView.vue`. The top padding here is extremely tight (28px vs 40px standard), pushing the content uncomfortably close to the header.

## 3. Heading Hierarchy (Typography)
There is a severe lack of discipline regarding heading sizes. The application uses the beautiful `Newsreader` serif font, but the scale is broken.
- **`<h1>` element sizes:**
  - `34px`: Dashboard, RecipeLibrary, Settings
  - `32px`: NotFound, RecipeImport (Why the 2px difference?)
  - `26px`: RecipeEditor "Not Found" state.
  - `22px`: `ProjectView.vue`'s main `.pv-header-title`. This is drastically smaller than every other main page title, making the project view feel lower in the structural hierarchy when it should feel like a primary destination.
- **`<h2>` element sizes:**
  Sizes for `<h2>` are all over the map, ranging randomly: **22px, 21px, 20px, 19px, 18px, and 17px**. We need a strict design token system for typography (`text-xl`, `text-lg`, etc.) rather than hardcoded pixel values.

## 4. Modal and Form Control Ordering
The ordering of Primary and Secondary (Cancel) actions in modals and forms is generally consistent, with one glaring exception.
- **Cancel (Left) → Primary Action (Right):** This is correctly used in `ConfirmDialog.vue`, `ChapterNameModal.vue`, `EditCookbookModal.vue`, `Dashboard.vue` (delete modal), `RecipeEditor.vue` (save/delete buttons), and `RecipeImport.vue`.
- **Primary Action (Left) → Cancel (Right):** `BulkActionBar.vue` breaks the established pattern by putting the dangerous "Remove from cookbook" action on the left and "Cancel" on the right. This inconsistency will lead to misclicks and user frustration.

## 5. Breadcrumb / "Back" Button Treatment
The visual treatment of navigation links back to a parent directory is completely unstandardized.
- **ProjectView.vue:** Uses a native `<button>` element with a chevron SVG icon (`16x16px`, `stroke-width: 2`). The text reads simply "Cookbooks".
- **RecipeEditor.vue:** Uses a `<router-link>` element with an arrow SVG icon (`15x15px`, `stroke-width: 2.2`). The text reads "Back to Recipe Library" and it has a `margin-bottom: 20px`.
- **RecipeImport.vue:** Uses a `<router-link>` with the same arrow SVG, but with a `margin-bottom: 18px`.

**Nitpick:** The icons, stroke widths, wording verbosity, DOM elements, and spacing all differ for what is conceptually the exact same UI pattern (a back link).

## 6. Button Padding Inconsistencies
Button sizes are not standardized across components. We have a mishmash of inline padding values:
- `10px 20px` (`ConfirmDialog.vue`)
- `10px 18px` (`RecipeEditor.vue` cancel, `ChapterNameModal.vue` cancel)
- `7px 14px` (`BulkActionBar.vue`)
- `6px 12px` (`ProjectView.vue` back button)

## Conclusion & Recommendations
The app's foundation is solid, but it suffers from "inline-style-itis". 
To fix these issues, we need to:
1. Extract typography scales into CSS classes or variables (e.g., `.text-h1`, `.text-h2`).
2. Create a standardized `<PageLayout>` component or utility class to enforce `max-width` and `padding` rules.
3. Standardize a `<BackButton>` component to ensure the chevron/arrow icon, stroke-width, and typography are identical across all views.
4. Swap the button order in `BulkActionBar.vue` to match the rest of the application.
