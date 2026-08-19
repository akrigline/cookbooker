import Fraction from 'fraction.js'
import parseIngredientLine from '@magrinj/parse-ingredients'
// @magrinj/parse-ingredients incorrectly declares "sideEffects": false, so
// production tree-shaking (Rollup/Rolldown) drops a bare
// `import '@magrinj/parse-ingredients/locale/en'` outright, since nothing is
// bound from it - the "en" locale never registers and every
// parseIngredientLine() call throws "locale ... is not supported" in the
// built bundle (dev/test never tree-shake, so this only breaks `npm run
// build`). A `void`-only reference to the default export still gets
// eliminated (the bundler proves it has no observable effect); a live
// conditional that actually branches on the binding does not. defineLocale()
// (which runs when this module evaluates) always returns undefined, so this
// only ever throws if that upstream contract changes.
import ENGLISH_LOCALE from '@magrinj/parse-ingredients/locale/en'
import { converter } from '@dailykit/food-units-converter'

if (ENGLISH_LOCALE !== undefined) {
  throw new Error('@magrinj/parse-ingredients locale/en default export changed - update this workaround')
}

// Standard US "nutrition label" rounded volume conversions (cup = 240 ml,
// tbsp = 15 ml, tsp = 5 ml) rather than the precise physical equivalents -
// this matches common recipe-conversion convention and keeps kitchen-scale
// numbers clean (e.g. "2 tsp (10 ml)" instead of "9.86 ml").
const ML_PER_CUP = 240

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

