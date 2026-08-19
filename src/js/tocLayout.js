import { createApp, h, nextTick } from 'vue'
import TableOfContentsPage from '../components/TableOfContentsPage.vue'
import { maxPageNumberDigits } from './compileBook.js'
import { pageContentBox, DEFAULT_PAPER_SIZE } from './pageDimensions.js'
import { OUTSIDE_CONTEXT_ICON } from './favorites.js'

/**
 * Flattens a chapter plan (buildChapterPlan's output) into an ordered list of
 * TOC row descriptors - a chapter header immediately followed by its own
 * recipes, in the same order the book itself prints them. Pure and
 * DOM-free, so it's directly unit-testable.
 */
export function buildTocRows(chapterPlan) {
  const rows = []
  for (const { chapter, recipes } of chapterPlan) {
    rows.push({ type: 'chapter', chapter })
    for (const recipe of recipes) rows.push({ type: 'recipe', chapter, recipe })
  }
  return rows
}

// Explicit width AND height (not just width) so TableOfContentsPage's own
// `height: 100%` / `grid-template-rows: auto 1fr` chain has something real to
// resolve against off-screen, exactly as it would inside PagePreview.vue's box
// on the actual page.
//
// The width is the part that bites: it comes from pageDimensions.js's
// pageContentBox(), which accounts for the double-sided binding gutter. Measure
// a 7.5in line for a book that prints 7.25in and titles wrap later here than
// they do on the page, so rows measure shorter than they render and each page
// gets over-filled - invisibly, because PagePreview clips with `overflow:
// hidden` and TOC pages suppress its overflow warning.
function createMeasureContainer({ doubleSided, pageSize }) {
  const { widthIn, heightPx } = pageContentBox({ doubleSided, paperSize: pageSize })
  const el = document.createElement('div')
  el.style.position = 'fixed'
  el.style.top = '-9999px'
  el.style.left = '-9999px'
  el.style.visibility = 'hidden'
  el.style.width = `${widthIn}in`
  el.style.height = `${heightPx}px`
  document.body.appendChild(el)
  return el
}

// index.html loads Google Fonts with `display=swap`, so text initially
// renders in a fallback font with different metrics and swaps to the real
// one once it loads. Measuring before that swap reads wrong row heights/wrap
// points against the fallback font, producing a page split that doesn't
// match the real render. Must run AFTER the measurement mount (not as an
// upfront gate before any mounting) - `document.fonts.ready` only accounts
// for fonts already requested by something on the page, so if this
// off-screen mount is the first thing to use a given font, checking `ready`
// before mounting could resolve before that font is even requested.
async function waitForFonts() {
  if (typeof document !== 'undefined' && document.fonts) await document.fonts.ready
}

// Real page numbers can't exist yet: they come from layoutBookPages, which needs
// the TOC's page count, which is what this module is computing. So measurement
// renders a placeholder number instead.
//
// That's only sound because TocRecipeRow/TocChapterRow reserve a fixed-width
// number column (`--toc-number-width`, from maxPageNumberDigits) - row geometry
// no longer depends on the number's value, so a placeholder measures exactly as
// wide as the real number will render. Before that column existed, this
// placeholder was the single largest source of TOC clipping: measuring "1"
// against rendered 3-digit numbers left titles more room here than on the page,
// dropping ~1 entry per page. Don't reintroduce a value-dependent number width
// without also removing this placeholder.
function placeholderPageNumbers(rows) {
  const pageNumbers = { dividerPages: new Map(), recipePages: new Map() }
  for (const row of rows) {
    if (row.type === 'chapter') pageNumbers.dividerPages.set(row.chapter.id, 1)
    else pageNumbers.recipePages.set(`${row.chapter.id}:${row.recipe.id}`, 1)
  }
  return pageNumbers
}

