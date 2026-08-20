import { defineStore, acceptHMRUpdate } from 'pinia'
import { computed, ref } from 'vue'
import {
  logout as logoutApi,
  signupWithGoogle as signupWithGoogleApi,
  signupWithEmail as signupWithEmailApi,
  signupWithExistingFirebaseSession as signupWithExistingSessionApi,
  loginWithGoogle as loginWithGoogleApi,
  loginWithEmail as loginWithEmailApi,
  refreshLoginSession,
} from '@/services/authService.js'
import { setToken, removeToken, hasToken } from '@/utils/token.js'
import {
  clearStoredOnboardingStep,
  getStoredOnboardingStep,
  setStoredOnboardingStep,
} from '@/utils/onboardingStep.js'
import { clearPersistedUserSession, clearUserScopedStores } from '@/utils/userSessionCleanup.js'
import { advanceSessionEpoch } from '@/utils/sessionEpoch.js'
import { useUserStore } from '@/store/userStore.js'
import router from '@/router/index.js'

const REMEMBER_KEY = 'auth_remember_email'

export const useAuthStore = defineStore('auth', () => {
  const isAuthenticated = computed(() => hasToken())
  const rememberedEmail = ref(localStorage.getItem(REMEMBER_KEY) || '')
  /** @type {import('vue').Ref<string | null>} POST /auth/login · signup 응답 onboarding_step */
  const onboardingStep = ref(getStoredOnboardingStep())

  /**
   * @param {string} idToken
   * @param {string | undefined} [nextOnboardingStep]
   */
  const establishSession = async (idToken, nextOnboardingStep) => {
    // 같은 탭에서 다른 계정으로 전환해도 이전 Pinia 데이터가 보이지 않게 한다.
    advanceSessionEpoch()
    clearUserScopedStores()
    setToken(idToken)
    if (nextOnboardingStep) {
      setOnboardingStep(nextOnboardingStep)
    }
    await useUserStore().fetchProfile()
  }

  /**
   * 온보딩 단계 갱신 — auth API(login/signup) 응답 onboarding_step만 저장
   * @param {import('@/router/onboardingRedirect.js').OnboardingStep | string} step
   */
  const setOnboardingStep = (step) => {
    onboardingStep.value = step
    setStoredOnboardingStep(step)
  }

  const ensureOnboardingStep = async () => {
    if (onboardingStep.value || !hasToken()) return onboardingStep.value
    const data = await refreshLoginSession()
    setOnboardingStep(data.onboardingStep)
    return onboardingStep.value
  }

  /**
   * @param {{ email: string, password: string }} credentials
   * @param {{ remember?: boolean }} [options]
   */
  const loginWithEmail = async (credentials, options = {}) => {
    const { data, idToken } = await loginWithEmailApi(credentials)

    if (options.remember) {
      localStorage.setItem(REMEMBER_KEY, credentials.email)
      rememberedEmail.value = credentials.email
    } else {
      localStorage.removeItem(REMEMBER_KEY)
      rememberedEmail.value = ''
    }

    await establishSession(idToken, data.onboardingStep)
    return data
  }

  const signupWithGoogle = async (options = {}) => {
    const { data, idToken } = await signupWithGoogleApi(options)
    await establishSession(idToken, data.onboardingStep)
    return data
  }

  const signupWithEmail = async (payload) => {
    const { data, idToken } = await signupWithEmailApi(payload)
    await establishSession(idToken, data.onboardingStep)
    return data
  }

  const signupWithExistingFirebaseSession = async (payload = {}) => {
    const { data, idToken } = await signupWithExistingSessionApi(payload)
    await establishSession(idToken, data.onboardingStep)
    return data
  }

  const loginWithGoogle = async (options = {}) => {
    const { data, idToken } = await loginWithGoogleApi(options)
    await establishSession(idToken, data.onboardingStep)
    return data
  }

  const logout = async () => {
    // 로그아웃 API는 기존 토큰으로 호출하되, 화면과 이전 요청은 즉시 무효화한다.
    advanceSessionEpoch()
    clearUserScopedStores()
    try {
      await logoutApi()
    } finally {
      removeToken()
      onboardingStep.value = null
      rememberedEmail.value = ''
      clearStoredOnboardingStep()
      clearPersistedUserSession()
      await router.push({ path: '/login' })
    }
  }

  return {
    isAuthenticated,
    rememberedEmail,
    onboardingStep,
    setOnboardingStep,
    ensureOnboardingStep,
    loginWithEmail,
    signupWithGoogle,
    signupWithEmail,
    signupWithExistingFirebaseSession,
    loginWithGoogle,
    logout,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAuthStore, import.meta.hot))
}
