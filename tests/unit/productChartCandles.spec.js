import { describe, expect, it } from 'vitest'
import {
  aggregateMonthlyCandles,
  buildChartCandlesForPeriod,
  formatChartCategoryLabel,
  mergeDailyCandlesWithLive,
} from '@/utils/productChartCandles.js'

const candle = (tradeDate, open, high, low, close) => ({
  tradeDate,
  openPrice: open,
  highPrice: high,
  lowPrice: low,
  closePrice: close,
})

describe('mergeDailyCandlesWithLive', () => {
  it('overwrites same-day provisional live candle', () => {
    const merged = mergeDailyCandlesWithLive([candle('2026-08-20', 1, 2, 0.5, 1.5)], {
      ...candle('2026-08-20', 1, 3, 0.4, 2.8),
      status: 'PROVISIONAL',
    })
    expect(merged).toHaveLength(1)
    expect(merged[0].closePrice).toBe(2.8)
  })
})

describe('aggregateMonthlyCandles', () => {
  it('aggregates OHLC by calendar month', () => {
    const monthly = aggregateMonthlyCandles([
      candle('2026-07-01', 100, 110, 90, 105),
      candle('2026-07-15', 105, 120, 100, 115),
      candle('2026-08-01', 115, 130, 110, 125),
    ])
    expect(monthly).toEqual([
      {
        tradeDate: '2026-07',
        openPrice: 100,
        highPrice: 120,
        lowPrice: 90,
        closePrice: 115,
      },
      {
        tradeDate: '2026-08',
        openPrice: 115,
        highPrice: 130,
        lowPrice: 110,
        closePrice: 125,
      },
    ])
  })
})

describe('buildChartCandlesForPeriod', () => {
  const days = [
    candle('2026-08-01', 10, 11, 9, 10),
    candle('2026-08-10', 10, 12, 9, 11),
    candle('2026-08-18', 11, 13, 10, 12),
    candle('2026-08-20', 12, 14, 11, 13),
  ]

  it('defaults monthly aggregation', () => {
    const result = buildChartCandlesForPeriod(days, null, 'monthly')
    expect(result).toHaveLength(1)
    expect(result[0].tradeDate).toBe('2026-08')
    expect(result[0].openPrice).toBe(10)
    expect(result[0].closePrice).toBe(13)
  })

  it('filters 1w lookback from latest trade date', () => {
    const result = buildChartCandlesForPeriod(days, null, '1w')
    expect(result.map((item) => item.tradeDate)).toEqual(['2026-08-18', '2026-08-20'])
  })
})

describe('formatChartCategoryLabel', () => {
  it('formats monthly and daily labels', () => {
    expect(formatChartCategoryLabel('2026-08', 'monthly')).toBe('26/8')
    expect(formatChartCategoryLabel('2026-08-20', '1m')).toBe('8/20')
  })
})
