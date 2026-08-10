import { beforeEach, describe, expect, it, vi } from 'vitest'
import axios, { AxiosError } from 'axios'

const {
  getTokenMock,
  setTokenMock,
  removeTokenMock,
  getCurrentFirebaseUserMock,
  getIdTokenMock,
  signOutFirebaseMock,
  routerPushMock,
} = vi.hoisted(() => ({
  getTokenMock: vi.fn(),
  setTokenMock: vi.fn(),
  removeTokenMock: vi.fn(),
  getCurrentFirebaseUserMock: vi.fn(),
  getIdTokenMock: vi.fn(),
  signOutFirebaseMock: vi.fn(),
  routerPushMock: vi.fn(),
}))

vi.mock('@/utils/token.js', () => ({
  getToken: getTokenMock,
  setToken: setTokenMock,
  removeToken: removeTokenMock,
}))

vi.mock('@/services/firebaseAuthService.js', () => ({
  getCurrentFirebaseUser: getCurrentFirebaseUserMock,
  getIdToken: getIdTokenMock,
  signOutFirebase: signOutFirebaseMock,
  FirebaseAuthError: class FirebaseAuthError extends Error {
    constructor(code, message) {
      super(message)
      this.code = code
      this.name = 'FirebaseAuthError'
    }
  },
}))

vi.mock('@/router/index.js', () => ({
  default: {
    currentRoute: { value: { fullPath: '/home' } },
    push: routerPushMock,
  },
}))

/** 다른 스펙이 api/index를 먼저 로드하지 않도록 모듈 단위 격리 */
const loadInterceptors = async () => {
  vi.resetModules()
  return import('@/api/interceptors.js')
}

describe('api/interceptors (unit)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getTokenMock.mockReturnValue(null)
    getCurrentFirebaseUserMock.mockReturnValue(null)
    getIdTokenMock.mockResolvedValue('firebase-id-token')
    signOutFirebaseMock.mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('resolveAuthorizationToken', () => {
    it('Firebase 세션이 있으면 getIdToken으로 토큰을 가져와 캐시한다', async () => {
      const { resolveAuthorizationToken } = await loadInterceptors()
      getCurrentFirebaseUserMock.mockReturnValue({ uid: 'user-1' })

      const token = await resolveAuthorizationToken()

      expect(token).toBe('firebase-id-token')
      expect(getIdTokenMock).toHaveBeenCalledWith(false)
      expect(setTokenMock).toHaveBeenCalledWith('firebase-id-token')
    })

    it('Firebase 세션이 없으면 localStorage 캐시를 반환한다', async () => {
      const { resolveAuthorizationToken } = await loadInterceptors()
      getTokenMock.mockReturnValue('cached-token')

      const token = await resolveAuthorizationToken()

      expect(token).toBe('cached-token')
      expect(getIdTokenMock).not.toHaveBeenCalled()
    })

    it('forceRefresh 시 getIdToken(true)를 호출한다', async () => {
      const { resolveAuthorizationToken } = await loadInterceptors()
      getCurrentFirebaseUserMock.mockReturnValue({ uid: 'user-1' })

      await resolveAuthorizationToken(true)

      expect(getIdTokenMock).toHaveBeenCalledWith(true)
    })
  })

  describe('setupRequestInterceptor', () => {
    it('Firebase 토큰을 Authorization 헤더에 붙인다', async () => {
      const { setupRequestInterceptor } = await loadInterceptors()
      getCurrentFirebaseUserMock.mockReturnValue({ uid: 'user-1' })
      const client = axios.create()
      setupRequestInterceptor(client)

      const handler = client.interceptors.request.handlers[0].fulfilled
      const config = await handler({ headers: {} })

      expect(config.headers.Authorization).toBe('Bearer firebase-id-token')
    })
  })

  describe('setupResponseInterceptor', () => {
    it('401 응답 시 토큰 강제 갱신 후 요청을 한 번 재시도한다', async () => {
      const { setupRequestInterceptor, setupResponseInterceptor } = await loadInterceptors()
      getCurrentFirebaseUserMock.mockReturnValue({ uid: 'user-1' })
      getIdTokenMock.mockResolvedValueOnce('stale-token').mockResolvedValueOnce('fresh-token')

      const client = axios.create()
      setupRequestInterceptor(client)
      setupResponseInterceptor(client)

      const requestSpy = vi
        .spyOn(client, 'request')
        .mockResolvedValueOnce({ status: 200, data: { ok: true } })

      const errorHandler = client.interceptors.response.handlers[0].rejected
      const originalConfig = { headers: {}, url: '/users/me' }

      const result = await errorHandler(
        new AxiosError(
          'Unauthorized',
          'ERR_BAD_REQUEST',
          originalConfig,
          {},
          { status: 401, data: { error: { message: 'unauthorized' } } },
        ),
      )

      expect(getIdTokenMock).toHaveBeenCalledWith(true)
      expect(requestSpy).toHaveBeenCalledTimes(1)
      expect(result).toEqual({ status: 200, data: { ok: true } })
    })

    it('401 재시도 실패 시 로그인으로 리다이렉트한다', async () => {
      getIdTokenMock.mockReset()
      getIdTokenMock.mockRejectedValue(
        Object.assign(new Error('NOT_AUTHENTICATED'), { code: 'NOT_AUTHENTICATED' }),
      )
      getCurrentFirebaseUserMock.mockReturnValue({ uid: 'user-1' })

      const { setupResponseInterceptor } = await loadInterceptors()

      const client = axios.create()
      setupResponseInterceptor(client)

      const requestSpy = vi.spyOn(client, 'request')

      const errorHandler = client.interceptors.response.handlers[0].rejected
      const originalConfig = { headers: {}, url: '/users/me' }

      await expect(
        errorHandler(
          new AxiosError('Unauthorized', 'ERR_BAD_REQUEST', originalConfig, undefined, {
            status: 401,
            data: { error: { message: 'unauthorized' } },
          }),
        ),
      ).rejects.toMatchObject({ status: 401 })

      expect(requestSpy).not.toHaveBeenCalled()
      expect(getIdTokenMock).toHaveBeenCalledWith(true)
      expect(removeTokenMock).toHaveBeenCalled()
      expect(signOutFirebaseMock).toHaveBeenCalled()
      expect(routerPushMock).toHaveBeenCalledWith({
        path: '/login',
        query: { redirect: '/home' },
      })
    })
  })
})
