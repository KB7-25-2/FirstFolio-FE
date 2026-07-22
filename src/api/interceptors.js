import { getToken, removeToken } from '@/utils/token.js'
import { parseApiError } from '@/api/errorHandler.js'

let isRedirecting = false

const redirectToLogin = async () => {
  if (isRedirecting) return

  isRedirecting = true
  removeToken()

  const { default: router } = await import('@/router/index.js')
  const currentPath = router.currentRoute.value.fullPath

  if (currentPath !== '/login') {
    await router.push({ path: '/login', query: { redirect: currentPath } })
  }

  isRedirecting = false
}

export const setupRequestInterceptor = (apiClient) => {
  apiClient.interceptors.request.use(
    (config) => {
      const token = getToken()

      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }

      return config
    },
    (error) => Promise.reject(parseApiError(error)),
  )
}

export const setupResponseInterceptor = (apiClient) => {
  apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
      const apiError = parseApiError(error)

      if (apiError.status === 401) {
        await redirectToLogin()
      }

      return Promise.reject(apiError)
    },
  )
}
