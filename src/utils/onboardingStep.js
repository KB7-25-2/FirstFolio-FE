const ONBOARDING_STEP_KEY = 'onboarding_step'

/**
 * POST /auth/login 응답 onboarding_step (세션 동안 유지)
 * @returns {string | null}
 */
export const getStoredOnboardingStep = () => sessionStorage.getItem(ONBOARDING_STEP_KEY)

/**
 * @param {string | null | undefined} step
 */
export const setStoredOnboardingStep = (step) => {
  if (step) {
    sessionStorage.setItem(ONBOARDING_STEP_KEY, step)
    return
  }
  sessionStorage.removeItem(ONBOARDING_STEP_KEY)
}

export const clearStoredOnboardingStep = () => {
  sessionStorage.removeItem(ONBOARDING_STEP_KEY)
}

export { ONBOARDING_STEP_KEY }
