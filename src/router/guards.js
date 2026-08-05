import { hasToken } from '@/utils/token.js'
import { isCurriculumConfirmed } from '@/utils/curriculumConfirm.js'
import { useLevelTestStore } from '@/store/levelTestStore.js'

const LEVEL_TEST_ENTRY = '/onboarding/intro'

const POST_TEST_ROUTES = new Set(['onboarding-result', 'onboarding-curriculum'])
const PRE_TEST_ROUTES = new Set(['onboarding-intro', 'onboarding-quiz'])

const isOnboardingRoute = (to) =>
  to.matched.some((record) => record.meta.onboarding === true) || to.path.startsWith('/onboarding')

/**
 * 레벨 테스트 완료 여부에 따른 진입 경로
 * — 테스트 완료 + 커리큘럼 미확정 → 결과/커리큘럼 허용
 * @param {boolean} completed
 * @param {string} [fallbackHome='/home']
 */
export const resolvePostAuthPath = (completed, fallbackHome = '/home') => {
  if (!completed) return LEVEL_TEST_ENTRY
  if (isCurriculumConfirmed()) return fallbackHome
  return '/onboarding/result'
}

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
      const curriculumConfirmed = isCurriculumConfirmed()

      if (guestOnly) {
        const redirect = typeof to.query.redirect === 'string' ? to.query.redirect : '/home'
        return resolvePostAuthPath(completed, redirect)
      }

      if (!completed && !onboarding) {
        return { path: LEVEL_TEST_ENTRY }
      }

      if (!completed && onboarding && POST_TEST_ROUTES.has(to.name)) {
        return { name: 'onboarding-quiz' }
      }

      if (completed && onboarding) {
        if (curriculumConfirmed) {
          return { path: '/home' }
        }
        if (PRE_TEST_ROUTES.has(to.name)) {
          return { name: 'onboarding-result' }
        }
        return true
      }

      if (completed && !onboarding && !curriculumConfirmed) {
        return { name: 'onboarding-curriculum' }
      }
    }

    return true
  })
}
