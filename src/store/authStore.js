import { defineStore, acceptHMRUpdate } from 'pinia'
import { computed, ref } from 'vue'
import {
  login as loginApi,
  logout as logoutApi,
  signupWithGoogle as signupWithGoogleApi,
  signupWithEmail as signupWithEmailApi,
  loginWithGoogle as loginWithGoogleApi,
} from '@/services/authService.js'
import { setToken, removeToken, hasToken } from '@/utils/token.js'
import { useUserStore } from '@/store/userStore.js'
import { useLevelTestStore } from '@/store/levelTestStore.js'
import router from '@/router/index.js'

const REMEMBER_KEY = 'auth_remember_email'

export const useAuthStore = defineStore('auth', () => {
  const isAuthenticated = computed(() => hasToken())
  const rememberedEmail = ref(localStorage.getItem(REMEMBER_KEY) || '')

  /**
   * @param {string} idToken
   */
  const establishSession = async (idToken) => {
    setToken(idToken)
    await useUserStore().fetchProfile()
  }

  const login = async (credentials, options = {}) => {
    const { data } = await loginApi(credentials)
    const token = data.accessToken ?? data.token

    if (!token) {
      throw new Error('로그인 응답에 토큰이 없습니다.')
    }

    if (options.remember) {
      localStorage.setItem(REMEMBER_KEY, credentials.email)
      rememberedEmail.value = credentials.email
    } else {
      localStorage.removeItem(REMEMBER_KEY)
      rememberedEmail.value = ''
    }

    await establishSession(token)
  }

  const signupWithGoogle = async (options = {}) => {
    const { data, idToken } = await signupWithGoogleApi(options)
    await establishSession(idToken)
    return data
  }

  const signupWithEmail = async (payload) => {
    const { data, idToken } = await signupWithEmailApi(payload)
    await establishSession(idToken)
    return data
  }

  const loginWithGoogle = async (options = {}) => {
    const { data, idToken } = await loginWithGoogleApi(options)
    await establishSession(idToken)
    return data
  }

  const logout = async () => {
    try {
      if (hasToken()) {
        await logoutApi()
      }
    } finally {
      removeToken()
      useUserStore().clearProfile()
      useLevelTestStore().clearSession()
      await router.push({ path: '/login' })
    }
  }

  return {
    isAuthenticated,
    rememberedEmail,
    login,
    signupWithGoogle,
    signupWithEmail,
    loginWithGoogle,
    logout,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAuthStore, import.meta.hot))
}
