import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import './css/tokens.css'
import './css/print.css'

createApp(App).use(createPinia()).use(router).mount('#app')
