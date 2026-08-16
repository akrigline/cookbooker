## MODIFIED Requirements

### Requirement: Layout Template Assignment
The user SHALL be able to select and switch between multiple visual layout templates for rendering a recipe. Changing the layout template MUST format the recipe page without altering the underlying raw recipe data. Some layout templates MAY additionally accept per-recipe placement configuration for optional elements (currently: recipe image and Chef's Notes, each independently placeable as none/hero/left/right); when the active template accepts this configuration, the editor MUST expose controls for it, and switching away from that template MUST NOT discard the stored placement values (they remain harmless no-ops under templates that don't use them).

#### Scenario: Switching recipe layout template
- **WHEN** the user switches a recipe's layout from "Classic Text" to "Image Top Layout"
- **THEN** the print preview updates the layout immediately, keeping all ingredients and instructions unchanged.

#### Scenario: Configuring image and notes placement on a placement-aware template
- **WHEN** the user selects a layout template that accepts placement configuration and sets the image placement to "left column" and the Chef's Notes placement to "hero"
- **THEN** the print preview renders the image in the left column and the Chef's Notes as a full-width row under the title, and these placement values are saved with the recipe

#### Scenario: Placement controls hidden for non-placement-aware templates
- **WHEN** the user selects a layout template that does not accept placement configuration
- **THEN** the editor does not display the image/notes placement controls, even if the recipe has previously stored placement values from an earlier template selection

#### Scenario: Optional element absent despite a configured placement
- **WHEN** a recipe has no Chef's Notes but its notes placement is set to "right column"
- **THEN** the right column renders without a Chef's Notes block or reserved gap, and the remaining right-column content (e.g. Instructions) is unaffected

### Requirement: Layout Template Discoverability Tiers
Each layout template SHALL be classified as either recommended or legacy. Recommended templates MUST be displayed by default in the layout picker as larger cards including a small illustrative thumbnail of the template's block structure, visually separated from the legacy section by a divider. Legacy templates MUST be collapsed behind a "Show more layouts" disclosure control that is closed by default, always, regardless of which template the recipe currently being edited has selected. Legacy templates MUST remain fully selectable and functional; this requirement governs presentation only, not availability.

#### Scenario: New recipe shows only recommended layouts initially
- **WHEN** the user creates a new recipe and opens the layout template picker
- **THEN** only the recommended-tier templates are visible as thumbnail cards, separated by a divider from a "Show more layouts" control that reveals the legacy-tier templates

#### Scenario: Editing a recipe already on a legacy layout
- **WHEN** the user opens the editor for an existing recipe whose layout template is a legacy-tier template
- **THEN** the layout picker's legacy section is still collapsed by default; expanding "Show more layouts" reveals that template already selected

#### Scenario: Selecting a legacy layout remains possible
- **WHEN** the user expands "Show more layouts" and selects a legacy-tier template
- **THEN** the recipe's layout template updates normally and the print preview reflects the legacy template, identically to selecting a recommended template

#### Scenario: New recipes default to a recommended layout
- **WHEN** the user creates a brand-new recipe without explicitly choosing a layout template
- **THEN** the recipe starts on a recommended-tier template rather than a legacy-tier template
