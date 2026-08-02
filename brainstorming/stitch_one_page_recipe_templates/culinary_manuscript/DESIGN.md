---
name: Culinary Manuscript
colors:
  surface: '#fbf9f9'
  surface-dim: '#dbdad9'
  surface-bright: '#fbf9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f3f3'
  surface-container: '#efeded'
  surface-container-high: '#e9e8e7'
  surface-container-highest: '#e3e2e2'
  on-surface: '#1b1c1c'
  on-surface-variant: '#4c4546'
  inverse-surface: '#303031'
  inverse-on-surface: '#f2f0f0'
  outline: '#7e7576'
  outline-variant: '#cfc4c5'
  surface-tint: '#5e5e5e'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#1b1b1b'
  on-primary-container: '#848484'
  inverse-primary: '#c6c6c6'
  secondary: '#5d5f5f'
  on-secondary: '#ffffff'
  secondary-container: '#dcdddd'
  on-secondary-container: '#5f6161'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#1b1b1b'
  on-tertiary-container: '#848484'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e2e2e2'
  primary-fixed-dim: '#c6c6c6'
  on-primary-fixed: '#1b1b1b'
  on-primary-fixed-variant: '#474747'
  secondary-fixed: '#e2e2e2'
  secondary-fixed-dim: '#c6c6c7'
  on-secondary-fixed: '#1a1c1c'
  on-secondary-fixed-variant: '#454747'
  tertiary-fixed: '#e2e2e2'
  tertiary-fixed-dim: '#c6c6c6'
  on-tertiary-fixed: '#1b1b1b'
  on-tertiary-fixed-variant: '#474747'
  background: '#fbf9f9'
  on-background: '#1b1c1c'
  surface-variant: '#e3e2e2'
typography:
  recipe-title:
    fontFamily: EB Garamond
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  section-header:
    fontFamily: Atkinson Hyperlegible Next
    fontSize: 14px
    fontWeight: '700'
    lineHeight: 20px
    letterSpacing: 0.05em
  body-main:
    fontFamily: Atkinson Hyperlegible Next
    fontSize: 11px
    fontWeight: '400'
    lineHeight: 16px
  ingredient-list:
    fontFamily: Atkinson Hyperlegible Next
    fontSize: 11px
    fontWeight: '400'
    lineHeight: 18px
  instruction-step:
    fontFamily: Atkinson Hyperlegible Next
    fontSize: 11px
    fontWeight: '400'
    lineHeight: 18px
  meta-label:
    fontFamily: Atkinson Hyperlegible Next
    fontSize: 9px
    fontWeight: '700'
    lineHeight: 12px
  meta-value:
    fontFamily: Atkinson Hyperlegible Next
    fontSize: 11px
    fontWeight: '400'
    lineHeight: 14px
  chef-note:
    fontFamily: EB Garamond
    fontSize: 10px
    fontWeight: '400'
    lineHeight: 14px
spacing:
  page-margin: 0.75in
  column-gap: 2rem
  section-stack: 1.5rem
  element-stack: 0.5rem
---

## Brand & Style
This design system is engineered for the home cook who values clarity, utility, and a timeless aesthetic. The personality is quiet and authoritative, acting as a functional tool rather than a distraction. 

The style is **Minimalist** with a focus on editorial clarity. It prioritizes information density and legibility under varying kitchen lighting conditions. To ensure cost-effective physical use, the system is optimized for monochrome printing, utilizing high-contrast black typography and structural whitespace instead of heavy ink-heavy blocks or vibrant colors.

## Colors
The palette is strictly restricted to ensure ink conservation and high legibility on standard paper stock. 
- **Primary:** True black (#000000) for all body text and headers to ensure maximum contrast.
- **Secondary:** Very light grey (#F2F2F2) for container backgrounds (e.g., "Chef's Notes") and subtle section separators.
- **Neutral:** Medium grey (#717171) for meta-data labels (e.g., "Prep Time", "Yield") to create a visual hierarchy without competing with the primary content.

## Typography
The system uses a pairing of a classical Serif for titles and a high-legibility Sans-Serif for functional content.

- **EB Garamond** provides an editorial, sophisticated feel for the recipe name and supplementary notes.
- **Atkinson Hyperlegible Next** is used for all instructional text. Its distinct character shapes ensure that measurements and fractions (e.g., 1/2 vs 1/4) are unmistakable even if the print quality is low.
- Vertical rhythm is maintained through consistent line heights that allow for comfortable reading while following a recipe step-by-step.

## Layout & Spacing
The layout is designed for a standard 8.5" x 11" (Letter) page. 
- **Margins:** A strict 0.75-inch safety margin on all sides accommodates standard home printer hardware and allows for hole-punching into binders.
- **Grid:** A two-column layout is recommended for the top section (Meta-info and Ingredients), transitioning into a single-column width for the Instructions to provide a clear, linear path for the cook.
- **Rhythm:** Generous whitespace between the "Ingredients" and "Instructions" sections prevents the page from feeling cluttered.

## Elevation & Depth
In this design system, depth is achieved through **low-contrast outlines** and tonal layering rather than shadows. 
- Avoid all drop shadows to prevent muddy printing.
- Use thin (0.5pt - 1pt) solid black or light grey lines to define boundaries.
- The "Chef's Notes" or "Variations" box should use a subtle grey fill (#F2F2F2) to set it apart from the main flow without consuming excessive ink.

## Shapes
The design system utilizes **Sharp** (0px) corners for all structural elements and image placeholders. This reinforces the clean, architectural feel of the minimalist design and ensures that printed lines remain crisp and professional.

## Components

### Structured Lists
- **Ingredients:** Use a custom square bullet (3px) aligned to the top of the text line. Ingredients should be listed one per line, with measurements in **bold**.
- **Instructions:** Use a numbered list. The numbers should be in the Sans-Serif font, slightly larger or bolder than the body text, placed in a column to the left of the instruction block for quick scanning.

### Image Placeholder
- If an image is included, it should be placed in the top-right or top-left corner as a strictly rectangular frame. For black and white printing, provide a "grayscale optimized" filter instruction to the UI.

### Info Bar (Meta-data)
- A horizontal or vertical grouping of Prep Time, Cook Time, Total Time, and Yield. Labels use the `meta-label` style (uppercase, grey), while the values use `meta-value` (black).

### Dividers
- Use horizontal rules (HR) sparingly. A 0.5pt grey line should separate the header from the ingredients, and the ingredients from the instructions.

### Checkboxes
- For "shopping list" versions of the template, provide 10px x 10px square outlines to the left of each ingredient.