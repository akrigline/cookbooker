import { describe, expect, it } from 'vitest'
import { buildTocRows, measureTocLayout } from '../tocLayout'
import { maxPageNumberDigits } from '../compileBook'

const chapterPlan = [
  {
    chapter: { id: 11, name: 'Breakfast' },
    recipes: [
      { id: 1, title: 'Pancakes' },
      { id: 2, title: 'Waffles' },
    ],
  },
  {
    chapter: { id: 12, name: 'Dinner' },
    recipes: [{ id: 3, title: 'Soup' }],
  },
]

describe('buildTocRows', () => {
  it('flattens each chapter header immediately followed by its own recipes, in order', () => {
    const rows = buildTocRows(chapterPlan)
    expect(rows).toEqual([
      { type: 'chapter', chapter: chapterPlan[0].chapter },
      { type: 'recipe', chapter: chapterPlan[0].chapter, recipe: chapterPlan[0].recipes[0] },
      { type: 'recipe', chapter: chapterPlan[0].chapter, recipe: chapterPlan[0].recipes[1] },
      { type: 'chapter', chapter: chapterPlan[1].chapter },
      { type: 'recipe', chapter: chapterPlan[1].chapter, recipe: chapterPlan[1].recipes[0] },
    ])
  })

  it('returns an empty list for an empty plan', () => {
    expect(buildTocRows([])).toEqual([])
  })

  it('emits a chapter row with no recipe rows for an empty chapter', () => {
    const rows = buildTocRows([{ chapter: { id: 20, name: 'Empty' }, recipes: [] }])
    expect(rows).toEqual([{ type: 'chapter', chapter: { id: 20, name: 'Empty' } }])
  })
})

// The real pagination/column-splitting logic lives entirely in CSS
// (`.toc-rows`'s `columns: 2; column-fill: auto` - see TableOfContentsPage.vue)
// rather than hand-rolled JS, so there's no pure height-summing function to
// unit test. happy-dom also has no real layout engine (getBoundingClientRect
// always returns 0), so these plumbing tests can only exercise mount/measure/
// unmount behavior, not real column-fill placement.
//
// That gap is real and has cost us: every TOC clipping bug so far came from the
// measurement being handed geometry that differs from what renders, and no test
// here could catch it. The two defenses that DO cover it live elsewhere - the
// pure inputs are unit-tested (maxPageNumberDigits in compileBook.test.js,
// pageContentBox in pageDimensions.test.js), and ProjectPrint.vue's dev-only
// warnOnClippedTocRows fails loudly in a real browser when they disagree.
describe('measureTocLayout', () => {
  it('returns a single empty page for an empty chapter plan', async () => {
    const result = await measureTocLayout([])
    expect(result.pages).toHaveLength(1)
    expect(result.pages[0].rows).toEqual([])
  })

  // ProjectPrint.vue must render with the same number-column width the split
  // was measured with; returning it here is what keeps the two from drifting.
  it('reports the number-column digit count it measured with', async () => {
    const result = await measureTocLayout(chapterPlan)
    expect(result.numberDigits).toBe(maxPageNumberDigits(chapterPlan))
  })

  it('reports a digit count for an empty plan too', async () => {
    const result = await measureTocLayout([])
    expect(result.numberDigits).toBeGreaterThanOrEqual(1)
  })

  it('places every row somewhere across the returned pages, in order, for a real plan', async () => {
    const rows = buildTocRows(chapterPlan)
    const result = await measureTocLayout(chapterPlan)
    expect(result.pages.flatMap((p) => p.rows)).toEqual(rows)
  })

  it('removes its off-screen containers after measuring', async () => {
    const before = document.body.childElementCount
    await measureTocLayout(chapterPlan)
    expect(document.body.childElementCount).toBe(before)
  })

  it('removes its off-screen container after measuring an empty plan', async () => {
    const before = document.body.childElementCount
    await measureTocLayout([])
    expect(document.body.childElementCount).toBe(before)
  })
})
