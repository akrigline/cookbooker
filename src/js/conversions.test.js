import { describe, expect, it } from 'vitest'
import {
  convertIngredient,
  formatIngredientLine,
  formatQuantity,
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
})
