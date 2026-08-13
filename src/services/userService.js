/**
 * @typedef {import('@/types/user.js').UserProfile} UserProfile
 * @typedef {import('@/types/user.js').UpdateUserProfileInput} UpdateUserProfileInput
 * @typedef {import('@/types/user.js').UpdateUserProfileResult} UpdateUserProfileResult
 */

import {
  getUserProfile as getUserProfileApi,
  updateUserProfile as updateUserProfileApi,
} from '@/api/userApi.js'
import { ApiError } from '@/api/errorHandler.js'
import { validateNickname } from '@/utils/nickname.js'

/** @type {Record<string, string>} */
const USER_ERROR_MESSAGES = {
  UNAUTHORIZED: '인증이 필요합니다. 다시 로그인해 주세요.',
  NO_PATCH_FIELDS: '변경할 내용이 없습니다.',
  NICKNAME_CONFLICT: '이미 사용 중인 닉네임입니다.',
  INVALID_NICKNAME: '닉네임은 공백 없이 2자 이상 10자 이하로 입력해 주세요.',
}

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
  }
}

/**
 * @param {object} raw
 * @returns {UserProfile}
 */
const mapUserProfile = (raw) => ({
  userId: raw.userId ?? raw.user_id,
  email: raw.email,
  nickname: raw.nickname,
  roleCode: raw.roleCode ?? raw.role_code,
  newsletterOptIn: raw.newsletterOptIn ?? raw.newsletter_opt_in,
  pointBalance: raw.pointBalance ?? raw.point_balance,
  createdAt: raw.createdAt ?? raw.created_at,
})

/**
 * @param {object} raw
 * @returns {UpdateUserProfileResult}
 */
const mapUpdateResult = (raw) => ({
  userId: raw.userId ?? raw.user_id,
  nickname: raw.nickname,
  newsletterOptIn: raw.newsletterOptIn ?? raw.newsletter_opt_in,
  updatedAt: raw.updatedAt ?? raw.updated_at,
})

/**
 * @param {unknown} error
 * @param {string} fallbackCode
 * @param {string} fallbackMessage
 * @returns {UserApiError}
 */
const mapUserError = (error, fallbackCode, fallbackMessage) => {
  if (error instanceof UserApiError) return error

  if (error instanceof ApiError) {
    const code = error.code ?? fallbackCode
    const message = USER_ERROR_MESSAGES[code] ?? error.message
    return new UserApiError(code, message, error.status)
  }

  if (error?.code && error?.message) {
    return new UserApiError(
      error.code,
      USER_ERROR_MESSAGES[error.code] ?? error.message,
      error.status ?? 400,
    )
  }

  return new UserApiError(fallbackCode, fallbackMessage, 500)
}

/** 포인트 목업용 — GET 이후 로컬 캐시 (원장 API 연동 전까지) */
/** @type {UserProfile | null} */
let cachedProfile = null

/**
 * 포인트 잔액 변경 (목업) — 퀴즈 보상 등
 * @param {number} delta
 * @returns {Promise<{ data: UserProfile }>}
 */
export const applyPointBalanceDelta = async (delta) => {
  if (!cachedProfile) {
    throw new UserApiError('UNAUTHORIZED', USER_ERROR_MESSAGES.UNAUTHORIZED, 401)
  }

  cachedProfile = {
    ...cachedProfile,
    pointBalance: Math.max(0, (cachedProfile.pointBalance ?? 0) + delta),
  }

  return { data: { ...cachedProfile } }
}

/**
 * 로그인 사용자 공개 프로필 조회
 * GET /users/me
 * @returns {Promise<{ data: UserProfile }>}
 */
export const getUserProfile = async () => {
  try {
    const { data } = await getUserProfileApi()
    cachedProfile = mapUserProfile(data.data)
    return { data: { ...cachedProfile } }
  } catch (error) {
    throw mapUserError(error, 'PROFILE_FETCH_FAILED', '프로필을 불러오지 못했습니다.')
  }
}

/**
 * 닉네임·뉴스레터 수신 동의 부분 수정
 * PATCH /users/me
 * @param {UpdateUserProfileInput} input
 * @returns {Promise<{ data: UserProfile }>}
 */
export const updateUserProfile = async (input = {}) => {
  /** @type {{ nickname?: string, newsletter_opt_in?: boolean }} */
  const body = {}

  try {
    if (input.nickname !== undefined) {
      body.nickname = validateNickname(input.nickname)
    }
  } catch (error) {
    throw mapUserError(error, 'INVALID_NICKNAME', USER_ERROR_MESSAGES.INVALID_NICKNAME)
  }

  if (input.newsletterOptIn !== undefined) {
    // 라이브 BE는 snake_case 요청만 수용
    body.newsletter_opt_in = Boolean(input.newsletterOptIn)
  }

  if (Object.keys(body).length === 0) {
    throw new UserApiError('NO_PATCH_FIELDS', USER_ERROR_MESSAGES.NO_PATCH_FIELDS, 400)
  }

  try {
    const { data } = await updateUserProfileApi(body)
    const patch = mapUpdateResult(data.data)

    if (!cachedProfile) {
      const fetched = await getUserProfile()
      return fetched
    }

    cachedProfile = {
      ...cachedProfile,
      nickname: patch.nickname ?? cachedProfile.nickname,
      newsletterOptIn: patch.newsletterOptIn ?? cachedProfile.newsletterOptIn,
    }

    return { data: { ...cachedProfile } }
  } catch (error) {
    throw mapUserError(error, 'PROFILE_UPDATE_FAILED', '프로필을 저장하지 못했습니다.')
  }
}

/** @internal 테스트용 */
export const __resetUserProfileCache = () => {
  cachedProfile = null
}
