import { describe, expect, it } from 'vitest'
import {
  convertIngredient,
  formatIngredientLine,
  formatQuantity,
  formatQuantityRange,
  parseIngredientsText,
} from './conversions'

describe('formatQuantity', () => {
  it('formats whole numbers', () => {
    expect(formatQuantity(2)).toBe('2')
  })

  it('formats simple fractions', () => {
    expect(formatQuantity(1.5)).toBe('1 1/2')
    expect(formatQuantity(0.25)).toBe('1/4')
  })
})

describe('convertIngredient - dual unit display (spec scenarios)', () => {
  it('converts 1 cup butter to 1 cup (227 g) butter', () => {
    const result = convertIngredient({ quantity: '1', symbol: 'c', ingredient: 'butter' })
    expect(result.us).toBe('1 cup')
    expect(result.metric).toBe('227 g')
  })

  it('falls back to volume-to-volume for unrecognized ingredients', () => {
    const result = convertIngredient({ quantity: '1', symbol: 'c', ingredient: 'magic spice' })
    expect(result.us).toBe('1 cup')
    expect(result.metric).toBe('240 ml')
  })

  it('bypasses weight conversion below a quarter cup ("2 tsp (10 ml) flour")', () => {
    const result = convertIngredient({ quantity: '2', symbol: 'tsp', ingredient: 'flour' })
    expect(result.us).toBe('2 tsp')
    expect(result.metric).toBe('10 ml')
  })

  it('matches density keyword substrings, e.g. "organic cake flour" -> flour rules', () => {
    const result = convertIngredient({ quantity: '1', symbol: 'c', ingredient: 'organic cake flour' })
    expect(result.metric.endsWith('g')).toBe(true)
  })

  it('returns null for quantities/units it cannot recognize', () => {
    expect(convertIngredient({ quantity: '2', symbol: null, ingredient: 'cloves garlic' })).toBeNull()
    expect(convertIngredient({ quantity: null, symbol: null, ingredient: 'vanilla extract' })).toBeNull()
  })

  it('converts US weight units directly without density (oz -> g)', () => {
    const result = convertIngredient({ quantity: '4', symbol: 'oz', ingredient: 'cheese' })
    expect(result.us).toBe('4 oz')
    expect(result.metric).toBe('113 g')
  })

  it('converts a quantity range (minQty/maxQty) to a dual-unit range', () => {
    const result = convertIngredient({
      quantity: '4-4.5',
      minQty: '4',
      maxQty: '4.5',
      symbol: 'c',
      ingredient: 'flour',
    })
    expect(result.us).toBe('4 cup to 4 1/2 cup')
    expect(result.metric).toMatch(/^\d+ g to \d+ g$/)
  })

  it('treats an equal minQty/maxQty as a single quantity, not a range', () => {
    const result = convertIngredient({ quantity: '1', minQty: '1', maxQty: '1', symbol: 'c', ingredient: 'butter' })
    expect(result.us).toBe('1 cup')
    expect(result.metric).toBe('227 g')
  })
})

describe('formatQuantityRange', () => {
  it('formats a single quantity', () => {
    expect(formatQuantityRange('1.5', '1.5')).toBe('1 1/2')
  })

  it('formats a range as "min to max"', () => {
    expect(formatQuantityRange('4', '4.5')).toBe('4 to 4 1/2')
  })

  it('returns empty string when there is no quantity', () => {
    expect(formatQuantityRange(null, null)).toBe('')
  })
})

describe('formatIngredientLine', () => {
  it('renders dual-unit text for recognized units', () => {
    expect(
      formatIngredientLine({ quantity: '1', symbol: 'c', unit: 'cup', ingredient: 'butter' }),
    ).toBe('1 cup (227 g) butter')
  })

  it('renders raw text for unrecognized units', () => {
    expect(
      formatIngredientLine({ quantity: '2', symbol: null, unit: 'cloves', ingredient: 'garlic' }),
    ).toBe('2 cloves garlic')
  })
})

describe('parseIngredientsText', () => {
  it('parses one ingredient per line and keeps the raw text', () => {
    const result = parseIngredientsText('1 1/2 cups of all-purpose flour\n1 cup butter\n')
    expect(result).toHaveLength(2)
    expect(result[0].ingredient).toBe('all-purpose flour')
    expect(result[0].raw).toBe('1 1/2 cups of all-purpose flour')
  })

  it('parses a quantity range with a unicode-fraction endpoint without corrupting the ingredient name', () => {
    const [result] = parseIngredientsText('4 to 4 ½ cup flour')
    expect(result.ingredient).toBe('flour')
    expect(result.minQty).toBe('4')
    expect(result.maxQty).toBe('4.5')
    expect(result.unit).toBe('cups')
  })

  it('parses a plain-integer quantity range', () => {
    const [result] = parseIngredientsText('1 to 2 cups flour')
    expect(result.ingredient).toBe('flour')
    expect(result.minQty).toBe('1')
    expect(result.maxQty).toBe('2')
  })

  it('recognizes units regardless of case, e.g. "Tbsp"/"TBSP"/"Tsp"/"CUP"', () => {
    const [tbsp] = parseIngredientsText('1 Tbsp flour')
    expect(tbsp.symbol).toBe('tbs')
    expect(tbsp.ingredient).toBe('flour')

    const [tbspAllCaps] = parseIngredientsText('2 TBSP sugar')
    expect(tbspAllCaps.symbol).toBe('tbs')
    expect(tbspAllCaps.ingredient).toBe('sugar')

    const [tsp] = parseIngredientsText('1 Tsp salt')
    expect(tsp.symbol).toBe('tsp')
    expect(tsp.ingredient).toBe('salt')

    const [cup] = parseIngredientsText('1 CUP milk')
    expect(cup.symbol).toBe('c')
    expect(cup.ingredient).toBe('milk')
  })

  it('recognizes "tsb"/"TSB" as a common tablespoon typo', () => {
    const [result] = parseIngredientsText('1 TSB flour')
    expect(result.symbol).toBe('tbs')
    expect(result.ingredient).toBe('flour')
  })

  it('keeps the original casing in raw even though parsing lowercases', () => {
    const [result] = parseIngredientsText('1 Tbsp Fresh Basil')
    expect(result.raw).toBe('1 Tbsp Fresh Basil')
  })
})
