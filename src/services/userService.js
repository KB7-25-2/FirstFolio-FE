/**
 * @typedef {import('@/types/user.js').UserProfile} UserProfile
 */

const delay = (ms = 150) => new Promise((resolve) => setTimeout(resolve, ms))

export class UserApiError extends Error {
  /**
   * @param {string} code
   * @param {string} message
   * @param {number} [status=400]
   */
  constructor(code, message, status = 400) {
    super(message)
    this.name = 'UserApiError'
    this.code = code
    this.status = status
    this.requestId = `req-mock-${Date.now()}`
  }
}

/** API 원본 형태 목업 (snake_case) — Figma 홈 인사말 닉네임 맞춤 */
const MOCK_USER_PROFILE_RESPONSE = {
  data: {
    user_id: 101,
    email: 'student@example.com',
    nickname: '김투자',
    role_code: 'USER',
    newsletter_opt_in: true,
    point_balance: 3800,
    created_at: '2026-07-29T01:00:00Z',
  },
}

/**
 * @param {object} raw
 * @returns {UserProfile}
 */
const mapUserProfile = (raw) => ({
  userId: raw.user_id,
  email: raw.email,
  nickname: raw.nickname,
  roleCode: raw.role_code,
  newsletterOptIn: raw.newsletter_opt_in,
  pointBalance: raw.point_balance,
  createdAt: raw.created_at,
})

/**
 * 포인트 잔액 변경 (목업) — 퀴즈 보상 등
 * @param {number} delta
 * @returns {Promise<{ data: UserProfile }>}
 */
export const applyPointBalanceDelta = async (delta) => {
  await delay(50)
  if (!MOCK_USER_PROFILE_RESPONSE?.data) {
    throw new UserApiError('UNAUTHORIZED', '인증이 필요하다.', 401)
  }
  MOCK_USER_PROFILE_RESPONSE.data.point_balance = Math.max(
    0,
    (MOCK_USER_PROFILE_RESPONSE.data.point_balance ?? 0) + delta,
  )
  return { data: mapUserProfile(structuredClone(MOCK_USER_PROFILE_RESPONSE.data)) }
}

/**
 * 로그인 사용자 공개 프로필 조회 (목업)
 * GET /users/me
 * TODO: API 연동 시 apiClient.get('/users/me') 로 교체
 * @returns {Promise<{ data: UserProfile }>}
 */
export const getUserProfile = async () => {
  await delay()
  const raw = structuredClone(MOCK_USER_PROFILE_RESPONSE)
  if (!raw?.data) {
    throw new UserApiError('UNAUTHORIZED', '인증이 필요하다.', 401)
  }
  return { data: mapUserProfile(raw.data) }
}
