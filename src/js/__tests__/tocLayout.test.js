import { describe, expect, it } from 'vitest'
import { buildTocRows, measureTocLayout } from '../tocLayout'

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

// The real pagination/column-splitting logic now lives entirely in CSS
// (`.toc-rows`'s `columns: 2; column-fill: auto` - see TableOfContentsPage.vue)
// rather than hand-rolled JS, so there's no pure height-summing function left
// to unit test. happy-dom also has no real layout engine (getBoundingClientRect
// always returns 0), so these plumbing tests can only exercise mount/measure/
// unmount behavior, not real column-fill placement - that's verified by hand
// against a real browser instead.
describe('measureTocLayout', () => {
  it('returns a single empty page for an empty chapter plan', async () => {
    const result = await measureTocLayout([])
    expect(result.pages).toHaveLength(1)
    expect(result.pages[0].rows).toEqual([])
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
