import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import { startInstallCapture } from './composables/useInstall'
import { startTheme } from './composables/useTheme'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)

startTheme()
startInstallCapture()
app.mount('#app')
