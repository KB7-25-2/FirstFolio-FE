import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '@/store/authStore.js'

describe('authStore (unit)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('이메일·Google 로그인/회원가입 액션을 노출한다', () => {
    const store = useAuthStore()
    expect(typeof store.loginWithEmail).toBe('function')
    expect(typeof store.loginWithGoogle).toBe('function')
    expect(typeof store.signupWithEmail).toBe('function')
    expect(typeof store.signupWithGoogle).toBe('function')
  })
})
