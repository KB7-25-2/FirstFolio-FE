import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '@/store/authStore.js'

describe('authStore (unit)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    sessionStorage.clear()
  })

  it('이메일·Google 로그인/회원가입·로그아웃 액션을 노출한다', () => {
    const store = useAuthStore()
    expect(typeof store.loginWithEmail).toBe('function')
    expect(typeof store.loginWithGoogle).toBe('function')
    expect(typeof store.signupWithEmail).toBe('function')
    expect(typeof store.signupWithGoogle).toBe('function')
    expect(typeof store.logout).toBe('function')
    expect(typeof store.setOnboardingStep).toBe('function')
  })

  it('setOnboardingStep으로 onboarding_step을 sessionStorage에 저장한다', () => {
    const store = useAuthStore()
    store.setOnboardingStep('CURRICULUM')
    expect(store.onboardingStep).toBe('CURRICULUM')
    expect(sessionStorage.getItem('onboarding_step')).toBe('CURRICULUM')
  })
})
