import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import { useSettingsStore } from './stores/settings'
import './css/tokens.css'
import './css/print.css'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.use(router)

// Bounded: db.open() has no timeout and never rejects against a frozen sibling
// tab holding a version-change lock, so an unbounded await here risks a
// permanent white screen. A default-alignment flash is cosmetic; an unmounted
// app is not.
try {
  await Promise.race([
    useSettingsStore(pinia).load(),
    new Promise((resolve) => setTimeout(resolve, 1500)),
  ])
} catch {
  // Fall back to DEFAULT_SETTINGS already in the store's initial state.
}

app.mount('#app')
