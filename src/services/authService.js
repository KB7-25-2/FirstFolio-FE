/**
 * 인증 mock 서비스
 * TODO: 백엔드 연동 시 `@/api/authApi.js`로 교체
 */

const delay = (ms = 200) => new Promise((resolve) => setTimeout(resolve, ms))

export class AuthApiError extends Error {
  /**
   * @param {string} code
   * @param {string} message
   * @param {number} [status=400]
   */
  constructor(code, message, status = 400) {
    super(message)
    this.name = 'AuthApiError'
    this.code = code
    this.status = status
  }
}

/**
 * 로그인 (목업) — 이메일·비밀번호만 있으면 성공
 * POST /auth/login
 * @param {{ email: string, password: string }} credentials
 * @returns {Promise<{ data: { accessToken: string } }>}
 */
export const login = async (credentials) => {
  await delay()
  const email = credentials?.email?.trim()
  const password = credentials?.password

  if (!email || !password) {
    throw new AuthApiError('VALIDATION_ERROR', '이메일과 비밀번호를 입력해 주세요.', 400)
  }

  if (!email.includes('@')) {
    throw new AuthApiError('VALIDATION_ERROR', '올바른 이메일 형식이 아닙니다.', 400)
  }

  return {
    data: {
      accessToken: `mock-access-token-${Date.now()}`,
    },
  }
}

/**
 * 로그아웃 (목업)
 * POST /auth/logout
 */
export const logout = async () => {
  await delay(50)
}

/**
 * 토큰 갱신 (목업)
 * POST /auth/refresh
 * @returns {Promise<{ data: { accessToken: string } }>}
 */
export const refreshToken = async () => {
  await delay(50)
  return {
    data: {
      accessToken: `mock-access-token-${Date.now()}`,
    },
  }
}
