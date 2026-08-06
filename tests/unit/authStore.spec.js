import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '@/store/authStore.js'

describe('authStore (unit)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('signupWithGoogle·signupWithEmail·loginWithGoogle 액션을 노출한다', () => {
    const store = useAuthStore()
    expect(typeof store.signupWithGoogle).toBe('function')
    expect(typeof store.signupWithEmail).toBe('function')
    expect(typeof store.loginWithGoogle).toBe('function')
  })
})
