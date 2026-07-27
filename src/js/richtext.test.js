import { describe, expect, it } from 'vitest'
import { renderChefNotes } from './richtext.js'

describe('renderChefNotes', () => {
  it('returns an empty string for falsy input', () => {
    expect(renderChefNotes('')).toBe('')
    expect(renderChefNotes(null)).toBe('')
    expect(renderChefNotes(undefined)).toBe('')
  })

  it('converts double-asterisk and double-underscore to <strong>', () => {
    expect(renderChefNotes('a **bold** word')).toBe('a <strong>bold</strong> word')
    expect(renderChefNotes('a __bold__ word')).toBe('a <strong>bold</strong> word')
  })

  it('converts single-asterisk and single-underscore to <em>', () => {
    expect(renderChefNotes('a *tip* word')).toBe('a <em>tip</em> word')
    expect(renderChefNotes('a _tip_ word')).toBe('a <em>tip</em> word')
  })

  it('converts newlines to <br>', () => {
    expect(renderChefNotes('line one\nline two')).toBe('line one<br>line two')
  })

  it('handles combined bold, italic, and newlines together', () => {
    expect(renderChefNotes('**Tip:** use *fresh* butter.\nEnjoy!')).toBe(
      '<strong>Tip:</strong> use <em>fresh</em> butter.<br>Enjoy!',
    )
  })

  it('escapes HTML special characters before applying markdown, preventing injection', () => {
    expect(renderChefNotes('<script>alert(1)</script>')).toBe(
      '&lt;script&gt;alert(1)&lt;/script&gt;',
    )
  })

  it('escapes ampersands and angle brackets even when mixed with markdown markers', () => {
    expect(renderChefNotes('**<b>fake bold</b>** & more')).toBe(
      '<strong>&lt;b&gt;fake bold&lt;/b&gt;</strong> &amp; more',
    )
  })

  it('does not allow escaped entities to be re-interpreted as new tags', () => {
    const result = renderChefNotes('<strong>already bold</strong>')
    expect(result).not.toContain('<strong>already bold</strong>')
    expect(result).toBe('&lt;strong&gt;already bold&lt;/strong&gt;')
  })
})
