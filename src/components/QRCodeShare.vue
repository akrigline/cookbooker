<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import QRCode from 'qrcode'
import {
  INGREDIENT_WARNING_LENGTH,
  generateQRURL,
  getIngredientLines,
  getIngredientTextLength,
  isPayloadOversized,
} from '../js/qrShare'

const props = defineProps({
  recipe: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['close'])

const canvasRef = ref(null)
const renderError = ref(null)
const copied = ref(false)

const ingredientCount = computed(() => getIngredientLines(props.recipe).length)
const maxIngredients = ref(ingredientCount.value)

const fullIngredientTextLength = computed(() => getIngredientTextLength(props.recipe))
const oversized = computed(() => isPayloadOversized(props.recipe))
const truncated = computed(() => maxIngredients.value < ingredientCount.value)

const url = computed(() => generateQRURL(props.recipe, { maxIngredients: maxIngredients.value }))

// The QR library will happily generate a huge (unscannable) code, so check
// the actual resulting version rather than trusting the character-count
// heuristic alone (see openspec/changes/recipe-qr-code-sharing/design.md
// Decision 4).
const qrVersion = computed(() => {
  try {
    return QRCode.create(url.value, { errorCorrectionLevel: 'L' }).version
  } catch {
    return null
  }
})
const tooDenseToScan = computed(() => qrVersion.value == null || qrVersion.value > 15)

async function renderCanvas() {
  renderError.value = null
  copied.value = false
  await nextTick()
  if (!canvasRef.value) return
  if (tooDenseToScan.value) return
  try {
    await QRCode.toCanvas(canvasRef.value, url.value, {
      errorCorrectionLevel: 'L',
      margin: 2,
      width: 260,
    })
  } catch {
    renderError.value = 'Could not generate a QR code for this recipe. Try including fewer ingredients.'
  }
}

onMounted(renderCanvas)
watch(url, renderCanvas)

async function copyUrl() {
  try {
    await navigator.clipboard.writeText(url.value)
    copied.value = true
  } catch {
    copied.value = false
  }
}

function handlePrint() {
  window.print()
}

function handleClose() {
  emit('close')
}

function handleKeydown(event) {
  if (event.key === 'Escape') handleClose()
}
</script>

<template>
  <div
    class="cm-qr-overlay"
    @click="handleClose"
    @keydown="handleKeydown"
    style="position:fixed; inset:0; background:oklch(20% 0.01 75 / 0.45); display:flex; align-items:center; justify-content:center; padding:24px; z-index:200;"
  >
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cm-qr-heading"
      @click.stop
      class="cm-qr-modal"
      style="background:oklch(99.3% 0.002 75); border-radius:14px; width:100%; max-width:400px; padding:26px 26px 22px; box-shadow:0 20px 60px oklch(20% 0.02 75 / 0.25); max-height:90vh; overflow-y:auto;"
    >
      <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:12px; margin-bottom:6px;">
        <h2 id="cm-qr-heading" style="font-family:'Newsreader',Georgia,serif; font-size:20px; font-weight:600; margin:0;">
          Share via QR
        </h2>
        <button
          type="button"
          aria-label="Close"
          @click="handleClose"
          class="cm-qr-no-print"
          style="width:28px; height:28px; flex-shrink:0; display:flex; align-items:center; justify-content:center; background:none; border:1px solid oklch(85% 0.008 75); border-radius:7px; cursor:pointer; color:oklch(35% 0.01 75);"
        >
          <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
      </div>
      <p class="cm-qr-no-print" style="margin:0 0 18px; font-size:13px; color:oklch(45% 0.01 75); line-height:1.5;">
        Scan this code with a phone camera to open the ingredient list for "{{ recipe.title }}" — no app, account, or internet upload required.
      </p>

      <div
        v-if="oversized || tooDenseToScan"
        role="alert"
        class="cm-qr-no-print"
        style="margin-bottom:16px; padding:12px 14px; border-radius:8px; background:oklch(96% 0.03 80); border:1px solid oklch(80% 0.08 80); font-size:13px; color:oklch(35% 0.06 70); line-height:1.5;"
      >
        <p style="margin:0 0 8px;">
          <template v-if="tooDenseToScan">This recipe is too large to encode into a reliably scannable QR code.</template>
          <template v-else>This recipe's ingredient list is {{ fullIngredientTextLength }} characters, above the {{ INGREDIENT_WARNING_LENGTH }}-character limit for reliable scanning.</template>
        </p>
        <label style="display:flex; align-items:center; gap:8px; font-weight:600;">
          Include first
          <input
            type="number"
            v-model.number="maxIngredients"
            :min="1"
            :max="ingredientCount"
            style="width:60px; box-sizing:border-box; padding:4px 6px; font-size:13px; border:1px solid oklch(80% 0.08 80); border-radius:6px;"
          />
          of {{ ingredientCount }} ingredients
        </label>
      </div>

      <div style="display:flex; flex-direction:column; align-items:center; gap:12px;">
        <div v-if="tooDenseToScan" style="width:260px; height:260px; display:flex; align-items:center; justify-content:center; border:1px dashed oklch(80% 0.01 75); border-radius:8px; color:oklch(50% 0.01 75); font-size:13px; text-align:center; padding:16px; box-sizing:border-box;">
          Reduce the ingredient count above to generate a code.
        </div>
        <canvas v-else ref="canvasRef" class="cm-qr-canvas" style="border-radius:8px;"></canvas>
        <p v-if="renderError" role="alert" style="margin:0; color:oklch(45% 0.14 25); font-size:13px;">{{ renderError }}</p>
        <p v-if="truncated && !tooDenseToScan" style="margin:0; font-size:12px; color:oklch(50% 0.01 75); text-align:center;">
          Showing the first {{ maxIngredients }} of {{ ingredientCount }} ingredients.
        </p>
      </div>

      <div style="margin-top:16px;">
        <p style="margin:0 0 6px; font-size:11px; font-weight:600; color:oklch(50% 0.01 75); text-transform:uppercase; letter-spacing:0.04em;">Decoder link</p>
        <p class="cm-qr-url" style="margin:0 0 10px; font-size:12px; font-family:ui-monospace,monospace; color:oklch(35% 0.01 75); word-break:break-all; background:oklch(96% 0.004 75); border-radius:6px; padding:8px 10px;">{{ url }}</p>
      </div>

      <div class="cm-qr-no-print" style="display:flex; gap:10px; margin-top:6px; flex-wrap:wrap;">
        <button type="button" @click="copyUrl" style="flex:1; padding:10px 14px; font-size:13px; font-weight:600; border-radius:8px; border:1px solid oklch(82% 0.008 75); background:none; cursor:pointer; min-width:120px;">
          {{ copied ? 'Copied!' : 'Copy link' }}
        </button>
        <button type="button" @click="handlePrint" style="flex:1; padding:10px 14px; font-size:13px; font-weight:600; border-radius:8px; border:1px solid oklch(82% 0.008 75); background:none; cursor:pointer; min-width:120px;">
          Print QR code
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
button:hover {
  filter: brightness(0.95);
}
button:focus-visible,
input:focus-visible {
  outline: 2px solid oklch(52% 0.16 250);
  outline-offset: 1px;
}
@media print {
  .cm-qr-overlay {
    position: static !important;
    background: none !important;
    padding: 0 !important;
    display: block !important;
  }
  .cm-qr-modal {
    box-shadow: none !important;
    max-width: none !important;
    max-height: none !important;
  }
  .cm-qr-no-print {
    display: none !important;
  }
}
</style>
