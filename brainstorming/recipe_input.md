# **Feature Spec: Recipe Input & Layout Preview**

## **1\. Product Goal**

To define a structured data model for recipes that isolates raw culinary content from presentation layouts, enabling real-time print-ready rendering and automated dual-display unit conversions.

## **2\. Separation of Concerns**

### **A. Structured Raw Data Input**

To automate unit conversions, ingredients are stored as structured database entities rather than freeform text.

* **Required Recipe Fields:**  
  * Recipe Title  
  * Instructions (Sequential steps)  
* **Structured Ingredient Fields:**  
  Each ingredient entry requires:  
  1. **Quantity** (Numeric, supporting fractions)  
  2. **Unit** (Standardized set: e.g., cups, tablespoons, teaspoons, fluid ounces, ounces, pounds, grams, milliliters, piece/clove/unit)  
  3. **Ingredient Name** (Text)  
* **Optional Fields:**  
  * Prep Time / Cook Time / Servings  
  * One Recipe Image  
  * Chef’s Notes / Callout text  
  * **Tags:** Zero or more custom, user-defined labels (e.g., "Gluten-Free", "Fast") to aid in searching and filtering the Global Recipe Library.

### **B. Unit Conversion Rules**

The layout engine automatically formats and displays both US and Metric measurements side-by-side in the layout.

* **Dual-Display Formatting:** Ingredients are compiled as: \[US Measurement\] (\[Metric Measurement\]) \[Ingredient Name\].  
* **Volume-to-Weight Density Lookup:**  
  * The system maintains standard densities for common ingredients (e.g., flour, sugar, butter, water, milk, oil) to convert volume units (e.g., cups) to weight units (e.g., grams).  
  * Unrecognized ingredients fall back to volume-to-volume dual-display (e.g., converting cups to milliliters).  
* **The "Quarter-Cup" Rule for Weight:**  
  * If an ingredient quantity is less than a quarter-cup (1/4 cup, or 4 tablespoons), the system bypasses volume-to-weight conversions.  
  * It instead formats the ingredient using standard volume-to-volume conversions (e.g., teaspoons to milliliters) to keep measurements practical for kitchen scales.

### **C. Layout Preview & Rendering Rules**

The system provides a real-time layout preview of the single printed page.

* **Preset Templates:** The layout engine applies a chosen visual template to render the raw data.  
* **Strict Template Fidelity:** Templates use static font sizes and spacing rules. The system does not dynamically scale elements to force content to fit.  
* **Static Image Containers:** If a template contains an image placeholder but no image is uploaded, that space remains blank. The layout does not collapse or shift columns.  
* **Automated Image Fit:** Uploaded images are automatically scaled and cropped to fill the template's designated dimensions, centered.

## **3\. Scope Boundaries & Out of Scope**

* **No Rich Text Formatting:** Changing fonts, paragraph alignments, or custom text colors is out of scope. Simple inline text styling (bold, italics) is allowed.  
* **No Dynamic Layout Auto-Scaling:** If content exceeds the page boundaries, the layout does not shrink fonts or elements to fit.  
* **No Manual Cropping:** Manual image editing, rotation, and custom cropping tools are out of scope.

## **4\. Functional Flows**

1. **Recipe Creation/Modification:** The user inputs or edits structured recipe fields.  
2. **Real-time Compilation:** The system continually compiles the raw input into a preview using the active layout template, rendering ingredients in dual-unit format.  
3. **Template Assignment:** The user can toggle between different template styles to evaluate layout compatibility.  
4. **Overflow Assertion:** The system asserts whether the content exceeds the physical page boundary and flags layout overflows.
