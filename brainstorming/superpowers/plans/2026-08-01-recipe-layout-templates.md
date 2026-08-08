# Recipe Layout Templates Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current 3 CSS-Grid recipe layouts with 7 Flexbox-based layout templates (Tier 2), dynamically selected by `RecipeSheet.vue` (Tier 3), reusing the 5 content components (Tier 1) already shipped in `docs/superpowers/specs/2026-08-01-recipe-sheet-componentization-design.md`.

**Architecture:** Three-tier component architecture. Tier 1 (`RecipeTitle`/`RecipeImage`/`RecipeIngredients`/`RecipeInstructions`/`RecipeNotes`) already exists and is unchanged by this plan. Tier 2 is 7 new presentational components, one per layout, each taking a single `recipe` prop and arranging Tier 1 components with plain Flexbox — no visual styling of their own beyond spacing/proportions. Tier 3 is `RecipeSheet.vue`, rewritten to own the page frame (padding, background, accent color) and dynamically render the Tier 2 component matching `recipe.layoutTemplate` via `<component :is>`.

**Tech Stack:** Vue 3 `<script setup>` SFCs, scoped `<style>` blocks using the project's existing CSS custom properties (`--space-md`, `--space-lg`, `--recipe-accent`, `--bg-primary`, etc.) — **no Tailwind** (not installed in this project; rejected for this work).

## Global Constraints

- No Tailwind. Use scoped Vue `<style>` blocks and the CSS custom properties already defined globally and consumed by `RecipeSheet.vue`/Tier 1 components (`--space-xs/sm/md/lg`, `--recipe-accent`, `--bg-primary`, `--text-primary`, `--font-main`, `--border-color`).
- Flat `src/components/` directory — matches the existing convention (`ChapterDividerPage.vue`, `CoverPage.vue`, the 5 Tier 1 components, etc. are not nested). New files: `RecipeLayout<Name>.vue`.
- No component-level tests. This repo has no `@vue/test-utils` and no precedent for testing `.vue` rendering (confirmed in the componentization design doc, user-approved). Tier 2 components are verified visually via the live preview in `RecipeEditor.vue`, same as Tier 1. Only plain-JS logic changes (the template registry, import fallback) get real unit tests.
- Each Tier 2 component receives the **same flat `recipe` object** `RecipeSheet.vue` already receives from the DB/store — `recipe.title`, `recipe.image` (Blob or null), `recipe.imageAspectRatio`, `recipe.ingredients` (parsed array), `recipe.ingredientColumns`, `recipe.instructions` (raw newline-delimited string), `recipe.notes`. No nested `config`/`image.src`/`image.altText` schema — that shape doesn't exist anywhere in this codebase and does not get introduced. `ingredientColumns`/`imageAspectRatio` stay full-range, recipe-level knobs independent of which template is active (confirmed decision — a layout template must never hardcode or constrain either value, even where the original design sketch suggested it, e.g. "square image" in the dual-column layout below).
- Dropped from the original draft plan, not carried into this one (unreferenced by any layout, ungrounded in any existing spec — see evaluation in conversation): `config.ingredientsLayout` (columnar/tabular), `config.numberingStyle`, `RecipeImage`'s `printGrayscale` filter, `image.altText`. Revisit as separate, independently-scoped features if actually needed later.
- **Replacing, not adding to,** the existing 3 templates (`standard`, `image-heavy`, `text-only`). This app has no multi-user migration concern (local IndexedDB, pre-launch redesign branch) and the existing 3 were explicitly built as a placeholder ("more layout templates are being designed separately" — componentization design doc). `text-only` is carried forward as one of the 7 (same id, reimplemented as a Tier 2 component) since none of the 6 newly-designed layouts drop the image slot and a no-image option is worth keeping.
- New template ids (kebab-case) and default:
  - `hero-split-balanced` (**new default**, replaces `standard` as the fallback — closest visual analog: title/image/notes on top, ingredients/instructions split below)
  - `hero-split-asymmetric`
  - `asymmetric-sidebar`
  - `column-optimized`
  - `balanced-header`
  - `dual-column-bottom-split`
  - `text-only` (id unchanged from today)
