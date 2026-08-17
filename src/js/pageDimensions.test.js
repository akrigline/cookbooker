import { describe, expect, it } from 'vitest'
import {
  CSS_PX_PER_IN,
  PAGE_GUTTER_IN,
  PAGE_HEIGHT_IN,
  PAGE_MARGIN_IN,
  PAGE_WIDTH_IN,
  pageContentBox,
} from './pageDimensions'

// This is the geometry every off-screen measurement renders against, so an
// error here doesn't fail loudly - it produces a print layout that's subtly
// wrong. The double-sided case is the one that actually shipped broken: the
// table of contents measured 7.5in-wide lines for pages that print 7.25in,
// so titles wrapped later in measurement than on the page and every TOC page
// was handed ~2 more entries than it could show.
describe('pageContentBox', () => {
  it('matches the box PagePreview leaves after symmetric margins', () => {
    const box = pageContentBox({ doubleSided: false })
    expect(box.widthIn).toBe(PAGE_WIDTH_IN - PAGE_MARGIN_IN * 2)
    expect(box.heightIn).toBe(PAGE_HEIGHT_IN - PAGE_MARGIN_IN * 2)
    expect(box.widthPx).toBe(7.5 * CSS_PX_PER_IN)
    expect(box.heightPx).toBe(960)
  })

  it('narrows by the binding gutter when double-sided', () => {
    const box = pageContentBox({ doubleSided: true })
    expect(box.widthIn).toBe(PAGE_WIDTH_IN - PAGE_MARGIN_IN - PAGE_GUTTER_IN)
    expect(box.widthPx).toBe(7.25 * CSS_PX_PER_IN)
  })

  it('keeps the same height double-sided - only one side widens', () => {
    expect(pageContentBox({ doubleSided: true }).heightIn).toBe(
      pageContentBox({ doubleSided: false }).heightIn,
    )
  })

  it('is never wider double-sided than single-sided', () => {
    // The gutter swaps sides between recto and verso but the total horizontal
    // padding is the same on both, so there is no page that gets the wider box.
    expect(pageContentBox({ doubleSided: true }).widthIn).toBeLessThan(
      pageContentBox({ doubleSided: false }).widthIn,
    )
  })

  it('defaults to single-sided when called with no arguments', () => {
    expect(pageContentBox()).toEqual(pageContentBox({ doubleSided: false }))
  })
})
