import { describe, it, expect } from 'vitest'
import {
  FirebaseAuthError,
  signUpWithEmail,
  signInWithEmail,
  getIdToken,
} from '@/services/firebaseAuthService.js'

describe('firebaseAuthService (unit)', () => {
  describe('입력 검증', () => {
    it('이메일·비밀번호가 없으면 VALIDATION_ERROR를 던진다', () => {
      expect(() => signUpWithEmail('', '')).toThrow(FirebaseAuthError)
      expect(() => signUpWithEmail('', '')).toThrow('이메일과 비밀번호를 입력해 주세요.')
    })

    it('이메일 형식이 잘못되면 VALIDATION_ERROR를 던진다', () => {
      expect(() => signInWithEmail('invalid-email', 'password123')).toThrow(FirebaseAuthError)
      expect(() => signInWithEmail('invalid-email', 'password123')).toThrow(
        '올바른 이메일 형식이 아닙니다.',
      )
    })

    it('비밀번호가 6자 미만이면 WEAK_PASSWORD를 던진다', () => {
      expect(() => signUpWithEmail('user@example.com', '12345')).toThrow(FirebaseAuthError)
      expect(() => signUpWithEmail('user@example.com', '12345')).toThrow(
        '비밀번호는 6자 이상이어야 합니다.',
      )
    })
  })

  describe('인증 상태', () => {
    it('로그인하지 않은 상태에서 getIdToken은 NOT_AUTHENTICATED를 던진다', async () => {
      await expect(getIdToken()).rejects.toMatchObject({
        name: 'FirebaseAuthError',
        code: 'NOT_AUTHENTICATED',
        status: 401,
      })
    })
  })

  describe('FirebaseAuthError', () => {
    it('firebaseCode를 보존한다', () => {
      const error = new FirebaseAuthError(
        'EMAIL_ALREADY_IN_USE',
        '이미 사용 중인 이메일입니다.',
        'auth/email-already-in-use',
        409,
      )

      expect(error).toBeInstanceOf(Error)
      expect(error.firebaseCode).toBe('auth/email-already-in-use')
      expect(error.status).toBe(409)
    })
  })
})