- `templates.js` gains a `hasImage: boolean` field per template so `RecipeEditor.vue` can hide the image-aspect-ratio control for image-less templates without hardcoding an id check (today it hardcodes `=== 'text-only'` in two places).

---

## File Structure

**New (Tier 2 — one file per layout, no tests, see Global Constraints):**
- `src/components/RecipeLayoutHeroSplitBalanced.vue`
- `src/components/RecipeLayoutHeroSplitAsymmetric.vue`
- `src/components/RecipeLayoutAsymmetricSidebar.vue`
- `src/components/RecipeLayoutColumnOptimized.vue`
- `src/components/RecipeLayoutBalancedHeader.vue`
- `src/components/RecipeLayoutDualColumnBottomSplit.vue`
- `src/components/RecipeLayoutTextOnly.vue`

**Modified:**
- `src/components/RecipeSheet.vue` — becomes the Tier 3 dynamic dispatcher (page frame + `<component :is>`)
- `src/js/templates.js` — new `LAYOUT_TEMPLATES` ids/labels/`hasImage`, new `DEFAULT_LAYOUT_TEMPLATE` export
- `src/js/db.js` — seed recipe's `layoutTemplate` default
- `src/js/recipeImport.js` — fallback default when `<meta class="cm-layout">` is absent/unrecognized
- `src/js/recipeImportPrompt.js` — example `content="standard"` → a valid id
- `src/views/RecipeEditor.vue` — default ref + `showImageAspectControl` driven by `hasImage` metadata instead of a hardcoded id check
- `src/js/backup.roundtrip.test.js`, `src/stores/recipes.test.js`, `src/stores/projects.test.js` — fixture data uses `'standard'` as an arbitrary string; renamed for consistency (not required for correctness, these tests don't validate the id against the registry)
- `src/js/recipeImport.test.js` — add one assertion for the new default-fallback id

---

## Task 1: `RecipeLayoutHeroSplitBalanced.vue`

**Files:**
- Create: `src/components/RecipeLayoutHeroSplitBalanced.vue`

**Interfaces:**
- Consumes: `RecipeTitle{title:String}`, `RecipeImage{image:Blob|String|null, aspectRatio:String}`, `RecipeIngredients{ingredients:Array, columns:Number}`, `RecipeInstructions{instructions:String}`, `RecipeNotes{notes:String}` (all already shipped in `src/components/`)
- Produces: a component accepting `recipe: Object` (required), for Task 8's registry

- [ ] **Step 1: Create the component**

```vue
<script setup>
import RecipeTitle from './RecipeTitle.vue'
import RecipeImage from './RecipeImage.vue'
import RecipeIngredients from './RecipeIngredients.vue'
import RecipeInstructions from './RecipeInstructions.vue'
import RecipeNotes from './RecipeNotes.vue'

defineProps({
  recipe: {
    type: Object,
    required: true,
  },
})
</script>

<template>
  <div class="layout-hero-split-balanced">
    <div class="layout-hero-split-balanced__hero">
      <RecipeTitle :title="recipe.title" />
      <RecipeImage :image="recipe.image" :aspect-ratio="recipe.imageAspectRatio ?? 'auto'" />
      <RecipeNotes v-if="recipe.notes" :notes="recipe.notes" />
    </div>
    <div class="layout-hero-split-balanced__split">
      <RecipeIngredients
        class="layout-hero-split-balanced__col"
        :ingredients="recipe.ingredients"
        :columns="recipe.ingredientColumns ?? 1"
      />
      <RecipeInstructions class="layout-hero-split-balanced__col" :instructions="recipe.instructions" />
    </div>
  </div>
</template>

<style scoped>
.layout-hero-split-balanced {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
  height: 100%;
}

.layout-hero-split-balanced__hero {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.layout-hero-split-balanced__split {
  display: flex;
  flex-direction: row;
  gap: var(--space-lg);
  flex: 1;
}

.layout-hero-split-balanced__col {
  flex: 1 1 50%;
  min-width: 0;
}
</style>
```

- [ ] **Step 2: Verify visually**

No test to run — this is a pure presentational component with no precedent for component tests in this repo (see Global Constraints). It's wired up and checked visually in Task 8/9.

- [ ] **Step 3: Commit**

```bash
git add src/components/RecipeLayoutHeroSplitBalanced.vue
git commit -m "feat: add hero-split-balanced recipe layout template"
```

---

## Task 2: `RecipeLayoutHeroSplitAsymmetric.vue`

**Files:**
- Create: `src/components/RecipeLayoutHeroSplitAsymmetric.vue`

**Interfaces:**
- Consumes: same Tier 1 components as Task 1
- Produces: a component accepting `recipe: Object` (required), for Task 8's registry

- [ ] **Step 1: Create the component**

Identical structure to `RecipeLayoutHeroSplitBalanced.vue`, but the ingredients/instructions split is 1/3–2/3 instead of 1/2–1/2.

```vue
<script setup>
import RecipeTitle from './RecipeTitle.vue'
import RecipeImage from './RecipeImage.vue'
import RecipeIngredients from './RecipeIngredients.vue'
import RecipeInstructions from './RecipeInstructions.vue'
import RecipeNotes from './RecipeNotes.vue'

defineProps({
  recipe: {
    type: Object,
    required: true,
  },
})
</script>

<template>
  <div class="layout-hero-split-asymmetric">
    <div class="layout-hero-split-asymmetric__hero">
      <RecipeTitle :title="recipe.title" />
      <RecipeImage :image="recipe.image" :aspect-ratio="recipe.imageAspectRatio ?? 'auto'" />
      <RecipeNotes v-if="recipe.notes" :notes="recipe.notes" />
    </div>
    <div class="layout-hero-split-asymmetric__split">
      <RecipeIngredients
        class="layout-hero-split-asymmetric__ingredients"
        :ingredients="recipe.ingredients"
        :columns="recipe.ingredientColumns ?? 1"
      />
      <RecipeInstructions
        class="layout-hero-split-asymmetric__instructions"
        :instructions="recipe.instructions"
      />
    </div>
  </div>
</template>

<style scoped>
.layout-hero-split-asymmetric {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
  height: 100%;
}

.layout-hero-split-asymmetric__hero {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.layout-hero-split-asymmetric__split {
  display: flex;
  flex-direction: row;
  gap: var(--space-lg);
  flex: 1;
}

.layout-hero-split-asymmetric__ingredients {
  flex: 0 0 33%;
  min-width: 0;
}

.layout-hero-split-asymmetric__instructions {
  flex: 1 1 67%;
  min-width: 0;
}
</style>
```

- [ ] **Step 2: Verify visually** (see Task 1, Step 2 — same rationale)

- [ ] **Step 3: Commit**

```bash
git add src/components/RecipeLayoutHeroSplitAsymmetric.vue
git commit -m "feat: add hero-split-asymmetric recipe layout template"
```

---

## Task 3: `RecipeLayoutAsymmetricSidebar.vue`

**Files:**
- Create: `src/components/RecipeLayoutAsymmetricSidebar.vue`

**Interfaces:**
- Consumes: same Tier 1 components as Task 1
- Produces: a component accepting `recipe: Object` (required), for Task 8's registry

- [ ] **Step 1: Create the component**

```vue
<script setup>
import RecipeTitle from './RecipeTitle.vue'
import RecipeImage from './RecipeImage.vue'
import RecipeIngredients from './RecipeIngredients.vue'
import RecipeInstructions from './RecipeInstructions.vue'
import RecipeNotes from './RecipeNotes.vue'

defineProps({
  recipe: {
    type: Object,
    required: true,
  },
})
</script>

<template>
  <div class="layout-asymmetric-sidebar">
    <div class="layout-asymmetric-sidebar__aside">
      <RecipeTitle :title="recipe.title" />
      <RecipeImage :image="recipe.image" :aspect-ratio="recipe.imageAspectRatio ?? 'auto'" />
      <RecipeNotes v-if="recipe.notes" :notes="recipe.notes" />
    </div>
    <div class="layout-asymmetric-sidebar__main">
      <RecipeIngredients :ingredients="recipe.ingredients" :columns="recipe.ingredientColumns ?? 1" />
      <RecipeInstructions :instructions="recipe.instructions" />
    </div>
  </div>
</template>

<style scoped>
.layout-asymmetric-sidebar {
  display: flex;
  flex-direction: row;
  gap: var(--space-lg);
  height: 100%;
}

.layout-asymmetric-sidebar__aside {
  flex: 0 0 33%;
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.layout-asymmetric-sidebar__main {
  flex: 1 1 67%;
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
  min-width: 0;
}
</style>
```

- [ ] **Step 2: Verify visually** (see Task 1, Step 2 — same rationale)

- [ ] **Step 3: Commit**

```bash
git add src/components/RecipeLayoutAsymmetricSidebar.vue
git commit -m "feat: add asymmetric-sidebar recipe layout template"
```

---

## Task 4: `RecipeLayoutColumnOptimized.vue`

**Files:**
- Create: `src/components/RecipeLayoutColumnOptimized.vue`

**Interfaces:**
- Consumes: same Tier 1 components as Task 1
- Produces: a component accepting `recipe: Object` (required), for Task 8's registry

This is the layout discussed at length earlier: Chef's Notes and Ingredients must stack in the left column independently of Image and Instructions in the right column (a short Notes lets Ingredients slide up, unaffected by the right column's height). This requires two real nested flex-column containers — it cannot be done with CSS Grid's `grid-template-areas` (row tracks are shared across columns). Each side below is its own `display: flex; flex-direction: column` container, which gives genuinely independent vertical flow for free.

