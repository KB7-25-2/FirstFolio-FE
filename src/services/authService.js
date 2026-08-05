/**
 * @typedef {import('@/types/auth.js').SignupResponse} SignupResponse
 */

import { deleteUser } from 'firebase/auth'
import { signUp as signUpApi } from '@/api/authApi.js'
import { ApiError } from '@/api/errorHandler.js'
import {
  signInWithGoogle,
  getIdToken,
  signOutFirebase,
  FirebaseAuthError,
} from '@/services/firebaseAuthService.js'
import { resolveNicknameFromGoogle } from '@/utils/nickname.js'

const delay = (ms = 200) => new Promise((resolve) => setTimeout(resolve, ms))

/** @type {Record<string, string>} */
const SIGNUP_ERROR_MESSAGES = {
  INVALID_SIGNUP_INPUT: '가입 정보 또는 필수 약관 동의가 올바르지 않습니다.',
  INVALID_ID_TOKEN: '인증이 만료되었습니다. 다시 시도해 주세요.',
  ACCOUNT_CONFLICT: '이미 사용 중인 이메일 또는 닉네임입니다.',
}

/**
 * @param {object} raw
 * @returns {SignupResponse}
 */
const mapSignupResponse = (raw) => ({
  userId: raw.user_id,
  nickname: raw.nickname,
  roleCode: raw.role_code,
  onboardingStep: raw.onboarding_step,
})

/**
 * @param {unknown} error
 * @returns {AuthApiError | FirebaseAuthError}
 */
const mapSignupError = (error) => {
  if (error instanceof FirebaseAuthError || error instanceof AuthApiError) {
    return error
  }

  if (error instanceof ApiError) {
    const code = error.code ?? 'SIGNUP_FAILED'
    const message = SIGNUP_ERROR_MESSAGES[code] ?? error.message
    return new AuthApiError(code, message, error.status)
  }

  return new AuthApiError(
    'SIGNUP_FAILED',
    '회원가입에 실패했습니다. 잠시 후 다시 시도해 주세요.',
    500,
  )
}

/**
 * Google 계정으로 Firebase 인증 후 FirstFolio 회원가입
 * @returns {Promise<{ data: SignupResponse, idToken: string }>}
 */
export const signupWithGoogle = async () => {
  const credential = await signInWithGoogle()
  const { user } = credential
  const nickname = resolveNicknameFromGoogle(user)
  const idToken = await getIdToken()

  try {
    const { data } = await signUpApi({ nickname, required_terms_agreed: true }, idToken)

    return {
      data: mapSignupResponse(data.data),
      idToken,
    }
  } catch (error) {
    if (credential.additionalUserInfo?.isNewUser) {
      await deleteUser(user).catch(() => {})
    } else {
      await signOutFirebase().catch(() => {})
    }

    throw mapSignupError(error)
  }
}

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
