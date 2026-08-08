# print-and-export (delta)

## Modified Requirements

### Requirement: Proactive Single-Page Overflow Detection
The existing Single-Page Recipe Layout Constraint (every recipe page SHALL be styled to render as a single printed page) is extended with proactive detection. After any recipe write operation (create, edit, or import), the system SHALL compute a `fitsOnPage` flag by client-side rendering of the recipe sheet at print dimensions and comparing scroll height to client height. The result SHALL be persisted on the recipe record and surfaced as a warning badge on list items (see `recipe-library` and `cookbook-management` delta specs). A `fitsOnPage` value of `null` indicates the recipe has not yet been measured.

#### Scenario: Fit flag set after recipe create or edit
- **WHEN** the user creates or saves a recipe
- **THEN** the system asynchronously renders the recipe sheet at print dimensions and sets `fitsOnPage` to `true` if the content fits within a single page height, or `false` if it overflows

#### Scenario: Fit flag null for pre-existing unmeasured recipes
- **WHEN** a recipe exists in the library but has never been written since this feature was deployed
- **THEN** its `fitsOnPage` field is `null` and no overflow warning is displayed
