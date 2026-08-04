import LZString from 'lz-string'

// The decoder is the app's own /decode route (see src/views/DecodeRecipe.vue);
// it has no server component and never receives the payload — it's carried
// entirely in the URL fragment. Exported so the router can register the same
// path without the two ever drifting apart.
export const DECODE_ROUTE_PATH = '/decode'

// Threshold on ingredient text (pre-compression) above which reliable QR
// scanning is not guaranteed; see design.md Decision 5.
export const INGREDIENT_WARNING_LENGTH = 1500

export function getIngredientLines(recipe) {
  return (recipe?.ingredients ?? []).map((i) => i?.raw ?? '').filter((line) => line.length > 0)
}

export function getIngredientTextLength(recipe, maxIngredients) {
  let lines = getIngredientLines(recipe)
  if (typeof maxIngredients === 'number') lines = lines.slice(0, maxIngredients)
  return lines.join('\n').length
}

export function isPayloadOversized(recipe) {
  return getIngredientTextLength(recipe) > INGREDIENT_WARNING_LENGTH
}

/**
 * Plain-text payload: title on the first line, one ingredient per line
 * after. Deliberately not JSON/HTML — the decoder only ever needs to split
 * on newlines and render each line as escaped text.
 */
export function encodeRecipePayload(recipe, { maxIngredients } = {}) {
  const title = (recipe?.title ?? '').trim()
  let lines = getIngredientLines(recipe)
  if (typeof maxIngredients === 'number') lines = lines.slice(0, maxIngredients)
  return [title, ...lines].join('\n')
}

export function compressPayload(payload) {
  return LZString.compressToEncodedURIComponent(payload)
}

export function decompressPayload(compressed) {
  if (!compressed) return null
  try {
    const result = LZString.decompressFromEncodedURIComponent(compressed)
    return result || null
  } catch {
    return null
  }
}

export function generateQRURL(recipe, options) {
  const payload = encodeRecipePayload(recipe, options)
  return `${window.location.origin}${DECODE_ROUTE_PATH}#${compressPayload(payload)}`
}

export function parseRecipePayload(text) {
  const lines = text.split('\n')
  return { title: lines[0] ?? '', ingredients: lines.slice(1) }
}
