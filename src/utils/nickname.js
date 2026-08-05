import { FirebaseAuthError } from '@/services/firebaseAuthService.js'

const MIN_LENGTH = 2
const MAX_LENGTH = 10

/**
 * @param {string} value
 * @returns {string | null}
 */
const normalizeNickname = (value) => {
  const trimmed = value?.trim().replace(/\s+/g, '')
  if (!trimmed) return null

  const sliced = trimmed.slice(0, MAX_LENGTH)
  return sliced.length >= MIN_LENGTH ? sliced : null
}

/**
 * Google 계정 displayName·email에서 API nickname(2~10자)을 추출한다.
 * @param {{ displayName?: string | null, email?: string | null }} user
 * @returns {string}
 */
export const resolveNicknameFromGoogle = (user) => {
  const fromName = normalizeNickname(user.displayName)
  if (fromName) return fromName

  const emailLocal = user.email?.split('@')[0] ?? ''
  const fromEmail = normalizeNickname(emailLocal)
  if (fromEmail) return fromEmail

  throw new FirebaseAuthError(
    'INVALID_NICKNAME',
    'Google 계정에서 사용할 닉네임을 가져오지 못했습니다.',
    null,
    400,
  )
}
