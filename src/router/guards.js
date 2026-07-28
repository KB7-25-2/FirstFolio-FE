import { hasToken } from '@/utils/token.js'

export const setupAuthGuard = (router) => {
  router.beforeEach((to) => {
    const isLoggedIn = hasToken()
    const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)
    const guestOnly = to.matched.some((record) => record.meta.guestOnly)

    if (requiresAuth && !isLoggedIn) {
      return {
        path: '/login',
        query: { redirect: to.fullPath },
      }
    }

    if (guestOnly && isLoggedIn) {
      const redirect = typeof to.query.redirect === 'string' ? to.query.redirect : '/'
      return redirect
    }

    return true
  })
}
