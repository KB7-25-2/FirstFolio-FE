import { hasToken } from '@/utils/token.js'
import { useLevelTestStore } from '@/store/levelTestStore.js'

const LEVEL_TEST_ENTRY = '/onboarding/diagnosis'

const isOnboardingRoute = (to) =>
  to.matched.some((record) => record.meta.onboarding === true) || to.path.startsWith('/onboarding')

/**
 * 레벨 테스트 완료 여부에 따른 진입 경로
 * @param {boolean} completed
 * @param {string} [fallbackHome='/home']
 */
export const resolvePostAuthPath = (completed, fallbackHome = '/home') =>
  completed ? fallbackHome : LEVEL_TEST_ENTRY

export const setupAuthGuard = (router) => {
  router.beforeEach(async (to) => {
    const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)
    const guestOnly = to.matched.some((record) => record.meta.guestOnly)

    if (requiresAuth && !hasToken()) {
      return {
        path: '/login',
        query: { redirect: to.fullPath },
      }
    }

    if (hasToken() && (requiresAuth || guestOnly)) {
      const levelTestStore = useLevelTestStore()
      const completed = await levelTestStore.ensureStatus()
      const onboarding = isOnboardingRoute(to)

      if (guestOnly) {
        const redirect = typeof to.query.redirect === 'string' ? to.query.redirect : '/home'
        return resolvePostAuthPath(completed, redirect)
      }

      if (!completed && !onboarding) {
        return { path: LEVEL_TEST_ENTRY }
      }

      if (completed && onboarding) {
        return { path: '/home' }
      }
    }

    return true
  })
}