- [ ] **Step 1: Create the component**

```vue
<script setup>
import RecipeTitle from './RecipeTitle.vue'
import RecipeImage from './RecipeImage.vue'
import RecipeIngredients from './RecipeIngredients.vue'
import RecipeInstructions from './RecipeInstructions.vue'
import RecipeNotes from './RecipeNotes.vue'

defineProps({
  recipe: {
    type: Object,
    required: true,
  },
})
</script>

<template>
  <div class="layout-column-optimized">
    <RecipeTitle :title="recipe.title" />
    <div class="layout-column-optimized__split">
      <div class="layout-column-optimized__col">
        <RecipeNotes v-if="recipe.notes" :notes="recipe.notes" />
        <RecipeIngredients :ingredients="recipe.ingredients" :columns="recipe.ingredientColumns ?? 1" />
      </div>
      <div class="layout-column-optimized__col">
        <RecipeImage :image="recipe.image" :aspect-ratio="recipe.imageAspectRatio ?? 'auto'" />
        <RecipeInstructions :instructions="recipe.instructions" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.layout-column-optimized {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
  height: 100%;
}

.layout-column-optimized__split {
  display: flex;
  flex-direction: row;
  gap: var(--space-lg);
  flex: 1;
}

.layout-column-optimized__col {
  flex: 1 1 50%;
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  min-width: 0;
}
</style>
```

