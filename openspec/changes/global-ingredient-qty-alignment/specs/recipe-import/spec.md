## MODIFIED Requirements

### Requirement: Recipe Field Extraction
For each matched, correctly-versioned recipe element, the system SHALL extract:
title (from `.cm-title`), ingredients (one raw line per `.cm-ingredients li`, parsed
via the application's existing ingredient-line parser), instructions (one step per
`.cm-instructions li`, or `.cm-instructions p` when no list items are present, joined
into a newline-separated string), notes (from `.cm-notes`, optional), layout
template (from `.cm-layout`'s `content` attribute when it is one of the application's
known template identifiers, defaulting to the standard template otherwise), ingredient
column count (from `.cm-ingredient-columns`'s `content` attribute when it is one of the
application's known column-count options, defaulting to the standard column count
otherwise), and image aspect ratio (from `.cm-image-aspect-ratio`'s `content`
attribute when it is one of the application's known aspect-ratio options, defaulting
to the standard aspect ratio otherwise). When a recipe element carries a `.cm-image`
element with a well-formed `data:` URI `src`, the system SHALL decode it into the
imported recipe's image; otherwise, or when decoding fails, the imported recipe's
image SHALL be absent/null. Ingredient quantity alignment is an app-wide display
preference, not recipe data; the system SHALL NOT read a `.cm-ingredient-qty-align`
element even when one is present (e.g. in a file exported before this change), and
an imported recipe carries no per-recipe alignment value of its own.

#### Scenario: Extracting a well-formed recipe
- **WHEN** a recipe element has a title, one or more ingredient list items, and one
  or more instruction list items
- **THEN** the system produces a candidate recipe with matching title, ingredients
  parsed through the application's standard ingredient parser, and instructions
  joined as a newline-separated string

#### Scenario: Optional fields are absent
- **WHEN** a recipe element has no `.cm-notes` section, no `.cm-layout` element, no
  `.cm-ingredient-columns` element, and no `.cm-image-aspect-ratio` element
- **THEN** the system produces a candidate recipe with empty notes and each of the
  standard layout template, ingredient column count, and image aspect ratio

#### Scenario: Instructions provided as paragraphs instead of a list
- **WHEN** a recipe element's `.cm-instructions` section contains `<p>` elements
  instead of `<li>` elements
- **THEN** the system extracts one instruction step per paragraph

#### Scenario: Recipe element carries a well-formed image
- **WHEN** a recipe element has a `.cm-image` element whose `src` is a well-formed
  `data:` URI
- **THEN** the system decodes it and produces a candidate recipe whose image matches
  the encoded bytes

#### Scenario: Recipe element has no image
- **WHEN** a recipe element has no `.cm-image` element
- **THEN** the system produces a candidate recipe with a null image, as before

#### Scenario: Recipe element carries a malformed image
- **WHEN** a recipe element has a `.cm-image` element whose `src` is not a
  well-formed `data:` URI, or whose payload fails to decode
- **THEN** the system produces a candidate recipe with a null image rather than
  failing to import the recipe

#### Scenario: Recipe element carries an unrecognized display-setting value
- **WHEN** a recipe element's `.cm-ingredient-columns` or `.cm-image-aspect-ratio`
  element has a `content` value the system does not recognize
- **THEN** the system falls back to the corresponding standard default for that
  setting, as if the element were absent

#### Scenario: Recipe element carries a legacy alignment meta element
- **WHEN** a recipe element (e.g. from a file exported before this change) carries a
  `.cm-ingredient-qty-align` element
- **THEN** the system ignores it; the imported recipe renders using the app-wide
  ingredient quantity alignment default, not any value from that element
