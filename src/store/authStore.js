import { defineStore, acceptHMRUpdate } from 'pinia'
import { computed, ref } from 'vue'
import {
  login as loginApi,
  logout as logoutApi,
  signupWithGoogle as signupWithGoogleApi,
} from '@/services/authService.js'
import { setToken, removeToken, hasToken } from '@/utils/token.js'
import { useUserStore } from '@/store/userStore.js'
import { useLevelTestStore } from '@/store/levelTestStore.js'
import router from '@/router/index.js'

const REMEMBER_KEY = 'auth_remember_email'

export const useAuthStore = defineStore('auth', () => {
  const isAuthenticated = computed(() => hasToken())
  const rememberedEmail = ref(localStorage.getItem(REMEMBER_KEY) || '')

  const login = async (credentials, options = {}) => {
    const { data } = await loginApi(credentials)
    const token = data.accessToken ?? data.token

    if (!token) {
      throw new Error('로그인 응답에 토큰이 없습니다.')
    }

    setToken(token)

    if (options.remember) {
      localStorage.setItem(REMEMBER_KEY, credentials.email)
      rememberedEmail.value = credentials.email
    } else {
      localStorage.removeItem(REMEMBER_KEY)
      rememberedEmail.value = ''
    }

    const userStore = useUserStore()
    await userStore.fetchProfile()
  }

  const signupWithGoogle = async () => {
    const { data, idToken } = await signupWithGoogleApi()
    setToken(idToken)

    const userStore = useUserStore()
    await userStore.fetchProfile()

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
    logout,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAuthStore, import.meta.hot))
}
