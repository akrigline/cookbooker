# ingredient-conversions

## Purpose

Parses freeform ingredient textarea input in real time into structured quantity/unit/name data, and formats each ingredient as a dual-unit (US/Metric) display line using density-based volume-to-weight conversion rules, falling back to volume-to-volume conversion for unrecognized ingredients or small quantities.

## Requirements

### Requirement: Text-Area Ingredient Parsing
The system SHALL provide a multi-line text field for entering ingredients. The system MUST automatically parse each line of text in real-time into structured quantity, unit of measurement, and ingredient name components.

#### Scenario: Storing ingredients from text input
- **WHEN** the user types or pastes "1 1/2 cups of all-purpose flour" in the ingredients text area
- **THEN** the system parses the line in real-time and registers the ingredient with a quantity of 1.5, a unit of "cup", and a name of "all-purpose flour"

### Requirement: Ingredient Density Matching
To convert volume measurements (such as cups) to weight measurements (such as grams), the system SHALL search the ingredient name for known keywords to find a matching ingredient profile. If a known keyword (such as "flour", "butter", or "sugar") is found inside the name, the corresponding weight conversion MUST be applied. If no known keyword matches, the system SHALL fall back to a standard volume-to-volume conversion.

#### Scenario: Keyword match success
- **WHEN** the user views an ingredient named "organic cake flour"
- **THEN** the system matches the keyword "flour" and converts the volume using flour weight rules

#### Scenario: Keyword match fallback
- **WHEN** the user views an ingredient named "vanilla extract" which has no matching keyword in the list of recognized ingredients
- **THEN** the system falls back to a volume-to-volume conversion (e.g. teaspoons to milliliters)

### Requirement: Dual-Unit Display Conversion
The system SHALL format and display ingredients in a dual-unit system: `[US Measurement] ([Metric Measurement]) [Ingredient Name]`. The system MUST perform weight conversions for recognized ingredients, and fall back to volume-to-volume conversions for unrecognized ingredients.

#### Scenario: Displaying volume to weight conversion
- **WHEN** the user views a recipe containing "1 cup" of "butter"
- **THEN** the system uses the ingredient rules to render the line as "1 cup (227 g) butter"

#### Scenario: Displaying unrecognized ingredient fallback
- **WHEN** the user views a recipe containing "1 cup" of a custom ingredient "magic spice" not in the recognized list
- **THEN** the system falls back to volume-to-volume and renders "1 cup (240 ml) magic spice"

### Requirement: Quarter-Cup Volume Conversion Rule
For volume measurements less than a quarter-cup (1/4 cup, or 4 tablespoons), the system SHALL bypass weight conversions and format using standard volume-to-volume conversions.

#### Scenario: Bypassing weight conversion for small quantities
- **WHEN** the user views a recipe containing "2 tsp" of "flour"
- **THEN** the system bypasses weight conversions and renders "2 tsp (10 ml) flour"
