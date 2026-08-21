import { describe, expect, it } from 'vitest'
import {
  calcPriceChangeVsOpen,
  formatPriceChangeAmount,
  formatPriceChangeRate,
} from '@/utils/priceChange.js'

describe('calcPriceChangeVsOpen', () => {
  it('computes up/down vs open', () => {
    expect(calcPriceChangeVsOpen(110, 100)).toEqual({
      amount: 10,
      rate: 10,
      direction: 'up',
    })
    expect(calcPriceChangeVsOpen(90, 100)?.direction).toBe('down')
    expect(calcPriceChangeVsOpen(100, 100)?.direction).toBe('flat')
  })

  it('returns null without open', () => {
    expect(calcPriceChangeVsOpen(100, null)).toBeNull()
  })
})

describe('formatPriceChange*', () => {
  it('formats amount and rate labels', () => {
    expect(formatPriceChangeAmount(8500)).toBe('▲ 8,500')
    expect(formatPriceChangeAmount(-2000)).toBe('▼ 2,000')
    expect(formatPriceChangeRate(3.114)).toBe('+3.11%')
    expect(formatPriceChangeRate(-0.75)).toBe('-0.75%')
  })
})
