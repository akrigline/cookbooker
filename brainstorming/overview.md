# **DIY Cookbook Creator \- Product Specification**

## **1\. Product Vision & Goals**

The Cookbook Creator is an application designed to help users preserve, organize, and compile their recipes into beautiful, print-ready PDF cookbooks. The primary goal is the creation of a physical, printed book, meaning all features prioritize print aesthetics, standardized paper layouts, and simple margins.

## **2\. High-Level Core Features**

### **A. Global Recipe Library**

* A centralized repository containing all of the user's created recipes, independent of individual cookbook projects.  
* Recipes can be searched and filtered using global tags.  
* **Shared-State Updates:** Editing a recipe from anywhere in the application modifies its single master copy, automatically updating it across all associated cookbook projects.

### **B. Multi-Project Management**

* The system supports the creation and management of multiple independent cookbook projects.  
* Each project maintains its own subset of associated recipes, chapter sequencing, cover layout selection, and accent color.

### **C. Single-Page Layout Constraint**

* Every recipe is strictly designed to fit onto a single printed page to maintain a consistent, physical cookbook format.

### **D. Book Organization**

* Within each project, users can organize their associated recipes into custom chapters, arrange the sequence of chapters, and define the order of recipes within each chapter.

### **E. Theme & Styling**

* Each cookbook project can be assigned one primary accent color from a curated palette.  
* This accent color is automatically applied to chapter dividers, titles, and cover design elements during compilation.

### **F. Printable PDF Export**

* The system compiles all active project contents, automated front matter, and chapter dividers into a single, high-quality PDF optimized for DIY printing and spiral binding.

## **3\. Functional User Flow**

1. **Recipe Management:** The user creates and manages recipes in their Global Recipe Library, assigning custom tags and inputting structured ingredient data.  
2. **Project Curation:** The user creates a cookbook project and associates selected recipes from their Global Recipe Library with the project.  
3. **Project Organization:** The user manages custom chapters, reassigns recipes to chapters, and defines the sequence of the book.  
4. **Project Styling:** The user selects a visual cover template and a primary accent color for the active project.  
5. **PDF Compilation:** The user triggers the PDF compilation pipeline, previews the generated page-by-page layout, and downloads the printable PDF.