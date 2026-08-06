/**
 * @typedef {import('@/types/auth.js').SignupResponse} SignupResponse
 * @typedef {import('@/types/auth.js').LoginResponse} LoginResponse
 */

import { deleteUser } from 'firebase/auth'
import { signUp as signUpApi, login as loginApi } from '@/api/authApi.js'
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
const AUTH_ERROR_MESSAGES = {
  INVALID_SIGNUP_INPUT: '가입 정보 또는 필수 약관 동의가 올바르지 않습니다.',
  INVALID_ID_TOKEN: '인증이 만료되었습니다. 다시 시도해 주세요.',
  ACCOUNT_CONFLICT: '이미 사용 중인 이메일 또는 닉네임입니다.',
  ACCOUNT_NOT_ACTIVE: '이용할 수 없는 계정입니다. 관리자에게 문의해 주세요.',
  SIGNUP_REQUIRED: 'FirstFolio 회원 정보가 없습니다. 회원가입을 진행해 주세요.',
  UNAUTHORIZED: '인증이 필요합니다. 다시 로그인해 주세요.',
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
 * @param {object} raw
 * @returns {LoginResponse}
 */
const mapLoginResponse = (raw) => ({
  user: {
    userId: raw.user.user_id,
    nickname: raw.user.nickname,
    roleCode: raw.user.role_code,
  },
  onboardingStep: raw.onboarding_step,
})

/**
 * @param {unknown} error
 * @param {string} fallbackCode
 * @param {string} fallbackMessage
 * @returns {AuthApiError | FirebaseAuthError}
 */
const mapAuthError = (error, fallbackCode, fallbackMessage) => {
  if (error instanceof FirebaseAuthError || error instanceof AuthApiError) {
    return error
  }

  if (error instanceof ApiError) {
    const code = error.code ?? fallbackCode
    const message = AUTH_ERROR_MESSAGES[code] ?? error.message
    return new AuthApiError(code, message, error.status)
  }

  return new AuthApiError(fallbackCode, fallbackMessage, 500)
}

/**
 * Google 팝업 인증 후 ID Token 발급 (로그인·회원가입 공통)
 * @returns {Promise<{ credential: import('firebase/auth').UserCredential, idToken: string }>}
 */
export const authenticateWithGoogle = async () => {
  const credential = await signInWithGoogle()
  const idToken = await getIdToken()
  return { credential, idToken }
}

/**
 * Google 계정으로 Firebase 인증 후 FirstFolio 회원가입
 * @returns {Promise<{ data: SignupResponse, idToken: string }>}
 */
export const signupWithGoogle = async () => {
  const { credential, idToken } = await authenticateWithGoogle()
  const { user } = credential
  const nickname = resolveNicknameFromGoogle(user)

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

    throw mapAuthError(
      error,
      'SIGNUP_FAILED',
      '회원가입에 실패했습니다. 잠시 후 다시 시도해 주세요.',
    )
  }
}

/**
 * Google 계정으로 Firebase 인증 후 FirstFolio 로그인
 * @returns {Promise<{ data: LoginResponse, idToken: string }>}
 */
export const loginWithGoogle = async () => {
  const { idToken } = await authenticateWithGoogle()

  try {
    const { data } = await loginApi(idToken)

    return {
      data: mapLoginResponse(data.data),
      idToken,
    }
  } catch (error) {
    await signOutFirebase().catch(() => {})
    throw mapAuthError(error, 'LOGIN_FAILED', '로그인에 실패했습니다. 잠시 후 다시 시도해 주세요.')
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
 * 이메일 로그인 (목업) — 이메일·비밀번호만 있으면 성공
 * TODO: Firebase 이메일 로그인 API 연동 시 교체
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
