import { getToken, removeToken, setToken } from '@/utils/token.js'
import { parseApiError } from '@/api/user/errorHandler.js'
import router from '@/router/index.js'
import {
  getCurrentFirebaseUser,
  getIdToken,
  signOutFirebase,
} from '@/services/firebaseAuthService.js'
import {
  advanceSessionEpoch,
  getSessionEpoch,
  isCurrentSessionEpoch,
} from '@/utils/sessionEpoch.js'

let isRedirecting = false

const redirectToLogin = async () => {
  if (isRedirecting) return

  isRedirecting = true
  advanceSessionEpoch()
  removeToken()

  try {
    await signOutFirebase()
  } catch {
    // Firebase 세션이 없거나 이미 종료된 경우
  }
  try {
    localStorage.clear()
    sessionStorage.clear()
  } catch {
    // 저장소 접근이 막힌 환경은 무시한다.
  }
  window.dispatchEvent(new Event('ff:clear-user-session'))

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
  config._sessionEpoch = getSessionEpoch()
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
    (response) => {
      if (
        response.config?._sessionEpoch != null &&
        !isCurrentSessionEpoch(response.config._sessionEpoch)
      ) {
        return Promise.reject(
          Object.assign(new Error('이전 사용자 세션의 응답입니다.'), {
            code: 'STALE_SESSION_RESPONSE',
          }),
        )
      }
      return response
    },
    async (error) => {
      const config = error?.config
      if (config?._sessionEpoch != null && !isCurrentSessionEpoch(config._sessionEpoch)) {
        return Promise.reject(
          Object.assign(new Error('이전 사용자 세션의 응답입니다.'), {
            code: 'STALE_SESSION_RESPONSE',
          }),
        )
      }
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