- [ ] **Step 2: Verify visually** — specifically confirm the independent-flow behavior: with a short Chef's Notes (or none) and a tall image, Ingredients should sit directly under Notes, not pushed down to align with Instructions in the right column.

- [ ] **Step 3: Commit**

```bash
git add src/components/RecipeLayoutColumnOptimized.vue
git commit -m "feat: add column-optimized recipe layout template"
```

---

## Task 5: `RecipeLayoutBalancedHeader.vue`

**Files:**
- Create: `src/components/RecipeLayoutBalancedHeader.vue`

**Interfaces:**
- Consumes: same Tier 1 components as Task 1
- Produces: a component accepting `recipe: Object` (required), for Task 8's registry

- [ ] **Step 1: Create the component**

```vue
<script setup>
import RecipeTitle from './RecipeTitle.vue'
import RecipeImage from './RecipeImage.vue'
import RecipeIngredients from './RecipeIngredients.vue'
import RecipeInstructions from './RecipeInstructions.vue'
import RecipeNotes from './RecipeNotes.vue'

defineProps({
  recipe: {
    type: Object,
    required: true,
  },
})
</script>

<template>
  <div class="layout-balanced-header">
    <div class="layout-balanced-header__row">
      <RecipeTitle class="layout-balanced-header__title" :title="recipe.title" />
      <RecipeImage
        class="layout-balanced-header__image"
        :image="recipe.image"
        :aspect-ratio="recipe.imageAspectRatio ?? 'auto'"
      />
    </div>
    <RecipeNotes v-if="recipe.notes" :notes="recipe.notes" />
    <RecipeIngredients :ingredients="recipe.ingredients" :columns="recipe.ingredientColumns ?? 1" />
    <RecipeInstructions :instructions="recipe.instructions" />
  </div>
</template>

<style scoped>
.layout-balanced-header {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
  height: 100%;
}

.layout-balanced-header__row {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: var(--space-lg);
}

.layout-balanced-header__title {
  flex: 1 1 auto;
  min-width: 0;
}

.layout-balanced-header__image {
  flex: 0 0 38%;
}
</style>
```

