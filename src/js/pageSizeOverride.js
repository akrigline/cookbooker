import { getPaperSize, DEFAULT_PAPER_SIZE } from './pageDimensions.js'

// print.css's static `@page` rule is the Letter default (see its own
// comment). `@page { size }` can't resolve a CSS custom property and `@page`
// has no class/attribute scoping mechanism, so a non-Letter size is applied
// by injecting a real `<style>` override into document.head instead - only
// when the resolved size isn't Letter, so the default (majority) path never
// touches this at all. Shared by every print view (ProjectPrint.vue,
// RecipePrint.vue) so the injection logic can't drift between them.
const OVERRIDE_ID = 'cm-page-size-override'

export function applyPageSizeOverride(paperSize = DEFAULT_PAPER_SIZE) {
  let styleEl = document.getElementById(OVERRIDE_ID)
  if (paperSize === 'letter') {
    styleEl?.remove()
    return
  }
  const { widthIn, heightIn } = getPaperSize(paperSize)
  if (!styleEl) {
    styleEl = document.createElement('style')
    styleEl.id = OVERRIDE_ID
    document.head.appendChild(styleEl)
  }
  styleEl.textContent = `@page { size: ${widthIn}in ${heightIn}in; margin: 0; }`
}

export function clearPageSizeOverride() {
  document.getElementById(OVERRIDE_ID)?.remove()
}