// Mounts the real TableOfContentsPage off-screen with every given row in a
// single flat `columns: 2; column-fill: auto` flow (see TableOfContentsPage
// .vue's `.toc-rows`), and lets rows that don't fit in those two columns
// spill into further column "runs" extending sideways past the container's
// own width - standard CSS multicol overflow behavior in continuous
// (non-paginated) media - rather than clipping them. Reading each row's
// resulting x position off real layout tells us exactly which column real
// `column-fill: auto` would place it in, without reimplementing that layout
// in JS. Returns one column index per row (0-based, monotonic non-decreasing
// since column-fill fills sequentially): 0-1 is "page one" of this batch,
// 2-3 the next, and so on.
async function measureColumnIndexes(
  rows,
  showHeading,
  { doubleSided, numberDigits, pageSize, favoriteSettings, hasFavorites },
) {
  const container = createMeasureContainer({ doubleSided, pageSize })
  let app = null
  try {
    app = createApp({
      render: () =>
        h(TableOfContentsPage, {
          rows,
          showHeading,
          numberDigits,
          pageNumbers: placeholderPageNumbers(rows),
          favoriteSettings,
          hasFavorites,
        }),
    })
    app.mount(container)
    await nextTick()
    await waitForFonts()
    await new Promise((resolve) => requestAnimationFrame(resolve))

    const lefts = Array.from(container.querySelectorAll('.toc-rows > *')).map(
      (el) => el.getBoundingClientRect().left,
    )
    const firstLeft = lefts[0] ?? 0
    // Column stride = the gap between the first two distinct x positions
    // seen (the column-0-to-column-1 boundary) - read directly off the real
    // layout rather than recomputed from CSS var/gap math that could drift.
    const secondLeft = lefts.find((left) => left > firstLeft + 1)
    const stride = secondLeft === undefined ? Infinity : secondLeft - firstLeft

    return lefts.map((left) => (stride === Infinity ? 0 : Math.round((left - firstLeft) / stride)))
  } finally {
    app?.unmount()
    container?.remove()
  }
}

/**
 * Full pagination pipeline for a chapter plan's table of contents. Two
 * off-screen measurement passes - one with the heading shown (page 1), one
 * without (every following page, for whatever rows didn't fit on page 1) -
 * read real CSS `column-fill: auto` layout (measureColumnIndexes) to find
 * exactly which rows land on which page, so the intra-page column split and
 * the page cut points both come from the browser's own layout engine rather
 * than a hand-rolled height sum. Returns `{ pages }`, each page `{ rows }`
 * ready for ProjectPrint.vue to hand one per TableOfContentsPage instance.
 * An empty plan still yields one empty page, matching the old fixed
 * one-TOC-page behavior for a book with no chapters.
 *
 * `doubleSided` is not optional in practice: it changes the page's content
 * width (binding gutter), and measuring the wrong width silently over-fills
 * every page. Callers must pass the project's real setting. `numberDigits` is
 * returned alongside the pages so ProjectPrint.vue renders with the exact value
 * that was measured with, rather than recomputing it and risking a mismatch.
 */
export async function measureTocLayout(
  chapterPlan,
  {
    doubleSided = false,
    pageSize = DEFAULT_PAPER_SIZE,
    favoriteSettings = { icon: OUTSIDE_CONTEXT_ICON, prefix: '' },
  } = {},
) {
  const numberDigits = maxPageNumberDigits(chapterPlan)
  const rows = buildTocRows(chapterPlan)
  if (rows.length === 0) return { pages: [{ rows: [] }], numberDigits }
  const hasFavorites = chapterPlan.some((entry) => entry.recipes.some((recipe) => recipe.favorite))

  const options = { doubleSided, numberDigits, pageSize, favoriteSettings, hasFavorites }

  const firstPageIndexes = await measureColumnIndexes(rows, true, options)
  const splitAt = firstPageIndexes.findIndex((columnIndex) => columnIndex > 1)
  const firstPageRowCount = splitAt === -1 ? rows.length : splitAt

  const pages = [{ rows: rows.slice(0, firstPageRowCount) }]

  const remaining = rows.slice(firstPageRowCount)
  if (remaining.length > 0) {
    const indexes = await measureColumnIndexes(remaining, false, options)
    const pageCount = Math.max(...indexes.map((columnIndex) => Math.floor(columnIndex / 2))) + 1
    for (let p = 0; p < pageCount; p++) {
      pages.push({ rows: remaining.filter((_, i) => Math.floor(indexes[i] / 2) === p) })
    }
  }

  return { pages, numberDigits }
}
