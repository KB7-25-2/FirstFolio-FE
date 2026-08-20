import {
  getCurrentFirebaseUser,
  getIdToken,
  onFirebaseAuthStateChanged,
} from '@/services/firebaseAuthService.js'
import { removeToken, setToken } from '@/utils/token.js'
import { advanceSessionEpoch } from '@/utils/sessionEpoch.js'
import { clearPersistedUserSession, clearUserScopedStores } from '@/utils/userSessionCleanup.js'

/**
 * Firebase Auth persistence 복원 시 localStorage·가드와 토큰 캐시 동기화
 */
export const initAuthSessionSync = () => {
  let hadAuthenticatedUser = false

  onFirebaseAuthStateChanged(async (user) => {
    if (!user) {
      // 초기 null은 Firebase 복원 전에도 발생하므로 E2E 시드·로그인 폼 상태를 유지한다.
      // 인증 사용자를 관찰한 뒤 null이 되면 외부 Firebase 로그아웃/세션 만료로 간주한다.
      if (hadAuthenticatedUser) {
        advanceSessionEpoch()
        clearUserScopedStores()
        clearPersistedUserSession()
        removeToken()
      }
      return
    }

    hadAuthenticatedUser = true

    try {
      const token = await getIdToken()
      setToken(token)
    } catch {
      removeToken()
    }
  })
}

/**
 * 앱 부팅 시 이미 복원된 Firebase 세션에 토큰 동기화 (onAuthStateChanged 초기 콜백 전 보완)
 */
export const syncAuthSessionOnce = async () => {
  if (!getCurrentFirebaseUser()) return

  try {
    const token = await getIdToken()
    setToken(token)
  } catch {
    removeToken()
  }
}
