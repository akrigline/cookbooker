import { createApp, h, nextTick } from 'vue'
import RecipeSheet from '../components/RecipeSheet.vue'
import { pageWidth, pageHeight, PAGE_MARGIN, DEFAULT_PAPER_SIZE } from './pageDimensions.js'

function createContainer(paperSize) {
  const container = document.createElement('div')
  container.style.position = 'fixed'
  container.style.top = '-9999px'
  container.style.left = '-9999px'
  container.style.visibility = 'hidden'
  container.style.width = pageWidth(paperSize)
  container.style.height = pageHeight(paperSize)
  container.style.boxSizing = 'border-box'
  container.style.padding = PAGE_MARGIN
  container.style.overflow = 'hidden'
  document.body.appendChild(container)
  return container
}

// `component`/`props` are overridable so tests can mount a lightweight stub
// instead of the full RecipeSheet + layout-template + settings-store stack.
export async function measureRecipeFit(
  recipe,
  { component = RecipeSheet, props = {}, paperSize = DEFAULT_PAPER_SIZE } = {},
) {
  let container = null
  let app = null
  try {
    container = createContainer(paperSize)
    app = createApp({
      render: () => h(component, { recipe, ...props }),
    })
    app.mount(container)

    await nextTick()
    // index.html loads Google Fonts with `display=swap`, so text initially
    // renders in a fallback font with different metrics and swaps to the
    // real one once it loads - measuring before that swap can read a
    // fit/overflow result that doesn't match the real render (see
    // tocLayout.js's measureTocLayout for the same race and fuller context).
    // Must run AFTER mounting, not as an upfront gate: `document.fonts.ready`
    // only accounts for fonts already requested by something on the page, so
    // checking it before this mount exists could resolve before its fonts
    // are even requested.
    if (typeof document !== 'undefined' && document.fonts) await document.fonts.ready
    await new Promise((resolve) => requestAnimationFrame(resolve))

    return container.scrollHeight <= container.clientHeight
  } catch {
    return null
  } finally {
    app?.unmount()
    container?.remove()
  }
}
