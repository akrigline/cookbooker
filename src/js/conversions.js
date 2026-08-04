import Fraction from 'fraction.js'
import parseIngredientLine from '@magrinj/parse-ingredients'
// @magrinj/parse-ingredients incorrectly declares "sideEffects": false, so
// bundlers (Vite/Rollup) can tree-shake its internal locale registration
// import and leave the "en" locale unregistered. Importing it directly here
// (our own code isn't side-effect-free) forces it to run.
import '@magrinj/parse-ingredients/locale/en'
import { converter } from '@dailykit/food-units-converter'

// Standard US "nutrition label" rounded volume conversions (cup = 240 ml,
// tbsp = 15 ml, tsp = 5 ml) rather than the precise physical equivalents -
// this matches common recipe-conversion convention and keeps kitchen-scale
// numbers clean (e.g. "2 tsp (10 ml)" instead of "9.86 ml").
const ML_PER_CUP = 240
export const QUARTER_CUP_ML = ML_PER_CUP / 4 // 60 ml

const VOLUME_UNITS = {
  tsp: { ml: 5, label: 'tsp' },
  tbs: { ml: 15, label: 'tbsp' },
  c: { ml: 240, label: 'cup' },
  pt: { ml: 480, label: 'pt' },
  qt: { ml: 960, label: 'qt' },
  'fl oz': { ml: 30, label: 'fl oz' },
  ml: { ml: 1, label: 'ml' },
  lt: { ml: 1000, label: 'L' },
}

const WEIGHT_UNITS = {
  mg: { g: 0.001, label: 'mg' },
  g: { g: 1, label: 'g' },
  kg: { g: 1000, label: 'kg' },
  oz: { g: 28.3495, label: 'oz' },
  lb: { g: 453.592, label: 'lb' },
}

const US_VOLUME_SYMBOLS = new Set(['tsp', 'tbs', 'c', 'pt', 'qt', 'fl oz'])
const METRIC_VOLUME_SYMBOLS = new Set(['ml', 'lt'])
const US_WEIGHT_SYMBOLS = new Set(['oz', 'lb'])
const METRIC_WEIGHT_SYMBOLS = new Set(['g', 'kg', 'mg'])

// Grams-per-US-cup for common baking ingredients. Order matters: more
// specific keywords must be listed before their more generic substrings
// (e.g. "brown sugar" before "sugar") since matching is first-substring-wins.
const DENSITY_TABLE = [
  ['brown sugar', 220],
  ['powdered sugar', 120],
  ['confectioners sugar', 120],
  ['granulated sugar', 200],
  ['sugar', 200],
  ['bread flour', 127],
  ['cake flour', 114],
  ['whole wheat flour', 132],
  ['all-purpose flour', 120],
  ['flour', 120],
  ['peanut butter', 258],
  ['buttermilk', 245],
  ['butter', 227],
  ['vegetable oil', 218],
  ['olive oil', 216],
  ['oil', 218],
  ['honey', 340],
  ['milk', 240],
  ['water', 237],
  ['cocoa powder', 84],
  ['cornstarch', 120],
  ['rice', 185],
  ['oats', 90],
  ['baking soda', 220],
  ['baking powder', 192],
  ['salt', 292],
]

export function findDensity(ingredientName) {
  if (!ingredientName) return null
  const lower = ingredientName.toLowerCase()
  const match = DENSITY_TABLE.find(([keyword]) => lower.includes(keyword))
  return match ? match[1] : null
}

/**
 * Snaps a decimal quantity to the nearest 1/8 (standard kitchen-measurement
 * precision) and renders it as a mixed-number fraction string, e.g. 1.5 -> "1 1/2".
 */
export function formatQuantity(value) {
  if (value == null || Number.isNaN(value)) return ''
  const snapped = Math.round(value * 8) / 8
  if (snapped === 0) return '0'
  return new Fraction(snapped).toFraction(true)
}

function formatMetricWeight(grams) {
  if (grams >= 1000) {
    return `${formatQuantity(converter(grams).from('g').to('kg').value)} kg`
  }
  return `${Math.round(grams)} g`
}

function usVolumeFromMl(ml) {
  if (ml >= ML_PER_CUP * 0.5) return `${formatQuantity(ml / VOLUME_UNITS.c.ml)} cup`
  if (ml >= VOLUME_UNITS.tbs.ml * 1.5) return `${formatQuantity(ml / VOLUME_UNITS.tbs.ml)} tbsp`
  return `${formatQuantity(ml / VOLUME_UNITS.tsp.ml)} tsp`
}

// @dailykit/food-units-converter only knows g/mg/kg/oz (not lb), so a pound
// quantity is expressed as 16oz before handing off to the library.
function weightToGrams(qty, symbol) {
  if (symbol === 'lb') return converter(qty * 16).from('oz').to('g').value
  return converter(qty).from(symbol).to('g').value
}

