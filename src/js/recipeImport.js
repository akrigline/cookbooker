import { parseIngredientsText } from './conversions'
import {
  LAYOUT_TEMPLATES, DEFAULT_LAYOUT_TEMPLATE,
  INGREDIENT_COLUMN_OPTIONS,
  IMAGE_ASPECT_RATIOS
} from './templates'

const KNOWN_LAYOUT_IDS = new Set(LAYOUT_TEMPLATES.map((tpl) => tpl.id))
const KNOWN_COLUMNS = new Set(INGREDIENT_COLUMN_OPTIONS.map(String))
const KNOWN_ASPECT_RATIOS = new Set(IMAGE_ASPECT_RATIOS.map((o) => o.id))

export function dataUriToBlob(dataUri) {
  try {
    if (!dataUri) return null
    const match = dataUri.match(/^data:([^;]+);base64,(.+)$/)
    if (!match) return null
    const type = match[1]
    const b64Data = match[2]
    const byteString = atob(b64Data)
    const ab = new ArrayBuffer(byteString.length)
    const ia = new Uint8Array(ab)
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i)
    }
    return new Blob([ab], { type })
  } catch (err) {
    return null
  }
}


// Backstop for the prompt's "strip citation markers" instruction
// (recipeImportPrompt.js) - a noncompliant LLM response can still leave
// "[cite:1]", "[cite: 2, 5]", or "[1]"-style bracketed references in the
// text, so strip them here rather than trusting the model alone.
function stripCitationMarkers(text) {
  return text
    .replace(/\[cite:?\s*\d+(?:\s*,\s*\d+)*\]/gi, '')
    .replace(/\[\d+(?:\s*,\s*\d+)*\]/g, '')
    .replace(/\s+([.,!?;:])/g, '$1')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
}

function textOf(el) {
  return stripCitationMarkers((el?.textContent ?? '').trim())
}

function extractIngredients(root) {
  const lines = [...root.querySelectorAll('.cm-ingredients li')]
    .map((li) => textOf(li))
    .filter(Boolean)
  return parseIngredientsText(lines.join('\n'))
}

function extractInstructions(root) {
  let items = [...root.querySelectorAll('.cm-instructions li')]
  if (!items.length) items = [...root.querySelectorAll('.cm-instructions p')]
  return items
    .map((el) => textOf(el))
    .filter(Boolean)
    .join('\n')
}

function extractLayoutTemplate(root) {
  const content = root.querySelector('.cm-layout')?.getAttribute('content')
  return KNOWN_LAYOUT_IDS.has(content) ? content : DEFAULT_LAYOUT_TEMPLATE
}

function extractImage(root) {
  const img = root.querySelector('.cm-image')
  return img ? dataUriToBlob(img.getAttribute('src')) : null
}

function extractIngredientColumns(root) {
  const content = root.querySelector('.cm-ingredient-columns')?.getAttribute('content')
  return KNOWN_COLUMNS.has(content) ? Number(content) : 1
}

function extractImageAspectRatio(root) {
  const content = root.querySelector('.cm-image-aspect-ratio')?.getAttribute('content')
  return KNOWN_ASPECT_RATIOS.has(content) ? content : 'auto'
}

/**
 * Parses one `data-cm-format="recipe"` root element into either a candidate
 * recipe or a failure reason - mirrors the required-field validation
 * RecipeEditor.vue applies on manual save.
 */
function parseRecipeElement(root, index) {
  const label = `Recipe ${index + 1}`

  const version = root.getAttribute('data-cm-version')
  if (version !== '1') {
    return { failure: { label, reason: `Unrecognized or missing data-cm-version (got "${version ?? ''}")` } }
  }

  const title = textOf(root.querySelector('.cm-title'))
  const ingredients = extractIngredients(root)
  const instructions = extractInstructions(root)
  const notes = textOf(root.querySelector('.cm-notes'))
  const layoutTemplate = extractLayoutTemplate(root)
  const image = extractImage(root)
  const ingredientColumns = extractIngredientColumns(root)
  const imageAspectRatio = extractImageAspectRatio(root)

  if (!title) {
    return { failure: { label, reason: 'Missing or empty title (.cm-title)' } }
  }
  if (!instructions) {
    return { failure: { label, reason: 'Missing or empty instructions (.cm-instructions)' } }
  }

  return {
    recipe: {
      title,
      instructions,
      ingredients,
      notes,
      layoutTemplate,
      image,
      ingredientColumns,
      imageAspectRatio,
    },
  }
}

/**
 * Parses cookbooker's `recipe/1` structured HTML import format.
 * Returns { recipes, failures, rejected } - `rejected` is true when the file
 * carries no `data-cm-format="recipe"` marker at all (strict whole-file
 * rejection, per the format's strict-parsing contract), in which case
 * `recipes`/`failures` are both empty.
 */
export function parseRecipeImportHtml(text) {
  const doc = new DOMParser().parseFromString(text ?? '', 'text/html')
  const roots = [...doc.querySelectorAll('[data-cm-format="recipe"]')]

  if (!roots.length) {
    return { recipes: [], failures: [], rejected: true }
  }

  const recipes = []
  const failures = []

  roots.forEach((root, index) => {
    const result = parseRecipeElement(root, index)
    if (result.recipe) {
      recipes.push(result.recipe)
    } else {
      failures.push(result.failure)
    }
  })

  return { recipes, failures, rejected: false }
}
