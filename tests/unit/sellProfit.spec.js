import { describe, expect, it } from 'vitest'
import {
  attachSellTradeMeta,
  calcSellProfit,
  formatSignedKrw,
  formatSignedRate,
  getEstimatedSellProceeds,
  getSellCostBasis,
} from '@/utils/sellProfit.js'

const stockHolding = {
  displayName: '모의 주식',
  assetType: 'STOCK',
  quantity: 10,
  averageCost: 10_000,
  unitPrice: 12_000,
  principalAmount: 100_000,
  valuationAmount: 120_000,
}

const depositHolding = {
  displayName: '모의 예금',
  assetType: 'DEPOSIT_SAVINGS',
  quantity: 1,
  averageCost: null,
  unitPrice: null,
  principalAmount: 1_000_000,
  valuationAmount: 1_030_000,
}

describe('getSellCostBasis', () => {
  it('stocks use average cost times quantity', () => {
    expect(getSellCostBasis(stockHolding, 4)).toBe(40_000)
  })

  it('deposits use full principal', () => {
    expect(getSellCostBasis(depositHolding)).toBe(1_000_000)
  })
})

describe('getEstimatedSellProceeds', () => {
  it('stocks use unit price times quantity', () => {
    expect(getEstimatedSellProceeds(stockHolding, 4)).toBe(48_000)
  })

  it('deposits use valuation', () => {
    expect(getEstimatedSellProceeds(depositHolding)).toBe(1_030_000)
  })
})

describe('calcSellProfit', () => {
  it('returns amount and rate', () => {
    expect(calcSellProfit({ proceeds: 48_000, costBasis: 40_000 })).toEqual({
      amount: 8_000,
      rate: 20,
    })
  })
})

describe('attachSellTradeMeta', () => {
  it('keeps product name and cost basis for the result modal', () => {
    const result = attachSellTradeMeta({ netCashAmount: 47_900 }, stockHolding, 4)
    expect(result.productName).toBe('모의 주식')
    expect(result.costBasis).toBe(40_000)
  })
})

describe('formatters', () => {
  it('formats signed krw and rate', () => {
    expect(formatSignedKrw(8000)).toBe('+8,000원')
    expect(formatSignedKrw(-500)).toBe('-500원')
    expect(formatSignedRate(20)).toBe('+20.0%')
    expect(formatSignedRate(-1.25)).toBe('-1.3%')
  })
})
