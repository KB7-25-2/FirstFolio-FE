import { getToken, removeToken, setToken } from '@/utils/token.js'
import { parseApiError } from '@/api/errorHandler.js'
import router from '@/router/index.js'
import {
  getCurrentFirebaseUser,
  getIdToken,
  signOutFirebase,
} from '@/services/firebaseAuthService.js'

let isRedirecting = false

const redirectToLogin = async () => {
  if (isRedirecting) return

  isRedirecting = true
  removeToken()

  try {
    await signOutFirebase()
  } catch {
    // Firebase 세션이 없거나 이미 종료된 경우
  }

  const currentPath = router.currentRoute.value.fullPath

  if (currentPath !== '/login') {
    await router.push({ path: '/login', query: { redirect: currentPath } })
  }

  isRedirecting = false
}

/**
 * Firebase 세션이 있으면 getIdToken(갱신 포함), 없으면 localStorage 캐시(E2E·목업)
 * @param {boolean} [forceRefresh=false]
 * @returns {Promise<string | null>}
 */
export const resolveAuthorizationToken = async (forceRefresh = false) => {
  if (!getCurrentFirebaseUser()) {
    return getToken()
  }

  try {
    const token = await getIdToken(forceRefresh)
    setToken(token)
    return token
  } catch (error) {
    if (error?.code === 'NOT_AUTHENTICATED') {
      removeToken()
    }
    if (forceRefresh) return null
    return getToken()
  }
}

const attachAuthorizationHeader = async (config, forceRefresh = false) => {
  const hasAuthorization = config.headers?.Authorization || config.headers?.authorization
  if (hasAuthorization) return config

  const token = await resolveAuthorizationToken(forceRefresh)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
}

export const setupRequestInterceptor = (apiClient) => {
  apiClient.interceptors.request.use(
    async (config) => attachAuthorizationHeader(config),
    (error) => Promise.reject(parseApiError(error)),
  )
}

export const setupResponseInterceptor = (apiClient) => {
  apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
      const config = error?.config
      const apiError = parseApiError(error)

      if (apiError.status === 401 && config && !config._authRetry) {
        config._authRetry = true

        try {
          await attachAuthorizationHeader(config, true)
          if (config.headers?.Authorization || config.headers?.authorization) {
            return apiClient.request(config)
          }
        } catch {
          // 강제 갱신 실패 — 로그인으로
        }
      }

      if (apiError.status === 401) {
        await redirectToLogin()
      }

      return Promise.reject(apiError)
    },
  )
}
