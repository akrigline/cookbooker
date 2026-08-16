import { createApp, h, nextTick } from 'vue'
import TableOfContentsPage from '../components/TableOfContentsPage.vue'
import { PAGE_MARGIN_IN, PAGE_HEIGHT_IN, PAGE_WIDTH_IN, CSS_PX_PER_IN } from './pageDimensions.js'

const CONTENT_WIDTH_IN = PAGE_WIDTH_IN - PAGE_MARGIN_IN * 2
// Verified against the real, live page: PagePreview.vue's `.toc-rows`
// resolves to exactly this (960px on an 8.5x11in/0.5in-margin page) via its
// own `height: 100%` chain (see TableOfContentsPage.vue) - checked with
// `el.clientHeight` on an actual rendered `.toc-page` in the browser, not
// assumed. This container's explicit height must match that number exactly
// so `.toc-rows`'s `height: 100%` / `calc(100% - 60px)` resolves off-screen
// the same way it does on the real page - if it drifts, rows silently get
// assigned to a page that can't actually fit them (invisibly clipped by
// PagePreview's `overflow: hidden`), which is worse than under-filling a
// page. Re-verify with `document.querySelector('.toc-rows').clientHeight`
// on a real print preview before changing this.
const CONTENT_HEIGHT_PX = (PAGE_HEIGHT_IN - PAGE_MARGIN_IN * 2) * CSS_PX_PER_IN + 90

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

// Explicit width AND height (not just width) so `.toc-rows`'s own `height:
// 100%` / `calc(100% - 60px)` (see TableOfContentsPage.vue) has something
// real to resolve against off-screen, the same as it would inside
// PagePreview.vue's real box on the actual page.
function createMeasureContainer() {
  const el = document.createElement('div')
  el.style.position = 'fixed'
  el.style.top = '-9999px'
  el.style.left = '-9999px'
  el.style.visibility = 'hidden'
  el.style.width = `${CONTENT_WIDTH_IN}in`
  el.style.height = `${CONTENT_HEIGHT_PX}px`
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

function fakePageNumbers(rows) {
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
async function measureColumnIndexes(rows, showHeading) {
  const container = createMeasureContainer()
  let app = null
  try {
    app = createApp({
      render: () => h(TableOfContentsPage, { rows, showHeading, pageNumbers: fakePageNumbers(rows) }),
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
 */
export async function measureTocLayout(chapterPlan) {
  const rows = buildTocRows(chapterPlan)
  if (rows.length === 0) return { pages: [{ rows: [] }] }

  const firstPageIndexes = await measureColumnIndexes(rows, true)
  const splitAt = firstPageIndexes.findIndex((columnIndex) => columnIndex > 1)
  const firstPageRowCount = splitAt === -1 ? rows.length : splitAt

  const pages = [{ rows: rows.slice(0, firstPageRowCount) }]

  const remaining = rows.slice(firstPageRowCount)
  if (remaining.length > 0) {
    const indexes = await measureColumnIndexes(remaining, false)
    const pageCount = Math.max(...indexes.map((columnIndex) => Math.floor(columnIndex / 2))) + 1
    for (let p = 0; p < pageCount; p++) {
      pages.push({ rows: remaining.filter((_, i) => Math.floor(indexes[i] / 2) === p) })
    }
  }

  return { pages }
}
