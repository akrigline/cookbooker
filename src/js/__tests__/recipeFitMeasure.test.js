import { describe, expect, it } from 'vitest'
import { h } from 'vue'
import { measureRecipeFit } from '../recipeFitMeasure'

// Stub component sidesteps RecipeSheet's dependency on the settings store and
// layout-template registry - this test is only exercising the
// mount/measure/unmount plumbing, not real recipe rendering.
const FittingStub = {
  props: ['recipe'],
  render: () => h('div', { style: 'height: 10px' }, 'fits'),
}

describe('measureRecipeFit', () => {
  it('resolves true when the rendered content fits within the container', async () => {
    const result = await measureRecipeFit({ title: 'Short' }, { component: FittingStub })
    expect(result).toBe(true)
  })

  it('resolves false when the rendered content overflows the container', async () => {
    const OverflowingStub = {
      props: ['recipe'],
      mounted() {
        // happy-dom has no real layout engine, so scrollHeight/clientHeight
        // never reflect actual overflow from CSS alone - stub the values a
        // real browser would report for content taller than the page.
        Object.defineProperty(this.$el.parentElement, 'scrollHeight', { value: 2000, configurable: true })
        Object.defineProperty(this.$el.parentElement, 'clientHeight', { value: 1000, configurable: true })
      },
      render: () => h('div', 'overflow'),
    }
    const result = await measureRecipeFit({ title: 'Long' }, { component: OverflowingStub })
    expect(result).toBe(false)
  })

  it('resolves null and cleans up the container when the component throws', async () => {
    const ThrowingStub = {
      setup() {
        throw new Error('boom')
      },
    }
    const before = document.body.childElementCount
    const result = await measureRecipeFit({ title: 'Broken' }, { component: ThrowingStub })
    expect(result).toBe(null)
    expect(document.body.childElementCount).toBe(before)
  })

  it('removes the offscreen container after measuring', async () => {
    const before = document.body.childElementCount
    await measureRecipeFit({ title: 'Short' }, { component: FittingStub })
    expect(document.body.childElementCount).toBe(before)
  })
})