// Grams-per-US-cup for common baking ingredients, sourced from King Arthur
// Baking's ingredient weight chart (https://www.kingarthurbaking.com/learn/
// ingredient-weight-chart) rather than the older USDA/Betty Crocker figures
// this table used to carry - King Arthur's numbers are what home bakers
// following King Arthur-style recipes (and most modern US recipe sites)
// expect. Order matters: more specific keywords must be listed before their
// more generic substrings (e.g. "brown sugar" before "sugar") since matching
// is first-substring-wins.
const DENSITY_TABLE = [
  ['brown sugar', 213],
  ['powdered sugar', 113],
  ['confectioners sugar', 113],
  ['granulated sugar', 198],
  ['sugar', 198],
  ['bread flour', 120],
  ['cake flour', 120],
  ['whole wheat flour', 113],
  ['all-purpose flour', 120],
  ['flour', 120],
  ['peanut butter', 270],
  ['buttermilk', 227],
  ['butter', 226],
  ['vegetable oil', 198],
  ['olive oil', 200],
  ['oil', 198],
  ['honey', 336],
  ['milk', 227],
  ['chocolate chips', 170],
  ['cranberries', 114],
  ['cocoa powder', 84],
  ['cornstarch', 112],
  ['rice', 198],
  ['oats', 89],
  ['baking soda', 288],
  ['baking powder', 192],
  ['salt', 288],
  ['yeast', 144],
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

// The four unit-picking helpers below return { qty, unit } rather than a
// formatted string, so a quantity range (see joinRangePart) can merge two
// endpoints that land on the same unit into "1-2 tbsp" instead of repeating
// the unit as "1 tbsp-2 tbsp".
function formatMetricWeight(grams) {
  if (grams >= 1000) {
    return { qty: formatQuantity(converter(grams).from('g').to('kg').value), unit: 'kg' }
  }
  return { qty: String(Math.round(grams)), unit: 'g' }
}

function usVolumeFromMl(ml) {
  if (ml >= ML_PER_CUP * 0.5) return { qty: formatQuantity(ml / VOLUME_UNITS.c.ml), unit: 'cup' }
  if (ml >= VOLUME_UNITS.tbs.ml * 1.5) return { qty: formatQuantity(ml / VOLUME_UNITS.tbs.ml), unit: 'tbsp' }
  return { qty: formatQuantity(ml / VOLUME_UNITS.tsp.ml), unit: 'tsp' }
}

// Renders a plain (no known density) volume fallback: liters above 1000 ml
// (e.g. "4 qt water" -> "3 7/8 L" rather than the unreadable "3840 ml"),
// otherwise ml - mirrors formatMetricWeight's g/kg threshold split below.
function metricVolumeFromMl(ml) {
  if (ml >= 1000) {
    return { qty: formatQuantity(converter(ml).from('ml').to('l').value), unit: 'L' }
  }
  return { qty: String(Math.round(ml)), unit: 'ml' }
}

// @dailykit/food-units-converter only knows g/mg/kg/oz (not lb), so a pound
// quantity is expressed as 16oz before handing off to the library.
function weightToGrams(qty, symbol) {
  if (symbol === 'lb') return converter(qty * 16).from('oz').to('g').value
  return converter(qty).from(symbol).to('g').value
}

function usWeightFromGrams(grams) {
  const ounces = converter(grams).from('g').to('oz').value
  if (ounces >= 16) return { qty: formatQuantity(ounces / 16), unit: 'lb' }
  return { qty: formatQuantity(ounces), unit: 'oz' }
}

function joinPart({ qty, unit }) {
  return `${qty} ${unit}`
}

// Merges two range endpoints that landed on the same unit into "1-2 tbsp"
// rather than repeating the unit ("1 tbsp-2 tbsp"). Falls back to the
// per-endpoint form, still hyphen-joined, when the endpoints' auto-picked
// units differ (e.g. a fallback volume range that crosses the tsp/tbsp/cup
// threshold).
function joinRangePart(a, b) {
  if (a.unit === b.unit) return `${a.qty}-${b.qty} ${a.unit}`
  return `${joinPart(a)}-${joinPart(b)}`
}

function convertSingleQuantity(qty, symbol, ingredient) {
  if (US_VOLUME_SYMBOLS.has(symbol)) {
    const unit = VOLUME_UNITS[symbol]
    const volMl = qty * unit.ml
    const density = findDensity(ingredient)
    const usPart = { qty: formatQuantity(qty), unit: unit.label }
    const grams = density ? converter(volMl).from({ unit: 'ml', bulkDensity: density / ML_PER_CUP }).to('g').value : null
    if (density && Math.round(grams) >= 1) {
      return { usPart, metricPart: formatMetricWeight(grams), bypassedWeight: false }
    }
    return { usPart, metricPart: metricVolumeFromMl(volMl), bypassedWeight: Boolean(density) }
  }

  if (METRIC_VOLUME_SYMBOLS.has(symbol)) {
    const unit = VOLUME_UNITS[symbol]
    const volMl = qty * unit.ml
    return { usPart: usVolumeFromMl(volMl), metricPart: { qty: formatQuantity(qty), unit: unit.label } }
  }

  if (US_WEIGHT_SYMBOLS.has(symbol)) {
    const unit = WEIGHT_UNITS[symbol]
    const grams = weightToGrams(qty, symbol)
    const density = findDensity(ingredient)
    const usPart = { qty: formatQuantity(qty), unit: unit.label }
    if (density) {
      return { usPart, metricPart: metricVolumeFromMl((grams / density) * ML_PER_CUP), bypassedWeight: false }
    }
    return { usPart, metricPart: formatMetricWeight(grams) }
  }

  if (METRIC_WEIGHT_SYMBOLS.has(symbol)) {
    const unit = WEIGHT_UNITS[symbol]
    const grams = weightToGrams(qty, symbol)
    const density = findDensity(ingredient)
    const metricPart = { qty: formatQuantity(qty), unit: unit.label }
    if (density) {
      return { usPart: usVolumeFromMl((grams / density) * ML_PER_CUP), metricPart, bypassedWeight: false }
    }
    return { usPart: usWeightFromGrams(grams), metricPart }
  }

  return null
}

/**
 * Given a parsed ingredient ({ quantity, minQty, maxQty, symbol, ingredient }),
 * returns the dual-unit display parts, or null when the unit is
 * unrecognized/absent (e.g. "2 cloves garlic", "1 pinch salt") and no
 * conversion applies. When minQty/maxQty differ (a quantity range, e.g.
 * "4-4 1/2 cups"), both endpoints are converted and merged into one
 * hyphen-joined range, sharing a single trailing unit when both endpoints
 * land on the same one (e.g. "1-2 tbsp (18-37 g)").
 */
export function convertIngredient({ quantity, minQty, maxQty, symbol, ingredient }) {
  const min = minQty == null ? (quantity == null ? null : Number(quantity)) : Number(minQty)
  if (min == null || Number.isNaN(min) || !symbol) return null
  const maxCandidate = maxQty == null ? min : Number(maxQty)
  const max = Number.isNaN(maxCandidate) ? min : maxCandidate

  if (max === min) {
    const single = convertSingleQuantity(min, symbol, ingredient)
    if (!single) return null
    return { us: joinPart(single.usPart), metric: joinPart(single.metricPart), bypassedWeight: single.bypassedWeight }
  }

  const a = convertSingleQuantity(min, symbol, ingredient)
  const b = convertSingleQuantity(max, symbol, ingredient)
  if (!a || !b) return null
  return {
    us: joinRangePart(a.usPart, b.usPart),
    metric: joinRangePart(a.metricPart, b.metricPart),
    bypassedWeight: a.bypassedWeight || b.bypassedWeight,
  }
}

/**
 * Formats a possibly-ranged quantity (minQty/maxQty from a parsed
 * ingredient) as display text, e.g. "4" or "4-4 1/2". Returns '' when
 * there's no quantity.
 */
export function formatQuantityRange(minQty, maxQty) {
  const min = minQty == null ? null : Number(minQty)
  if (min == null || Number.isNaN(min)) return ''
  const maxCandidate = maxQty == null ? min : Number(maxQty)
  const max = Number.isNaN(maxCandidate) ? min : maxCandidate
  if (max === min) return formatQuantity(min)
  return `${formatQuantity(min)}-${formatQuantity(max)}`
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
 *
 * The line is lowercased before parsing because @magrinj/parse-ingredients
 * matches unit abbreviations case-sensitively against its (lowercase) locale
 * data - real recipe text commonly has units cased as "Tbsp"/"TBSP"/"Tsp",
 * which would otherwise fail to match and get swallowed into the ingredient
 * name instead of being recognized as a unit. `raw` keeps the original
 * casing for display.
 */
export function parseIngredientsText(text) {
  return (text ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parsed = parseIngredientLine(line.toLowerCase())
      return { ...parsed, raw: line }
    })
}

export { parseIngredientLine }
