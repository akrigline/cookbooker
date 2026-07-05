# **Feature Spec: Book Organization & Structure**

## **1\. Product Goal**

To provide a functional structure that allows recipes from a central Global Recipe Library to be curated, associated, and sequenced into sequential chapters representing a physical book layout.

## **2\. Book Hierarchy & Rules**

The application models a traditional, sequential physical book.

### **A. Chapters**

* **Chapter CRUD:** The system must allow users to create, read, update, and delete chapters within a cookbook project.  
* **Single Association:** Within a single cookbook project, a recipe can belong to at most one chapter at any given time.  
* **Visual Dividers:** Each chapter begins with a generated Chapter Divider Page indicating the chapter name.

### **B. The "Miscellaneous" Default Chapter**

* **Automatic Creation:** Every cookbook project contains a built-in default chapter called "Miscellaneous". This chapter cannot be deleted.  
* **Fallback Assignment:** When a recipe is added to a cookbook project, it is automatically assigned to the "Miscellaneous" chapter if no other chapter is specified.  
* **Deletion Recovery:** If a custom chapter is deleted, its recipes are automatically reassigned to the "Miscellaneous" chapter within that project. (Recipes are never deleted from the Global Recipe Library when a chapter is deleted).  
* **Conditional Compilation:**  
  * If the "Miscellaneous" chapter contains recipes during export, it is compiled as the final chapter of the book.  
  * If the "Miscellaneous" chapter is completely empty, it is hidden from the compiled book layout and the Table of Contents.

### **C. Shared-State Updates**

* Since recipes are curated from a central library, editing a recipe's content from within any book project updates the single master recipe. This change automatically propagates globally to all other cookbook projects containing that recipe.

## **3\. Scope Boundaries & Out of Scope**

* **No Nested Chapters:** Sub-chapters or nested sections are out of scope. The organization remains strictly flat (Book \-\> Chapter \-\> Recipe).  
* **No Multi-Chapter Recipe Association:** Within a single book, a recipe cannot be assigned to multiple chapters simultaneously.  
* **No Custom Text Pages or Back Matter:** Custom diary pages, index pages, or dedication pages are out of scope. The final output is composed strictly of the Cover Page, Table of Contents, Chapter Dividers, and Recipe Pages.

## **4\. Functional Flows**

1. **Chapter Management:** The user can create new chapters, modify chapter titles, and delete chapters within a project.  
2. **Recipe Association:** The user can associate recipes from their Global Recipe Library with a cookbook project, and reassociate recipes between chapters.  
3. **Sequencing:** The user can define the sequential order of chapters within the book, and the sequential order of recipes within each chapter.  
4. **Divider Styling:** The user can select a preset template design for the chapter divider pages.