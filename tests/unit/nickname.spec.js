import { describe, it, expect } from 'vitest'
import { FirebaseAuthError } from '@/services/firebaseAuthService.js'
import { resolveNicknameFromGoogle, validateNickname } from '@/utils/nickname.js'

describe('validateNickname (unit)', () => {
  it('2~10자 닉네임을 통과시킨다', () => {
    expect(validateNickname('새싹투자자')).toBe('새싹투자자')
  })

  it('공백을 제거한다', () => {
    expect(validateNickname('김 투자')).toBe('김투자')
  })

  it('2자 미만이면 INVALID_NICKNAME을 던진다', () => {
    expect(() => validateNickname('김')).toThrow(FirebaseAuthError)
  })

  it('10자 초과면 INVALID_NICKNAME을 던진다', () => {
    expect(() => validateNickname('아주긴닉네임테스트유저')).toThrow(FirebaseAuthError)
  })
})

describe('resolveNicknameFromGoogle (unit)', () => {
  it('displayName을 10자 이하 닉네임으로 사용한다', () => {
    expect(resolveNicknameFromGoogle({ displayName: '새싹투자자', email: 'a@b.com' })).toBe(
      '새싹투자자',
    )
  })

  it('displayName이 10자를 넘으면 잘라낸다', () => {
    expect(
      resolveNicknameFromGoogle({ displayName: '아주긴닉네임테스트유저', email: 'a@b.com' }),
    ).toBe('아주긴닉네임테스트유')
  })

  it('displayName 공백은 제거한다', () => {
    expect(resolveNicknameFromGoogle({ displayName: '김 투자', email: 'a@b.com' })).toBe('김투자')
  })

  it('displayName이 짧으면 이메일 로컬파트를 사용한다', () => {
    expect(resolveNicknameFromGoogle({ displayName: '김', email: 'investor@example.com' })).toBe(
      'investor',
    )
  })

  it('닉네임을 만들 수 없으면 INVALID_NICKNAME을 던진다', () => {
    expect(() => resolveNicknameFromGoogle({ displayName: '김', email: 'a@b.com' })).toThrow(
      FirebaseAuthError,
    )
  })
})
