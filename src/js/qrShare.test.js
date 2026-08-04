import { describe, expect, it } from 'vitest'
import QRCode from 'qrcode'
import {
  DECODE_ROUTE_PATH,
  INGREDIENT_WARNING_LENGTH,
  compressPayload,
  decompressPayload,
  encodeRecipePayload,
  generateQRURL,
  getIngredientTextLength,
  isPayloadOversized,
  parseRecipePayload,
} from './qrShare.js'

function recipeWithIngredientLength(length) {
  // One long ingredient line of the given character length.
  return { title: 'Test Recipe', ingredients: [{ raw: 'x'.repeat(length) }] }
}

describe('encodeRecipePayload', () => {
  it('puts the title on the first line followed by one ingredient per line', () => {
    const recipe = {
      title: 'Pancakes',
      ingredients: [{ raw: '2 cups flour' }, { raw: '1 egg' }],
    }
    expect(encodeRecipePayload(recipe)).toBe('Pancakes\n2 cups flour\n1 egg')
  })

  it('drops empty ingredient lines', () => {
    const recipe = { title: 'T', ingredients: [{ raw: '' }, { raw: '1 egg' }] }
    expect(encodeRecipePayload(recipe)).toBe('T\n1 egg')
  })

  it('handles a recipe with no ingredients', () => {
    expect(encodeRecipePayload({ title: 'Empty', ingredients: [] })).toBe('Empty')
  })

  it('truncates to maxIngredients when provided', () => {
    const recipe = {
      title: 'T',
      ingredients: [{ raw: 'a' }, { raw: 'b' }, { raw: 'c' }],
    }
    expect(encodeRecipePayload(recipe, { maxIngredients: 2 })).toBe('T\na\nb')
  })
})

describe('compressPayload / decompressPayload', () => {
  it('round-trips arbitrary text', () => {
    const payload = 'Pancakes\n2 cups flour\n1 egg\n1 cup milk'
    expect(decompressPayload(compressPayload(payload))).toBe(payload)
  })

  it('compresses typical recipe text by at least 40%', () => {
    const payload =
      'Grandma\'s Chocolate Chip Cookies\n' +
      Array.from({ length: 20 }, (_, i) => `1 cup ingredient number ${i}`).join('\n')
    const compressed = compressPayload(payload)
    expect(compressed.length).toBeLessThanOrEqual(Math.ceil(payload.length * 0.6))
  })

  it('returns null for empty or garbage compressed input', () => {
    expect(decompressPayload('')).toBeNull()
    expect(decompressPayload(null)).toBeNull()
    expect(decompressPayload('not-a-valid-lzstring-payload!!!')).toBeNull()
  })

  it('never throws on malformed/corrupted input', () => {
    expect(() => decompressPayload('%%%invalid%%%')).not.toThrow()
  })
})

describe('generateQRURL', () => {
  it('builds a URL from the current origin, the decode route, and a compressed fragment', () => {
    const recipe = { title: 'Soup', ingredients: [{ raw: '1 onion' }] }
    const url = generateQRURL(recipe)
    const base = `${window.location.origin}${DECODE_ROUTE_PATH}#`
    expect(url.startsWith(base)).toBe(true)
    const fragment = url.slice(base.length)
    expect(decompressPayload(fragment)).toBe(encodeRecipePayload(recipe))
  })

  it('keeps the URL for a typical recipe well under 2000 characters', () => {
    const recipe = recipeWithIngredientLength(800)
    const url = generateQRURL(recipe)
    expect(url.length).toBeLessThan(2000)
  })
})

describe('parseRecipePayload', () => {
  it('splits the decoded text back into title and ingredients', () => {
    const parsed = parseRecipePayload('Pancakes\n2 cups flour\n1 egg')
    expect(parsed).toEqual({ title: 'Pancakes', ingredients: ['2 cups flour', '1 egg'] })
  })

  it('carries markup through as a plain string, unescaped and unstripped', () => {
    // decodeRecipe.vue is the layer responsible for never rendering this as HTML
    // (via Vue's default {{ }} escaping) - this just documents that parsing
    // itself does no sanitization, so a full round trip preserves the raw text.
    const malicious = '<img src=x onerror=alert(1)>\n<script>alert(2)</script>'
    const fragment = compressPayload(malicious)
    const parsed = parseRecipePayload(decompressPayload(fragment))
    expect(parsed).toEqual({
      title: '<img src=x onerror=alert(1)>',
      ingredients: ['<script>alert(2)</script>'],
    })
  })
})

describe('size validation', () => {
  it('measures ingredient text length excluding the title', () => {
    const recipe = { title: 'A very long title that should not count', ingredients: [{ raw: 'x'.repeat(100) }] }
    expect(getIngredientTextLength(recipe)).toBe(100)
  })

  it('is not oversized at or below the warning threshold', () => {
    expect(isPayloadOversized(recipeWithIngredientLength(INGREDIENT_WARNING_LENGTH))).toBe(false)
  })

  it('is oversized above the warning threshold', () => {
    expect(isPayloadOversized(recipeWithIngredientLength(INGREDIENT_WARNING_LENGTH + 1))).toBe(true)
  })
})

describe('QR version bound', () => {
  it('stays at or below Version 15 with error correction level L for a max-size payload', () => {
    // Worst case allowed before the UI warns: right at the warning threshold.
    const recipe = recipeWithIngredientLength(INGREDIENT_WARNING_LENGTH)
    const url = generateQRURL(recipe)
    const segments = QRCode.create(url, { errorCorrectionLevel: 'L' })
    expect(segments.version).toBeLessThanOrEqual(15)
  })
})
