import { hasToken, setToken } from '@/utils/token.js'

const DEV_BYPASS_TOKEN = 'dev-bypass-token'

export const setupAuthGuard = (router) => {
  router.beforeEach((to) => {
    const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)
    const guestOnly = to.matched.some((record) => record.meta.guestOnly)

    if (requiresAuth && !hasToken()) {
      // 백엔드 미연결 시 홈/학습 UI 미리보기용 임시 토큰
      setToken(DEV_BYPASS_TOKEN)
    }

    if (guestOnly && hasToken()) {
      const redirect = typeof to.query.redirect === 'string' ? to.query.redirect : '/home'
      return redirect
    }

    return true
  })
}