- [ ] **Step 2: Verify visually** (see Task 1, Step 2 — same rationale)

- [ ] **Step 3: Commit**

```bash
git add src/components/RecipeLayoutBalancedHeader.vue
git commit -m "feat: add balanced-header recipe layout template"
```

---

## Task 6: `RecipeLayoutDualColumnBottomSplit.vue`

**Files:**
- Create: `src/components/RecipeLayoutDualColumnBottomSplit.vue`

**Interfaces:**
- Consumes: same Tier 1 components as Task 1
- Produces: a component accepting `recipe: Object` (required), for Task 8's registry

Note: the original draft sketch suggested forcing the image to a square aspect ratio in this layout. Per the Global Constraints, `imageAspectRatio` stays a recipe-level knob independent of template — this component passes `recipe.imageAspectRatio` through like every other layout, it does not hardcode `'1:1'`.

- [ ] **Step 1: Create the component**

```vue
<script setup>
import RecipeTitle from './RecipeTitle.vue'
import RecipeImage from './RecipeImage.vue'
import RecipeIngredients from './RecipeIngredients.vue'
import RecipeInstructions from './RecipeInstructions.vue'
import RecipeNotes from './RecipeNotes.vue'

defineProps({
  recipe: {
    type: Object,
    required: true,
  },
})
</script>

<template>
  <div class="layout-dual-column-bottom-split">
    <RecipeTitle class="layout-dual-column-bottom-split__title" :title="recipe.title" />
    <RecipeIngredients :ingredients="recipe.ingredients" :columns="recipe.ingredientColumns ?? 1" />
    <div class="layout-dual-column-bottom-split__split">
      <div class="layout-dual-column-bottom-split__col">
        <RecipeImage :image="recipe.image" :aspect-ratio="recipe.imageAspectRatio ?? 'auto'" />
        <RecipeNotes v-if="recipe.notes" :notes="recipe.notes" />
      </div>
      <RecipeInstructions
        class="layout-dual-column-bottom-split__instructions"
        :instructions="recipe.instructions"
      />
    </div>
  </div>
</template>

<style scoped>
.layout-dual-column-bottom-split {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
  height: 100%;
}

.layout-dual-column-bottom-split__title {
  text-align: center;
}

.layout-dual-column-bottom-split__split {
  display: flex;
  flex-direction: row;
  gap: var(--space-lg);
  flex: 1;
}

.layout-dual-column-bottom-split__col {
  flex: 0 0 38%;
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.layout-dual-column-bottom-split__instructions {
  flex: 1 1 62%;
  min-width: 0;
}
</style>
```

- [ ] **Step 2: Verify visually** (see Task 1, Step 2 — same rationale)

- [ ] **Step 3: Commit**

```bash
git add src/components/RecipeLayoutDualColumnBottomSplit.vue
git commit -m "feat: add dual-column-bottom-split recipe layout template"
```

---

## Task 7: `RecipeLayoutTextOnly.vue`

**Files:**
- Create: `src/components/RecipeLayoutTextOnly.vue`

**Interfaces:**
- Consumes: `RecipeTitle`, `RecipeIngredients`, `RecipeInstructions`, `RecipeNotes` (no `RecipeImage` — this is the no-image layout)
- Produces: a component accepting `recipe: Object` (required), for Task 8's registry

- [ ] **Step 1: Create the component**

