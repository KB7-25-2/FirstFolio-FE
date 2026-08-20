import { describe, expect, it } from 'vitest'
import { getKoreanMarketSession } from '@/utils/koreanMarketSession.js'

describe('getKoreanMarketSession', () => {
  it('한국 시간 평일 09:00부터 15:30 전까지는 장중이다', () => {
    expect(getKoreanMarketSession(new Date('2026-08-17T00:00:00Z')).isOpen).toBe(true)
    expect(getKoreanMarketSession(new Date('2026-08-17T06:29:00Z')).isOpen).toBe(true)
  })

  it('한국 시간 15:30부터와 주말은 장외 시간이다', () => {
    expect(getKoreanMarketSession(new Date('2026-08-17T06:30:00Z')).isOpen).toBe(false)
    expect(getKoreanMarketSession(new Date('2026-08-16T03:00:00Z')).isOpen).toBe(false)
  })
})
