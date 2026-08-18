import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { registerPwa } from '@/pwa/register.js'
import { initAuthSessionSync, syncAuthSessionOnce } from '@/bootstrap/authSessionSync.js'

import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import {
  faHouse,
  faBookOpen,
  faChartPie,
  faShop,
  faCalendarDay,
  faArrowRightFromBracket,
  faUser,
  faBars,
  faXmark,
  faLock,
} from '@fortawesome/free-solid-svg-icons'

library.add(
  faHouse,
  faBookOpen,
  faChartPie,
  faShop,
  faCalendarDay,
  faArrowRightFromBracket,
  faUser,
  faBars,
  faXmark,
  faLock,
)

import './assets/styles/main.css'

const app = createApp(App)

initAuthSessionSync()
app.use(createPinia())
app.use(router)
app.component('FontAwesomeIcon', FontAwesomeIcon)

syncAuthSessionOnce().finally(() => {
  app.mount('#app')
})

registerPwa()