```vue
<script setup>
import RecipeTitle from './RecipeTitle.vue'
import RecipeIngredients from './RecipeIngredients.vue'
import RecipeInstructions from './RecipeInstructions.vue'
import RecipeNotes from './RecipeNotes.vue'

defineProps({
  recipe: {
    type: Object,
    required: true,
  },
})
</script>

<template>
  <div class="layout-text-only">
    <RecipeTitle :title="recipe.title" />
    <div class="layout-text-only__split">
      <RecipeIngredients
        class="layout-text-only__col"
        :ingredients="recipe.ingredients"
        :columns="recipe.ingredientColumns ?? 1"
      />
      <RecipeInstructions class="layout-text-only__col" :instructions="recipe.instructions" />
    </div>
    <RecipeNotes v-if="recipe.notes" :notes="recipe.notes" />
  </div>
</template>

<style scoped>
.layout-text-only {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
  height: 100%;
}

.layout-text-only__split {
  display: flex;
  flex-direction: row;
  gap: var(--space-lg);
  flex: 1;
}

.layout-text-only__col {
  flex: 1 1 50%;
  min-width: 0;
}
</style>
```

- [ ] **Step 2: Verify visually** (see Task 1, Step 2 — same rationale)

- [ ] **Step 3: Commit**

```bash
git add src/components/RecipeLayoutTextOnly.vue
git commit -m "feat: add text-only recipe layout template"
```

---

## Task 8: Wire the registry and switch `RecipeSheet.vue` to dynamic dispatch

**Files:**
- Modify: `src/js/templates.js`
- Modify: `src/components/RecipeSheet.vue`
- Modify: `src/js/db.js`
- Modify: `src/js/recipeImport.js`
- Modify: `src/js/recipeImportPrompt.js`
- Modify: `src/views/RecipeEditor.vue`
- Modify: `src/js/backup.roundtrip.test.js`, `src/stores/recipes.test.js`, `src/stores/projects.test.js` (fixture cleanup)
- Test: `src/js/recipeImport.test.js` (new assertion)

**Interfaces:**
- Consumes: the 7 Tier 2 components from Tasks 1–7 (each: `recipe: Object` prop)
- Produces: `LAYOUT_TEMPLATES: Array<{id, label, hasImage}>` and `DEFAULT_LAYOUT_TEMPLATE: string` exported from `src/js/templates.js`, consumed by `RecipeEditor.vue` and `recipeImport.js`

This task lands atomically — the old `'standard'`/`'image-heavy'`/`'text-only'` ids and the new ones can't coexist half-migrated without breaking the fallback logic in four different files.

- [ ] **Step 1: Write the failing test for the new import fallback**

Add to `src/js/recipeImport.test.js` (after the existing `'parses a well-formed batch file...'` test, which already exercises `BATCH_RECIPES` — recipes with no `<meta class="cm-layout">` at all):

```js
  it('defaults layoutTemplate to the registry default when omitted', () => {
    const { recipes } = parseRecipeImportHtml(BATCH_RECIPES)
    expect(recipes[0].layoutTemplate).toBe('hero-split-balanced')
  })
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- --run recipeImport`
Expected: FAIL — `recipes[0].layoutTemplate` is currently `'standard'`, not `'hero-split-balanced'`.

- [ ] **Step 3: Rewrite `src/js/templates.js`**

Replace the existing `LAYOUT_TEMPLATES` export (lines 1–5) with:

```js
export const LAYOUT_TEMPLATES = [
  { id: 'hero-split-balanced', label: 'Hero Split (Balanced)', hasImage: true },
  { id: 'hero-split-asymmetric', label: 'Hero Split (Asymmetric)', hasImage: true },
  { id: 'asymmetric-sidebar', label: 'Asymmetric Sidebar', hasImage: true },
  { id: 'column-optimized', label: 'Column Optimized', hasImage: true },
  { id: 'balanced-header', label: 'Balanced Header', hasImage: true },
  { id: 'dual-column-bottom-split', label: 'Dual Column, Bottom Split', hasImage: true },
  { id: 'text-only', label: 'Text-Only (no image container)', hasImage: false },
]

export const DEFAULT_LAYOUT_TEMPLATE = 'hero-split-balanced'
```

- [ ] **Step 4: Rewrite `src/components/RecipeSheet.vue`**

