import { createApp, h, nextTick } from 'vue'
import RecipeSheet from '../components/RecipeSheet.vue'

// Matches PagePreview.vue's print-page dimensions (8.5in x 11in, 0.5in
// margin) so the overflow check mirrors what actually clips at print time.
const PAGE_WIDTH = '8.5in'
const PAGE_HEIGHT = '11in'
const PAGE_MARGIN = '0.5in'

function createContainer() {
  const container = document.createElement('div')
  container.style.position = 'fixed'
  container.style.top = '-9999px'
  container.style.left = '-9999px'
  container.style.visibility = 'hidden'
  container.style.width = PAGE_WIDTH
  container.style.height = PAGE_HEIGHT
  container.style.boxSizing = 'border-box'
  container.style.padding = PAGE_MARGIN
  container.style.overflow = 'hidden'
  document.body.appendChild(container)
  return container
}

// `component`/`props` are overridable so tests can mount a lightweight stub
// instead of the full RecipeSheet + layout-template + settings-store stack.
export async function measureRecipeFit(recipe, { component = RecipeSheet, props = {} } = {}) {
  let container = null
  let app = null
  try {
    container = createContainer()
    app = createApp({
      render: () => h(component, { recipe, ...props }),
    })
    app.mount(container)

    await nextTick()
    await new Promise((resolve) => requestAnimationFrame(resolve))

    return container.scrollHeight <= container.clientHeight
  } catch {
    return null
  } finally {
    app?.unmount()
    container?.remove()
  }
}
