import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { login as loginApi, logout as logoutApi } from '@/services/authService.js'
import { setToken, removeToken, hasToken } from '@/utils/token.js'
import { useUserStore } from '@/store/userStore.js'
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

  const logout = async () => {
    try {
      if (hasToken()) {
        await logoutApi()
      }
    } finally {
      removeToken()
      useUserStore().clearProfile()
      await router.push({ path: '/login' })
    }
  }

  return {
    isAuthenticated,
    rememberedEmail,
    login,
    logout,
  }
})
