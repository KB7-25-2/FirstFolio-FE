import { beforeEach, describe, expect, it, vi } from 'vitest'

const { logoutApiMock, getIdTokenMock, signOutFirebaseMock, getTokenMock } = vi.hoisted(() => ({
  logoutApiMock: vi.fn(),
  getIdTokenMock: vi.fn(),
  signOutFirebaseMock: vi.fn(),
  getTokenMock: vi.fn(),
}))

vi.mock('@/api/authApi.js', () => ({
  signUp: vi.fn(),
  login: vi.fn(),
  logout: logoutApiMock,
}))

vi.mock('@/services/firebaseAuthService.js', () => ({
  signInWithGoogle: vi.fn(),
  signInWithEmail: vi.fn(),
  signUpWithEmail: vi.fn(),
  getIdToken: getIdTokenMock,
  signOutFirebase: signOutFirebaseMock,
  FirebaseAuthError: class FirebaseAuthError extends Error {},
}))

vi.mock('@/utils/token.js', () => ({
  getToken: getTokenMock,
}))

import { logout } from '@/services/authService.js'

describe('authService.logout (unit)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getTokenMock.mockReturnValue('stored-id-token')
    getIdTokenMock.mockResolvedValue('fresh-id-token')
    signOutFirebaseMock.mockResolvedValue(undefined)
    logoutApiMock.mockResolvedValue({ status: 204 })
  })

  it('저장된 토큰으로 logout API를 호출한 뒤 Firebase signOut 한다', async () => {
    await logout()

    expect(logoutApiMock).toHaveBeenCalledWith('stored-id-token')
    expect(signOutFirebaseMock).toHaveBeenCalledTimes(1)
  })

  it('API가 401이어도 Firebase signOut을 완료한다', async () => {
    logoutApiMock.mockRejectedValue({ status: 401, code: 'UNAUTHORIZED' })

    await expect(logout()).resolves.toBeUndefined()
    expect(signOutFirebaseMock).toHaveBeenCalledTimes(1)
  })

  it('로컬 토큰이 없으면 Firebase getIdToken으로 API를 호출한다', async () => {
    getTokenMock.mockReturnValue(null)

    await logout()

    expect(logoutApiMock).toHaveBeenCalledWith('fresh-id-token')
    expect(signOutFirebaseMock).toHaveBeenCalledTimes(1)
  })

  it('토큰이 전혀 없으면 API 없이 Firebase signOut만 한다', async () => {
    getTokenMock.mockReturnValue(null)
    getIdTokenMock.mockRejectedValue(new Error('NOT_AUTHENTICATED'))

    await logout()

    expect(logoutApiMock).not.toHaveBeenCalled()
    expect(signOutFirebaseMock).toHaveBeenCalledTimes(1)
  })
})
