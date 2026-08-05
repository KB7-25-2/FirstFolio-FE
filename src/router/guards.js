import { hasToken } from '@/utils/token.js'

export const setupAuthGuard = (router) => {
  router.beforeEach((to) => {
    const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)
    const guestOnly = to.matched.some((record) => record.meta.guestOnly)

    if (requiresAuth && !hasToken()) {
      return {
        path: '/login',
        query: { redirect: to.fullPath },
      }
    }

    if (guestOnly && hasToken()) {
      const redirect = typeof to.query.redirect === 'string' ? to.query.redirect : '/home'
      return redirect
    }

    return true
  })
}
