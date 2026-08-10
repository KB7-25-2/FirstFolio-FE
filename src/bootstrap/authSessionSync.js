import {
  getCurrentFirebaseUser,
  getIdToken,
  onFirebaseAuthStateChanged,
} from '@/services/firebaseAuthService.js'
import { removeToken, setToken } from '@/utils/token.js'

/**
 * Firebase Auth persistence 복원 시 localStorage·가드와 토큰 캐시 동기화
 */
export const initAuthSessionSync = () => {
  onFirebaseAuthStateChanged(async (user) => {
    if (!user) {
      // 로그아웃·401 등 명시적 흐름에서 토큰 제거. 초기 null(미로그인·E2E 시드)에서는 캐시 유지.
      return
    }

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
