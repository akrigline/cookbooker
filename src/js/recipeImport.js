import { parseIngredientsText } from './conversions'
import { LAYOUT_TEMPLATES, DEFAULT_LAYOUT_TEMPLATE } from './templates'

const KNOWN_LAYOUT_IDS = new Set(LAYOUT_TEMPLATES.map((tpl) => tpl.id))

function textOf(el) {
  return (el?.textContent ?? '').trim()
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
      image: null,
    },
  }
}

/**
 * Parses cookbook-maker's `recipe/1` structured HTML import format.
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