function usWeightFromGrams(grams) {
  const ounces = converter(grams).from('g').to('oz').value
  if (ounces >= 16) return `${formatQuantity(ounces / 16)} lb`
  return `${formatQuantity(ounces)} oz`
}

function convertSingleQuantity(qty, symbol, ingredient) {
  if (US_VOLUME_SYMBOLS.has(symbol)) {
    const unit = VOLUME_UNITS[symbol]
    const volMl = qty * unit.ml
    const density = findDensity(ingredient)
    const us = `${formatQuantity(qty)} ${unit.label}`
    if (density && volMl >= QUARTER_CUP_ML) {
      const grams = converter(volMl).from({ unit: 'ml', bulkDensity: density / ML_PER_CUP }).to('g').value
      return { us, metric: formatMetricWeight(grams), bypassedWeight: false }
    }
    return { us, metric: `${Math.round(volMl)} ml`, bypassedWeight: Boolean(density) }
  }

  if (METRIC_VOLUME_SYMBOLS.has(symbol)) {
    const unit = VOLUME_UNITS[symbol]
    const volMl = qty * unit.ml
    return { us: usVolumeFromMl(volMl), metric: `${formatQuantity(qty)} ${unit.label}` }
  }

  if (US_WEIGHT_SYMBOLS.has(symbol)) {
    const unit = WEIGHT_UNITS[symbol]
    const grams = weightToGrams(qty, symbol)
    return { us: `${formatQuantity(qty)} ${unit.label}`, metric: formatMetricWeight(grams) }
  }

  if (METRIC_WEIGHT_SYMBOLS.has(symbol)) {
    const unit = WEIGHT_UNITS[symbol]
    const grams = weightToGrams(qty, symbol)
    return { us: usWeightFromGrams(grams), metric: `${formatQuantity(qty)} ${unit.label}` }
  }

  return null
}

/**
 * Given a parsed ingredient ({ quantity, minQty, maxQty, symbol, ingredient }),
 * returns the dual-unit display parts, or null when the unit is
 * unrecognized/absent (e.g. "2 cloves garlic", "1 pinch salt") and no
 * conversion applies. When minQty/maxQty differ (a quantity range, e.g.
 * "4 to 4 1/2 cups"), both endpoints are converted and joined with "to".
 */
export function convertIngredient({ quantity, minQty, maxQty, symbol, ingredient }) {
  const min = minQty == null ? (quantity == null ? null : Number(quantity)) : Number(minQty)
  if (min == null || Number.isNaN(min) || !symbol) return null
  const maxCandidate = maxQty == null ? min : Number(maxQty)
  const max = Number.isNaN(maxCandidate) ? min : maxCandidate

  if (max === min) return convertSingleQuantity(min, symbol, ingredient)

  const a = convertSingleQuantity(min, symbol, ingredient)
  const b = convertSingleQuantity(max, symbol, ingredient)
  if (!a || !b) return null
  return { us: `${a.us} to ${b.us}`, metric: `${a.metric} to ${b.metric}`, bypassedWeight: a.bypassedWeight || b.bypassedWeight }
}

/**
 * Formats a possibly-ranged quantity (minQty/maxQty from a parsed
 * ingredient) as display text, e.g. "4" or "4 to 4 1/2". Returns '' when
 * there's no quantity.
 */
export function formatQuantityRange(minQty, maxQty) {
  const min = minQty == null ? null : Number(minQty)
  if (min == null || Number.isNaN(min)) return ''
  const maxCandidate = maxQty == null ? min : Number(maxQty)
  const max = Number.isNaN(maxCandidate) ? min : maxCandidate
  if (max === min) return formatQuantity(min)
  return `${formatQuantity(min)} to ${formatQuantity(max)}`
}

/**
 * Renders a parsed ingredient line as display text:
 * "[US] ([Metric]) [ingredient]" when a known unit is recognized, otherwise
 * falls back to the raw quantity/unit/ingredient text as typed.
 */
export function formatIngredientLine(parsed) {
  const converted = convertIngredient(parsed)
  const name = parsed.ingredient ?? ''
  if (!converted) {
    const qty = formatQuantityRange(parsed.minQty ?? parsed.quantity, parsed.maxQty ?? parsed.quantity)
    const unit = parsed.unit ?? ''
    return [qty, unit, name].filter(Boolean).join(' ')
  }
  return `${converted.us} (${converted.metric}) ${name}`
}

/**
 * Parses freeform recipe ingredient text (one ingredient per line) into
 * structured records, ready for storage on the recipe's `ingredients` field.
 */
export function parseIngredientsText(text) {
  return (text ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parsed = parseIngredientLine(line)
      return { ...parsed, raw: line }
    })
}

export { parseIngredientLine }