```vue
<script setup>
import { computed } from 'vue'
import { DEFAULT_LAYOUT_TEMPLATE } from '../js/templates'
import RecipeLayoutHeroSplitBalanced from './RecipeLayoutHeroSplitBalanced.vue'
import RecipeLayoutHeroSplitAsymmetric from './RecipeLayoutHeroSplitAsymmetric.vue'
import RecipeLayoutAsymmetricSidebar from './RecipeLayoutAsymmetricSidebar.vue'
import RecipeLayoutColumnOptimized from './RecipeLayoutColumnOptimized.vue'
import RecipeLayoutBalancedHeader from './RecipeLayoutBalancedHeader.vue'
import RecipeLayoutDualColumnBottomSplit from './RecipeLayoutDualColumnBottomSplit.vue'
import RecipeLayoutTextOnly from './RecipeLayoutTextOnly.vue'

const LAYOUT_COMPONENTS = {
  'hero-split-balanced': RecipeLayoutHeroSplitBalanced,
  'hero-split-asymmetric': RecipeLayoutHeroSplitAsymmetric,
  'asymmetric-sidebar': RecipeLayoutAsymmetricSidebar,
  'column-optimized': RecipeLayoutColumnOptimized,
  'balanced-header': RecipeLayoutBalancedHeader,
  'dual-column-bottom-split': RecipeLayoutDualColumnBottomSplit,
  'text-only': RecipeLayoutTextOnly,
}

const props = defineProps({
  recipe: {
    type: Object,
    required: true,
  },
  accentColor: {
    type: String,
    default: '#d97742',
  },
})

const activeLayout = computed(
  () => LAYOUT_COMPONENTS[props.recipe.layoutTemplate] ?? LAYOUT_COMPONENTS[DEFAULT_LAYOUT_TEMPLATE],
)
</script>

<template>
  <article class="recipe-sheet" :style="{ '--recipe-accent': accentColor }">
    <component :is="activeLayout" :recipe="recipe" />
  </article>
</template>

<style scoped>
.recipe-sheet {
  --recipe-accent: #d97742;
  height: 100%;
  padding: var(--space-lg);
  box-sizing: border-box;
  background: var(--bg-primary, #fff);
  color: var(--text-primary, #232323);
  font-family: var(--font-main, serif);
  position: relative;
}
</style>
```

(Unlike the current version, `LAYOUT_TEMPLATES` itself is no longer imported here for lookup — the local `LAYOUT_COMPONENTS` map is keyed by the same ids for direct component resolution. `templates.js` stays a plain-data module — `recipeImport.js`, a non-Vue module, still imports only `LAYOUT_TEMPLATES`/`DEFAULT_LAYOUT_TEMPLATE` from it, not any `.vue` file.)

- [ ] **Step 5: Update the seed recipe default in `src/js/db.js`**

```js
    layoutTemplate: 'hero-split-balanced',
```
(replaces `layoutTemplate: 'standard',` on the line just above `ingredientColumns: 1,`)

- [ ] **Step 6: Update `src/js/recipeImport.js`**

```js
import { parseIngredientsText } from './conversions'
import { LAYOUT_TEMPLATES, DEFAULT_LAYOUT_TEMPLATE } from './templates'

const KNOWN_LAYOUT_IDS = new Set(LAYOUT_TEMPLATES.map((tpl) => tpl.id))
```

and:

```js
function extractLayoutTemplate(root) {
  const content = root.querySelector('.cm-layout')?.getAttribute('content')
  return KNOWN_LAYOUT_IDS.has(content) ? content : DEFAULT_LAYOUT_TEMPLATE
}
```

- [ ] **Step 7: Update the example in `src/js/recipeImportPrompt.js`**

Change:
```
  <meta class="cm-layout" content="standard">
```
to:
```
  <meta class="cm-layout" content="hero-split-balanced">
```

- [ ] **Step 8: Update `src/views/RecipeEditor.vue`**

