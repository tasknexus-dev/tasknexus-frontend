import '@/shared/styles/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import { installAuth } from '@/features/auth/setup'

import App from './App.vue'
import router from './router'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
installAuth(pinia, router)
app.use(router)

app.mount('#app')
