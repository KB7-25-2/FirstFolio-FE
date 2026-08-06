import { hasToken } from '@/utils/token.js'
import { isCurriculumConfirmed } from '@/utils/curriculumConfirm.js'
import { useAuthStore } from '@/store/authStore.js'
import { useLevelTestStore } from '@/store/levelTestStore.js'
import { resolveAuthEntryPath, resolveOnboardingGuardTarget } from '@/router/onboardingRedirect.js'

export { resolvePostAuthPath } from '@/router/onboardingRedirect.js'

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
      const authStore = useAuthStore()
      const levelTestStore = useLevelTestStore()
      const levelTestCompleted = await levelTestStore.ensureStatus()
      const curriculumConfirmed = isCurriculumConfirmed()
      const onboardingStep = authStore.onboardingStep

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
    }

    return true
  })
}