Change the import:
```js
import { LAYOUT_TEMPLATES, INGREDIENT_COLUMN_OPTIONS, IMAGE_ASPECT_RATIOS } from '../js/templates'
```
to:
```js
import { LAYOUT_TEMPLATES, DEFAULT_LAYOUT_TEMPLATE, INGREDIENT_COLUMN_OPTIONS, IMAGE_ASPECT_RATIOS } from '../js/templates'
```

Change the initial ref:
```js
const layoutTemplate = ref(DEFAULT_LAYOUT_TEMPLATE)
```
(replaces `const layoutTemplate = ref('standard')`)

Change the restore-on-edit line:
```js
      layoutTemplate.value = recipe.layoutTemplate ?? DEFAULT_LAYOUT_TEMPLATE
```
(replaces `layoutTemplate.value = recipe.layoutTemplate ?? 'standard'`)

Replace `showImageAspectControl` to use the new `hasImage` metadata instead of a hardcoded id:
```js
const showImageAspectControl = computed(() => {
  const active = LAYOUT_TEMPLATES.find((tpl) => tpl.id === layoutTemplate.value)
  return active ? active.hasImage : true
})
```
(replaces `const showImageAspectControl = computed(() => layoutTemplate.value !== 'text-only')`)

- [ ] **Step 9: Clean up test fixtures**

In `src/js/backup.roundtrip.test.js`, replace all four occurrences of `layoutTemplate: 'standard',` with `layoutTemplate: 'hero-split-balanced',`.

In `src/stores/recipes.test.js` and `src/stores/projects.test.js`, replace `layoutTemplate: 'standard',` with `layoutTemplate: 'hero-split-balanced',` (one occurrence each).

- [ ] **Step 10: Run the full test suite to verify everything passes**

Run: `npm test`
Expected: PASS (all suites, including the new `recipeImport.test.js` assertion from Step 1)

- [ ] **Step 11: Run the production build**

Run: `npm run build`
Expected: succeeds with no errors

- [ ] **Step 12: Commit**

```bash
git add src/js/templates.js src/components/RecipeSheet.vue src/js/db.js src/js/recipeImport.js \
  src/js/recipeImportPrompt.js src/views/RecipeEditor.vue src/js/backup.roundtrip.test.js \
  src/stores/recipes.test.js src/stores/projects.test.js src/js/recipeImport.test.js
git commit -m "feat: switch RecipeSheet to dynamic Tier 2 layout dispatch"
```

---

## Task 9: Manual visual verification

**Files:** none (verification only)

- [ ] **Step 1: Start the dev server**

Run: `npm run dev`

- [ ] **Step 2: Open the recipe editor and cycle through all 7 templates**

Navigate to an existing recipe's edit page (e.g. `/library/1`). For each of the 7 buttons in the "Layout template" picker, confirm in the live preview:
- Title, ingredients, instructions, and (where present) image and notes all render
- No content overlaps or overflows its column
- `column-optimized`: with Chef's Notes left short or empty, Ingredients sits directly under Notes rather than aligning with Instructions on the right (the independent-flow behavior from Task 4)

- [ ] **Step 3: Re-check the two existing per-recipe knobs still work under the new templates**

Cycle "Ingredient columns" (1–4) and "Image aspect ratio" (Auto/Square/Landscape/Portrait/Wide) on at least two different templates (e.g. `hero-split-balanced` and `dual-column-bottom-split`) and confirm both still take effect and `text-only` still hides the aspect-ratio control.

- [ ] **Step 4: Stop the dev server**

---

## Self-Review Notes

- **Spec coverage:** all 6 layouts from the original draft plan (Asymmetric Sidebar, Hero Split Balanced, Hero Split Asymmetric, Column Optimized, Balanced Header, Dual Column Bottom Split) have a task; `text-only` is carried forward as a 7th so the "no image" option isn't lost in the replacement. The three cross-cutting issues raised during evaluation (data schema, Tailwind, orphaned config fields) are resolved in Global Constraints rather than left as open questions.
- **Placeholder scan:** no TBD/TODO; every step has real code or a real command.
- **Type consistency:** every Tier 2 component uses the identical `recipe: Object` prop signature; `RecipeSheet.vue`'s `LAYOUT_COMPONENTS` keys match `templates.js`'s `LAYOUT_TEMPLATES` ids exactly (both hand-written from the same list in Global Constraints).
