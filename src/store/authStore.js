import { defineStore, acceptHMRUpdate } from 'pinia'
import { computed, ref } from 'vue'
import {
  logout as logoutApi,
  signupWithGoogle as signupWithGoogleApi,
  signupWithEmail as signupWithEmailApi,
  loginWithGoogle as loginWithGoogleApi,
  loginWithEmail as loginWithEmailApi,
} from '@/services/authService.js'
import { setToken, removeToken, hasToken } from '@/utils/token.js'
import {
  clearStoredOnboardingStep,
  getStoredOnboardingStep,
  setStoredOnboardingStep,
} from '@/utils/onboardingStep.js'
import { useUserStore } from '@/store/userStore.js'
import { useLevelTestStore } from '@/store/levelTestStore.js'
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
    setToken(idToken)
    if (nextOnboardingStep) {
      setOnboardingStep(nextOnboardingStep)
    }
    await useUserStore().fetchProfile()
  }

  /**
   * 온보딩 단계 갱신 (로그인 응답·플로우 완료 시)
   * @param {import('@/router/onboardingRedirect.js').OnboardingStep | string} step
   */
  const setOnboardingStep = (step) => {
    onboardingStep.value = step
    setStoredOnboardingStep(step)
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

  const loginWithGoogle = async (options = {}) => {
    const { data, idToken } = await loginWithGoogleApi(options)
    await establishSession(idToken, data.onboardingStep)
    return data
  }

  const logout = async () => {
    try {
      await logoutApi()
    } finally {
      removeToken()
      onboardingStep.value = null
      clearStoredOnboardingStep()
      useUserStore().clearProfile()
      useLevelTestStore().clearSession()
      await router.push({ path: '/login' })
    }
  }

  return {
    isAuthenticated,
    rememberedEmail,
    onboardingStep,
    setOnboardingStep,
    loginWithEmail,
    signupWithGoogle,
    signupWithEmail,
    loginWithGoogle,
    logout,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAuthStore, import.meta.hot))
}
