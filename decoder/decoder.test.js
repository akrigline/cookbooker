import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import LZString from 'lz-string'
import { describe, expect, it } from 'vitest'

// The decoder is intentionally a single dependency-free static HTML file
// (see design.md Decision 3), so it isn't part of the Vue app's module
// graph and can't be exercised with component-mount tests. These tests
// instead guard the source directly against regressions, backed by manual
// browser verification of the empty/valid/malformed/XSS scenarios (see
// tasks 5.7-5.9 in openspec/changes/recipe-qr-code-sharing/tasks.md).
const decoderHtml = readFileSync(resolve(__dirname, 'index.html'), 'utf8')

describe('decoder page source', () => {
  it('never assigns innerHTML (only mentions it in a comment explaining why)', () => {
    expect(decoderHtml).not.toMatch(/\.innerHTML\s*=/)
  })

  it('renders the title and ingredients via textContent', () => {
    expect(decoderHtml).toMatch(/recipe-title["'\s\S]*?\.textContent\s*=/)
    expect(decoderHtml).toMatch(/li\.textContent\s*=/)
  })

  it('vendors the same lz-string version used by the app', () => {
    expect(decoderHtml).toContain('lz-string v1.5.0')
  })

  it('reacts to same-tab fragment changes via hashchange', () => {
    expect(decoderHtml).toMatch(/addEventListener\(\s*["']hashchange["']/)
  })
})

describe('decoder decompression logic (mirrors index.html inline script)', () => {
  function decode(fragment) {
    if (!fragment) return { state: 'empty' }
    let decoded
    try {
      decoded = LZString.decompressFromEncodedURIComponent(fragment)
    } catch {
      decoded = null
    }
    if (decoded === null || decoded === '') return { state: 'error' }
    const lines = decoded.split('\n')
    return {
      state: 'result',
      title: lines[0] || 'Untitled recipe',
      ingredients: lines.slice(1).filter((line) => line.length > 0),
    }
  }

  it('shows the empty state for a missing fragment', () => {
    expect(decode('')).toEqual({ state: 'empty' })
  })

  it('decodes a valid compressed payload into title and ingredients', () => {
    const fragment = LZString.compressToEncodedURIComponent('Pancakes\n2 cups flour\n1 egg')
    expect(decode(fragment)).toEqual({
      state: 'result',
      title: 'Pancakes',
      ingredients: ['2 cups flour', '1 egg'],
    })
  })

  it('surfaces malformed/corrupted payloads as an error, not a crash', () => {
    expect(decode('%%%not-valid-lzstring%%%')).toEqual({ state: 'error' })
    expect(decode('...')).toEqual({ state: 'error' })
  })

  it('carries a malicious payload through as inert text, never as markup', () => {
    const malicious = '<img src=x onerror=alert(1)>\n<script>alert(2)</script>'
    const fragment = LZString.compressToEncodedURIComponent(malicious)
    const result = decode(fragment)
    expect(result.title).toBe('<img src=x onerror=alert(1)>')
    expect(result.ingredients).toEqual(['<script>alert(2)</script>'])
    // The decoder only ever assigns these strings via .textContent (asserted
    // above), which never parses them as HTML — this is what makes carrying
    // the raw markup through as a string safe.
  })
})
