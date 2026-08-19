## ADDED Requirements

### Requirement: Global Favorite Flag
Each recipe in the Global Recipe Library SHALL support a boolean `favorite` field, independent of any cookbook project it is associated with. Marking or unmarking a recipe as a favorite MUST update the single master record, so the favorite status is the same wherever the recipe appears.

#### Scenario: Marking a recipe favorite
- **WHEN** the user marks "Grandma's Pie Crust" as a favorite
- **THEN** the recipe's `favorite` field is set to `true` on its master record

#### Scenario: Favorite status is consistent across cookbooks
- **WHEN** a recipe marked as a favorite appears in two different cookbook projects
- **THEN** both cookbooks reflect the same favorite status for that recipe

### Requirement: Per-Cookbook Favorites Display Configuration
Each cookbook project SHALL support choosing a favorites icon (one of: sock, star, heart) and an optional title-prefix terminology string. A blank or whitespace-only terminology value SHALL mean no title prefix is rendered for that cookbook; a non-blank value SHALL be used as the prefix (e.g. "Sacred") wherever a favorite recipe's title is rendered within that cookbook.

#### Scenario: Choosing an icon and terminology
- **WHEN** the user configures a cookbook's favorites icon as "sock" and terminology as "Sacred"
- **THEN** the project persists `favoriteIcon: "sock"` and `favoriteTerminology: "Sacred"`

#### Scenario: Blank terminology means icon-only
- **WHEN** a cookbook's favorites terminology is blank
- **THEN** favorite recipes within that cookbook display the configured icon but no title prefix

### Requirement: Context-Dependent Favorite Icon
Wherever a favorite indicator or toggle is rendered outside the context of a specific cookbook project (the recipe editor, the Global Recipe Library), the system SHALL always use the heart icon, regardless of any cookbook's configured icon. Wherever a favorite indicator is rendered within the context of a specific cookbook project (a chapter recipe row, the Table of Contents, a printed/previewed recipe page), the system SHALL use that cookbook's configured icon.

#### Scenario: Library toggle always shows heart
- **WHEN** the Global Recipe Library renders a favorite toggle for a recipe
- **THEN** the toggle uses the heart icon regardless of any cookbook's configured favorites icon

#### Scenario: Recipe editor toggle always shows heart
- **WHEN** the recipe editor renders a favorite toggle
- **THEN** the toggle uses the heart icon regardless of any cookbook's configured favorites icon

#### Scenario: Cookbook-scoped indicator uses the cookbook's icon
- **WHEN** a favorite recipe's badge is rendered on a chapter recipe row, in the Table of Contents, or on a printed/previewed recipe page for a specific cookbook
- **THEN** the badge uses that cookbook's configured favorites icon (sock, star, or heart)
