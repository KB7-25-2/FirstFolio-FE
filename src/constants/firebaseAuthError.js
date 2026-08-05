/**
 * Firebase Auth SDK 에러 코드 → 앱 내부 코드·메시지·HTTP 유사 status 매핑
 * @typedef {[code: string, message: string, status?: number]} FirebaseAuthErrorEntry
 */

/** @type {Record<string, FirebaseAuthErrorEntry>} */
export const FIREBASE_AUTH_ERROR_MAP = {
  'auth/email-already-in-use': ['EMAIL_ALREADY_IN_USE', '이미 사용 중인 이메일입니다.', 409],
  'auth/invalid-email': ['INVALID_EMAIL', '올바른 이메일 형식이 아닙니다.', 400],
  'auth/weak-password': ['WEAK_PASSWORD', '비밀번호는 6자 이상이어야 합니다.', 400],
  'auth/user-disabled': ['USER_DISABLED', '비활성화된 계정입니다. 관리자에게 문의해 주세요.', 403],
  'auth/user-not-found': ['INVALID_CREDENTIALS', '이메일 또는 비밀번호가 올바르지 않습니다.', 401],
  'auth/wrong-password': ['INVALID_CREDENTIALS', '이메일 또는 비밀번호가 올바르지 않습니다.', 401],
  'auth/invalid-credential': [
    'INVALID_CREDENTIALS',
    '이메일 또는 비밀번호가 올바르지 않습니다.',
    401,
  ],
  'auth/too-many-requests': [
    'TOO_MANY_REQUESTS',
    '로그인 시도가 너무 많습니다. 잠시 후 다시 시도해 주세요.',
    429,
  ],
  'auth/popup-closed-by-user': ['POPUP_CLOSED', 'Google 로그인 창이 닫혔습니다.', 400],
  'auth/popup-blocked': [
    'POPUP_BLOCKED',
    '팝업이 차단되었습니다. 브라우저 설정을 확인해 주세요.',
    400,
  ],
  'auth/cancelled-popup-request': ['POPUP_CANCELLED', 'Google 로그인이 취소되었습니다.', 400],
  'auth/network-request-failed': [
    'NETWORK_ERROR',
    '네트워크 오류가 발생했습니다. 연결 상태를 확인해 주세요.',
    0,
  ],
  'auth/operation-not-allowed': [
    'OPERATION_NOT_ALLOWED',
    '현재 사용할 수 없는 로그인 방식입니다.',
    403,
  ],
}

/**
 * @param {string | null | undefined} firebaseCode
 * @returns {FirebaseAuthErrorEntry | null}
 */
export const getFirebaseAuthErrorEntry = (firebaseCode) =>
  firebaseCode ? (FIREBASE_AUTH_ERROR_MAP[firebaseCode] ?? null) : null
