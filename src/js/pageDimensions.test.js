import { describe, expect, it } from 'vitest'
import {
  CSS_PX_PER_IN,
  PAGE_GUTTER_IN,
  PAGE_MARGIN_IN,
  PAPER_SIZES,
  getPaperSize,
  pageContentBox,
} from './pageDimensions'

const PAGE_WIDTH_IN = PAPER_SIZES.letter.widthIn
const PAGE_HEIGHT_IN = PAPER_SIZES.letter.heightIn

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

  it('defaults to Letter when called with no paperSize', () => {
    expect(pageContentBox({ doubleSided: false })).toEqual(
      pageContentBox({ doubleSided: false, paperSize: 'letter' }),
    )
  })

  describe('a4', () => {
    const { widthIn: a4WidthIn, heightIn: a4HeightIn } = PAPER_SIZES.a4

    it('matches the box PagePreview leaves after symmetric margins', () => {
      const box = pageContentBox({ doubleSided: false, paperSize: 'a4' })
      expect(box.widthIn).toBe(a4WidthIn - PAGE_MARGIN_IN * 2)
      expect(box.heightIn).toBe(a4HeightIn - PAGE_MARGIN_IN * 2)
      expect(box.widthPx).toBe((a4WidthIn - PAGE_MARGIN_IN * 2) * CSS_PX_PER_IN)
      expect(box.heightPx).toBe((a4HeightIn - PAGE_MARGIN_IN * 2) * CSS_PX_PER_IN)
    })

    it('narrows by the binding gutter when double-sided', () => {
      const box = pageContentBox({ doubleSided: true, paperSize: 'a4' })
      expect(box.widthIn).toBe(a4WidthIn - PAGE_MARGIN_IN - PAGE_GUTTER_IN)
    })

    it('is narrower and taller than Letter', () => {
      expect(a4WidthIn).toBeLessThan(PAGE_WIDTH_IN)
      expect(a4HeightIn).toBeGreaterThan(PAGE_HEIGHT_IN)
    })
  })
})

describe('getPaperSize', () => {
  it('resolves known ids', () => {
    expect(getPaperSize('letter')).toBe(PAPER_SIZES.letter)
    expect(getPaperSize('a4')).toBe(PAPER_SIZES.a4)
  })

  it('falls back to Letter for an unknown or absent id', () => {
    expect(getPaperSize('bogus')).toBe(PAPER_SIZES.letter)
    expect(getPaperSize(undefined)).toBe(PAPER_SIZES.letter)
  })
})
