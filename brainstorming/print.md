# **Feature Spec: PDF Export & Print Preparation**

## **1\. Product Goal**

To compile the structured chapters, templates, and recipe data of a cookbook project into a high-quality PDF document optimized for DIY physical printing, supporting both full-book compilation and individual recipe updates.

## **2\. Print Layout Specifications**

### **A. Page Format & Margins**

* **Paper Size:** Standard US Letter (8.5" x 11") or A4, explicitly configured at the user level.  
* **Uniform Margins:** Left, right, top, and bottom margins are identical across all pages. No duplex alternating or gutter shifting is applied.  
* **Binding Tolerance:** Margins are engineered to be wide enough to safely accommodate DIY physical punching (e.g., spiral, comb, or wire binding) without clipping text, images, or elements.

### **B. Pagination & Table of Contents Control**

* **Page Number Toggle:** Page numbering can be toggled on or off at the cookbook project level.  
* **Table of Contents Omission:**  
  * When page numbers are toggled ON, a Table of Contents page is automatically generated and included.  
  * When page numbers are toggled OFF, the Table of Contents is omitted entirely from the compilation.

### **C. Document Sequence (Full Compilation)**

When exporting a full cookbook, the compilation pipeline generates pages in the following sequential order:

1. **Title Page** (Formatted using a selected cover template, displaying Title, Subtitle, and Author Name in the project's chosen accent color).  
2. **Table of Contents** (Only generated and included if page numbers are toggled ON).  
3. **Chapters & Recipes**:  
   * *Chapter Divider Page* (Displays the chapter title formatted with the project's global accent color).  
   * *Recipe Pages* (Rendered in their defined sequential order using each recipe's assigned layout template).

### **D. Individual Recipe Export**

* **Single-Page Compilation:** The system supports the compilation and export of a single, specified recipe.  
* **Visual Continuity:** Individual recipe exports use the active layout template, the parent cookbook's active accent color, and identical margin specifications to ensure they match previously printed pages.  
* **No Page Numbering on Single Exports:** Individual recipe exports are compiled without page numbers to allow them to be seamlessly inserted anywhere in a physical book.

## **3\. Scope Boundaries & Out of Scope**

* **No Full-Bleed Support:** The system does not output full-bleed layouts (printing to the absolute edge of the physical page). All designs respect standard consumer print margins.  
* **No Manual Page Number Overrides:** While page numbers can be toggled on or off globally, users cannot manually override page numbers for individual pages or insert arbitrary page breaks.

## **4\. Functional Flows**

1. **Full Export Request:** The user triggers the compilation process for an entire selected cookbook project.  
2. **Individual Export Request:** The user triggers the compilation process for a single, selected recipe within a cookbook project.  
3. **Layout Preview:** The system renders a page-by-page preview of the compiled output (either the full book or the single recipe) for verification before downloading.  
4. **Compilation & Download:** The system generates and delivers the unified, print-ready PDF file.