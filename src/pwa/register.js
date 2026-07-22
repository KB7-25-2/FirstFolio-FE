import { registerSW } from 'virtual:pwa-register'

export const registerPwa = () => {
  registerSW({
    immediate: true,
    onRegisterError(error) {
      console.error('[PWA] Service Worker 등록 실패', error)
    },
  })
}
