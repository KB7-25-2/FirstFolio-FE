/**
 * @typedef {import('@/types/auth.js').SignupResponse} SignupResponse
 * @typedef {import('@/types/auth.js').LoginResponse} LoginResponse
 */

import { deleteUser } from 'firebase/auth'
import { signUp as signUpApi, login as loginApi, logout as logoutApi } from '@/api/authApi.js'
import { ApiError } from '@/api/errorHandler.js'
import {
  signInWithGoogle,
  signInWithEmail,
  signUpWithEmail,
  getIdToken,
  signOutFirebase,
  FirebaseAuthError,
} from '@/services/firebaseAuthService.js'
import { getToken } from '@/utils/token.js'
import { resolveNicknameFromGoogle, validateNickname } from '@/utils/nickname.js'

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
 * @param {{ onDismissed?: () => void }} [options]
 * @returns {Promise<{ credential: import('firebase/auth').UserCredential, idToken: string }>}
 */
export const authenticateWithGoogle = async (options = {}) => {
  const credential = await signInWithGoogle(options)
  const idToken = await getIdToken()
  return { credential, idToken }
}

/**
 * Google 계정으로 Firebase 인증 후 FirstFolio 회원가입
 * @param {{ onDismissed?: () => void }} [options]
 * @returns {Promise<{ data: SignupResponse, idToken: string }>}
 */
export const signupWithGoogle = async (options = {}) => {
  const { credential, idToken } = await authenticateWithGoogle(options)
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
 * 이메일·비밀번호로 Firebase 계정 생성 후 FirstFolio 회원가입
 * @param {{ nickname: string, email: string, password: string }} payload
 * @returns {Promise<{ data: SignupResponse, idToken: string }>}
 */
export const signupWithEmail = async ({ nickname, email, password }) => {
  const normalizedNickname = validateNickname(nickname)
  const credential = await signUpWithEmail(email, password)
  const { user } = credential
  const idToken = await getIdToken()

  try {
    const { data } = await signUpApi(
      { nickname: normalizedNickname, required_terms_agreed: true },
      idToken,
    )

    return {
      data: mapSignupResponse(data.data),
      idToken,
    }
  } catch (error) {
    await deleteUser(user).catch(() => {})
    throw mapAuthError(
      error,
      'SIGNUP_FAILED',
      '회원가입에 실패했습니다. 잠시 후 다시 시도해 주세요.',
    )
  }
}

/**
 * Google 계정으로 Firebase 인증 후 FirstFolio 로그인
 * @param {{ onDismissed?: () => void }} [options]
 * @returns {Promise<{ data: LoginResponse, idToken: string }>}
 */
export const loginWithGoogle = async (options = {}) => {
  const { idToken } = await authenticateWithGoogle(options)

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

/**
 * 이메일·비밀번호로 Firebase 인증 후 FirstFolio 로그인
 * @param {{ email: string, password: string }} credentials
 * @returns {Promise<{ data: LoginResponse, idToken: string }>}
 */
export const loginWithEmail = async ({ email, password }) => {
  await signInWithEmail(email, password)
  const idToken = await getIdToken()

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

/** 저장된 인증 토큰으로 로그인 상태와 최신 온보딩 단계를 다시 조회한다. */
export const refreshLoginSession = async () => {
  const idToken = getToken() || (await getIdToken())
  const { data } = await loginApi(idToken)
  return mapLoginResponse(data.data)
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
 * FirstFolio 로그아웃 후 Firebase 세션 종료
 * API 실패(401 포함)·네트워크 오류여도 로컬 Firebase 로그아웃은 완료한다.
 * POST /auth/logout
 */
export const logout = async () => {
  const idToken = getToken() || (await getIdToken().catch(() => null))

  try {
    if (idToken) {
      await logoutApi(idToken)
    }
  } catch {
    // 401 UNAUTHORIZED 등 — 세션이 이미 무효해도 로컬 정리는 계속 진행
  } finally {
    await signOutFirebase().catch(() => {})
  }
}
