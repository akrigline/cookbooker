import { parseRecipeElement } from './recipeImport'
import { DEFAULT_ACCENT_COLOR } from './templates'
import { FAVORITE_ICONS } from './favorites'

const KNOWN_FAVORITE_ICONS = new Set(FAVORITE_ICONS.map((i) => i.id))

function metaContent(root, selector) {
  return root.querySelector(selector)?.getAttribute('content') ?? ''
}

function metaBool(root, selector, fallback) {
  const content = root.querySelector(selector)?.getAttribute('content')
  if (content === 'true') return true
  if (content === 'false') return false
  return fallback
}

// Falls back to document order (`chapterIndex`) for a missing, empty, or
// non-numeric `data-cm-chapter-sequence` - per design.md's Risk mitigation
// for a hand-edited or malformed file. `Array.prototype.sort` is stable
// (guaranteed since ES2019), so chapters that share a fallback/real sequence
// value keep their relative document order rather than being reordered
// arbitrarily.
function chapterSequence(chapterEl, chapterIndex) {
  const attr = chapterEl.getAttribute('data-cm-chapter-sequence')
  const parsed = attr === null || attr === '' ? NaN : Number(attr)
  return Number.isFinite(parsed) ? parsed : chapterIndex
}

/**
 * Parses cookbooker's `cookbook/1` structured HTML import format. Returns
 * `{ cookbook, failures, rejected }` - `rejected` is true only when the file
 * carries no `[data-cm-format="cookbook"]` root at all (same strict
 * whole-file-rejection contract `parseRecipeImportHtml` uses), in which case
 * `cookbook` is null and `failures` is empty.
 *
 * Each `[data-cm-format="recipe"]` article nested inside a `.cm-chapter`
 * section is parsed via the shared `parseRecipeElement` (recipeImport.js) -
 * a recipe that fails to parse is collected into `failures` as
 * `{ chapterName, label, reason }` rather than aborting the whole import; a
 * chapter with zero successfully-parsed recipes still comes back as an
 * (empty) chapter, per design.md Decision 5.
 */
export function parseCookbookImportHtml(text) {
  const doc = new DOMParser().parseFromString(text ?? '', 'text/html')
  const root = doc.querySelector('[data-cm-format="cookbook"]')

  if (!root) {
    return { cookbook: null, failures: [], rejected: true }
  }

  const title = metaContent(root, '.cm-cookbook-title')
  const subtitle = metaContent(root, '.cm-cookbook-subtitle')
  const accentColor = metaContent(root, '.cm-cookbook-accent-color') || DEFAULT_ACCENT_COLOR
  const coverTemplate = metaContent(root, '.cm-cookbook-cover-template') || 'classic'
  const pageNumbersEnabled = metaBool(root, '.cm-cookbook-page-numbers', true)
  const doubleSidedEnabled = metaBool(root, '.cm-cookbook-double-sided', false)
  const favoriteIconContent = metaContent(root, '.cm-cookbook-favorite-icon')
  const favoriteIcon = KNOWN_FAVORITE_ICONS.has(favoriteIconContent) ? favoriteIconContent : ''
  const favoriteTerminology = metaContent(root, '.cm-cookbook-favorite-terminology')

  const chapterEls = [...root.children].filter((el) => el.matches('.cm-chapter'))
  const failures = []

  const chapters = chapterEls.map((chapterEl, chapterIndex) => {
    const name = chapterEl.getAttribute('data-cm-chapter-name') || `Chapter ${chapterIndex + 1}`
    const sequence = chapterSequence(chapterEl, chapterIndex)

    const recipeEls = [...chapterEl.querySelectorAll('[data-cm-format="recipe"]')]
    const recipes = []
    recipeEls.forEach((recipeEl, recipeIndex) => {
      const result = parseRecipeElement(recipeEl, recipeIndex)
      if (result.recipe) {
        recipes.push(result.recipe)
      } else {
        failures.push({ chapterName: name, label: result.failure.label, reason: result.failure.reason })
      }
    })

    return { name, sequence, recipes }
  })

  chapters.sort((a, b) => a.sequence - b.sequence)

  return {
    cookbook: {
      title,
      subtitle,
      accentColor,
      coverTemplate,
      pageNumbersEnabled,
      doubleSidedEnabled,
      favoriteIcon,
      favoriteTerminology,
      chapters,
    },
    failures,
    rejected: false,
  }
}
