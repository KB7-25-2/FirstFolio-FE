import { hasToken } from '@/utils/token.js'
import { useAuthStore } from '@/store/authStore.js'
import { useLevelTestStore } from '@/store/levelTestStore.js'
import { useUserStore } from '@/store/userStore.js'
import { resolveAuthEntryPath, resolveOnboardingGuardTarget } from '@/router/onboardingRedirect.js'

export { resolvePostAuthPath } from '@/router/onboardingRedirect.js'

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
    }

    return true
  })
}
