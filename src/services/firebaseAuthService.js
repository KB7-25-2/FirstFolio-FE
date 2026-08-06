import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth'
import { getFirebaseAuthErrorEntry } from '@/constants/firebaseAuthError.js'
import { firebaseAuth } from '@/lib/firebase.js'

const googleProvider = new GoogleAuthProvider()

export class FirebaseAuthError extends Error {
  /**
   * @param {string} code
   * @param {string} message
   * @param {string | null} [firebaseCode]
   * @param {number} [status=400]
   */
  constructor(code, message, firebaseCode = null, status = 400) {
    super(message)
    this.name = 'FirebaseAuthError'
    this.code = code
    this.firebaseCode = firebaseCode
    this.status = status
  }
}

/**
 * @param {unknown} error
 * @returns {FirebaseAuthError}
 */
const toFirebaseAuthError = (error) => {
  if (error instanceof FirebaseAuthError) {
    return error
  }

  const firebaseCode =
    typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : null
  const mapped = getFirebaseAuthErrorEntry(firebaseCode)

  if (mapped) {
    const [code, message, status = 400] = mapped
    return new FirebaseAuthError(code, message, firebaseCode, status)
  }

  return new FirebaseAuthError(
    'FIREBASE_AUTH_FAILED',
    '인증 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
    firebaseCode,
    500,
  )
}

/**
 * @template T
 * @param {() => Promise<T>} fn
 * @returns {Promise<T>}
 */
const runFirebaseAuth = async (fn) => {
  try {
    return await fn()
  } catch (error) {
    throw toFirebaseAuthError(error)
  }
}

/**
 * @param {string} email
 * @param {string} password
 * @returns {string}
 */
const validateEmailPassword = (email, password) => {
  const trimmedEmail = email?.trim()

  if (!trimmedEmail || !password) {
    throw new FirebaseAuthError('VALIDATION_ERROR', '이메일과 비밀번호를 입력해 주세요.', null, 400)
  }

  if (!trimmedEmail.includes('@')) {
    throw new FirebaseAuthError('VALIDATION_ERROR', '올바른 이메일 형식이 아닙니다.', null, 400)
  }

  if (password.length < 6) {
    throw new FirebaseAuthError('WEAK_PASSWORD', '비밀번호는 6자 이상이어야 합니다.', null, 400)
  }

  return trimmedEmail
}

/** 신규 유저 가입 */
export const signUpWithEmail = (email, password) => {
  const trimmedEmail = validateEmailPassword(email, password)

  return runFirebaseAuth(() => createUserWithEmailAndPassword(firebaseAuth, trimmedEmail, password))
}

/** 기존 유저 로그인 */
export const signInWithEmail = (email, password) => {
  const trimmedEmail = validateEmailPassword(email, password)

  return runFirebaseAuth(() => signInWithEmailAndPassword(firebaseAuth, trimmedEmail, password))
}

/** 구글 로그인 */
export const signInWithGoogle = (options = {}) =>
  runFirebaseAuth(async () => {
    const { onDismissed } = options
    let settled = false

    // Firebase는 팝업을 닫아도 reject가 수 초 늦을 수 있어, 포커스 복귀 시 빨리 UI를 푼다.
    const onFocus = () => {
      window.setTimeout(() => {
        if (settled || firebaseAuth.currentUser) return
        onDismissed?.()
      }, 300)
    }

    window.addEventListener('focus', onFocus)

    try {
      return await signInWithPopup(firebaseAuth, googleProvider)
    } finally {
      settled = true
      window.removeEventListener('focus', onFocus)
    }
  })

/** 토큰 발급 */
export const getIdToken = async (forceRefresh = false) => {
  const user = firebaseAuth.currentUser

  if (!user) {
    throw new FirebaseAuthError(
      'NOT_AUTHENTICATED',
      'Firebase 인증된 사용자가 없습니다.',
      null,
      401,
    )
  }

  return runFirebaseAuth(() => user.getIdToken(forceRefresh))
}

/** 로그아웃 */
export const signOutFirebase = () => runFirebaseAuth(() => signOut(firebaseAuth))

/** 인증 상태 변경 감지 */
export const onFirebaseAuthStateChanged = (callback) => onAuthStateChanged(firebaseAuth, callback)

/** 현재 유저 정보 조회 */
export const getCurrentFirebaseUser = () => firebaseAuth.currentUser
