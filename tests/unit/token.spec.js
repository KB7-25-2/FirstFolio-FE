import { describe, it, expect, beforeEach } from 'vitest'
import { getToken, setToken, removeToken, hasToken } from '@/utils/token.js'

describe('token utils (unit)', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('setToken / getToken으로 토큰을 저장·조회한다', () => {
    setToken('test-token')
    expect(getToken()).toBe('test-token')
  })

  it('hasToken은 토큰 유무를 boolean으로 반환한다', () => {
    expect(hasToken()).toBe(false)
    setToken('test-token')
    expect(hasToken()).toBe(true)
  })

  it('removeToken으로 토큰을 제거한다', () => {
    setToken('test-token')
    removeToken()
    expect(getToken()).toBeNull()
    expect(hasToken()).toBe(false)
  })
})
