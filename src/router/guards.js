import { hasToken } from '@/utils/token.js'
import { useAuthStore } from '@/store/authStore.js'
import { useLevelTestStore } from '@/store/levelTestStore.js'
import { useStudyStore } from '@/store/studyStore.js'
import { useUserStore } from '@/store/userStore.js'
import { resolveAuthEntryPath, resolveOnboardingGuardTarget } from '@/router/onboardingRedirect.js'

export { resolvePostAuthPath } from '@/router/onboardingRedirect.js'

const isPortfolioRoute = (to) => to.path === '/portfolios' || to.path.startsWith('/portfolios/')

/**
 * 기초 과정 미수료 시 포트폴리오 라우트 차단
 * @param {import('vue-router').RouteLocationNormalized} to
 * @returns {Promise<true | { name: string, query: Record<string, string> }>}
 */
const resolvePortfolioAccess = async (to) => {
  if (!isPortfolioRoute(to)) return true

  const studyStore = useStudyStore()
  if (!studyStore.curriculumItems.length) {
    try {
      await studyStore.fetchCurriculum()
    } catch {
      /* CURRICULUM_NOT_FOUND 등 → 잠금 유지 */
    }
  }

  if (studyStore.isFoundationCompleted) return true

  return {
    name: 'home',
    query: { portfolioLocked: '1' },
  }
}

export const setupAuthGuard = (router) => {
  router.beforeEach(async (to) => {
    const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)
    const requiresAdmin = to.matched.some((record) => record.meta.requiresAdmin)
    const guestOnly = to.matched.some((record) => record.meta.guestOnly)

    if (requiresAuth && !hasToken()) {
      return {
        path: '/login',
        query: { redirect: to.fullPath },
      }
    }

    if (hasToken() && (requiresAuth || guestOnly)) {
      const authStore = useAuthStore()
      const userStore = useUserStore()
      const levelTestStore = useLevelTestStore()

      if (requiresAdmin) {
        if (!userStore.profile) {
          await userStore.fetchProfile()
        }
        if (!userStore.isAdmin) {
          return { name: 'home' }
        }
        return true
      }

      const onboardingStep = await authStore.ensureOnboardingStep()
      const levelTestCompleted = onboardingStep
        ? onboardingStep !== 'LEVEL_TEST'
        : await levelTestStore.ensureStatus()
      const curriculumConfirmed = onboardingStep === 'HOME'

      if (guestOnly) {
        const redirect = typeof to.query.redirect === 'string' ? to.query.redirect : '/home'
        return resolveAuthEntryPath({
          onboardingStep,
          levelTestCompleted,
          curriculumConfirmed,
          fallbackHome: redirect,
        })
      }

      const target = resolveOnboardingGuardTarget(to, {
        onboardingStep,
        levelTestCompleted,
        curriculumConfirmed,
      })
      if (target !== true) return target

      return resolvePortfolioAccess(to)
    }

    return true
  })
}
