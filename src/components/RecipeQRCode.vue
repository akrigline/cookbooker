<script setup>
import { computed, ref, watch } from 'vue'
import QRCode from 'qrcode'
import { generateQRURL, getIngredientLines, getIngredientTextLength, INGREDIENT_WARNING_LENGTH } from '../js/qrShare'

const props = defineProps({
  recipe: {
    type: Object,
    required: true,
  },
})

const svgContent = ref('')

const ingredientLines = computed(() => getIngredientLines(props.recipe))

// Rather than falling back outright once the full ingredient list is too
// long to encode reliably, find the largest prefix of the list that fits
// under the warning threshold (down to 0) and encode that instead.
const includedIngredientCount = computed(() => {
  const lines = ingredientLines.value
  for (let n = lines.length; n > 0; n--) {
    if (getIngredientTextLength(props.recipe, n) <= INGREDIENT_WARNING_LENGTH) return n
  }
  return 0
})

const wasTruncated = computed(() => includedIngredientCount.value < ingredientLines.value.length)

const url = computed(() => generateQRURL(props.recipe, { maxIngredients: includedIngredientCount.value }))

// Check actual QR version, not just the character-count heuristic (same logic
// as the old QRCodeShare modal — see qrShare.js and design.md Decision 3).
const qrVersion = computed(() => {
  try {
    return QRCode.create(url.value, { errorCorrectionLevel: 'L' }).version
  } catch {
    return null
  }
})

const tooDenseToScan = computed(() => qrVersion.value == null || qrVersion.value > 15)
const showFallback = computed(() => tooDenseToScan.value)

async function renderSVG() {
  if (showFallback.value) {
    svgContent.value = ''
    return
  }
  try {
    const svg = await QRCode.toString(url.value, {
      type: 'svg',
      errorCorrectionLevel: 'L',
      margin: 2,
    })
    // Stamp physical dimensions directly on the SVG element so the QR is
    // exactly 1.25in × 1.25in at any printer DPI (resolution-independent).
    svgContent.value = svg.replace(
      /^<svg /,
      '<svg style="width:1.25in;height:1.25in;display:block;" ',
    )
  } catch {
    svgContent.value = ''
  }
}

// Render immediately and whenever the recipe changes.
renderSVG()
watch(url, renderSVG)
</script>

<template>
  <div class="cm-recipe-qr">
    <p class="cm-recipe-qr__header">Copy Ingredients</p>

    <!-- Fallback notice when ingredient list is too long to encode reliably -->
    <p v-if="showFallback" class="cm-recipe-qr__fallback">
      <em>Ingredient list too long to encode as QR</em>
    </p>

    <!-- Inline SVG QR code -->
    <template v-else-if="svgContent">
      <!-- eslint-disable-next-line vue/no-v-html -->
      <div class="cm-recipe-qr__svg" v-html="svgContent" />
      <p class="cm-recipe-qr__caption">
        Scan for shopping list
        <template v-if="wasTruncated">(first {{ includedIngredientCount }} of {{ ingredientLines.length }})</template>
      </p>
    </template>
  </div>
</template>

<style scoped>
.cm-recipe-qr {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  background: white;
  padding: 4px;
  border-radius: 4px;
}

.cm-recipe-qr__header {
  margin: 0;
  font-size: 8px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--ink-30);
  text-align: center;
}

.cm-recipe-qr__fallback {
  margin: 0;
  font-size: 8px;
  line-height: 1.3;
  color: var(--ink-42);
  text-align: center;
  max-width: 1.25in;
}

.cm-recipe-qr__svg {
  /* Size is already stamped on the SVG element itself; this div is just a wrapper */
  line-height: 0;
}

.cm-recipe-qr__caption {
  margin: 0;
  font-size: 7px;
  color: var(--ink-30);
  text-align: center;
  letter-spacing: 0.02em;
  /* Hidden on screen; shown in print */
  display: none;
}

@media print {
  .cm-recipe-qr__caption {
    display: block;
  }
}
</style>
