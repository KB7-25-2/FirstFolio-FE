import { config } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach } from 'vitest'

beforeEach(() => {
  setActivePinia(createPinia())
  localStorage.clear()
})

config.global.stubs = {
  FontAwesomeIcon: true,
  RouterLink: true,
  RouterView: true,
}
