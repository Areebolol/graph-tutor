import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'
import { initCsrfToken } from './utils/csrf'
import { loadTheme } from './utils/theme'
import './style.css'

loadTheme()

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

const auth = useAuthStore(pinia)

;(async () => {
  await initCsrfToken().catch(() => {})
  await auth.bootstrap()
  app.mount('#app')
})()
