import { describe, expect, it } from 'vitest'
import { mapProductCandlesResponse, mapProductMarketSnapshot } from '@/mappers/portfolioMapper.js'

describe('mapProductCandlesResponse', () => {
  it('maps confirmed daily candles in ascending order fields', () => {
    const mapped = mapProductCandlesResponse({
      product_id: 87,
      interval: '1d',
      candles: [
        {
          trade_date: '2026-08-20',
          open_price: '258000.0000',
          high_price: '274000.0000',
          low_price: '252000.0000',
          close_price: '273000.0000',
          volume: '46036748.00000000',
          currency: 'KRW',
        },
      ],
    })

    expect(mapped).toEqual({
      productId: 87,
      interval: '1d',
      candles: [
        {
          tradeDate: '2026-08-20',
          openPrice: 258000,
          highPrice: 274000,
          lowPrice: 252000,
          closePrice: 273000,
          volume: 46036748,
          currency: 'KRW',
        },
      ],
    })
  })
})

describe('mapProductMarketSnapshot', () => {
  it('maps provisional intraday candle and market flags', () => {
    const mapped = mapProductMarketSnapshot({
      product_id: 87,
      current_price: '281500.0000',
      price_reference_at: '2026-08-21T04:00:00Z',
      market_open: true,
      current_candle: {
        trade_date: '2026-08-21',
        open_price: '273000.0000',
        high_price: '285000.0000',
        low_price: '266000.0000',
        close_price: '281500.0000',
        status: 'PROVISIONAL',
        reference_at: '2026-08-21T04:00:00Z',
      },
    })

    expect(mapped.productId).toBe(87)
    expect(mapped.currentPrice).toBe(281500)
    expect(mapped.marketOpen).toBe(true)
    expect(mapped.currentCandle).toEqual({
      tradeDate: '2026-08-21',
      openPrice: 273000,
      highPrice: 285000,
      lowPrice: 266000,
      closePrice: 281500,
      status: 'PROVISIONAL',
      referenceAt: '2026-08-21T04:00:00Z',
    })
  })

  it('allows null price and candle', () => {
    const mapped = mapProductMarketSnapshot({
      product_id: 87,
      current_price: null,
      price_reference_at: null,
      market_open: false,
      current_candle: null,
    })

    expect(mapped.currentPrice).toBeNull()
    expect(mapped.currentCandle).toBeNull()
    expect(mapped.marketOpen).toBe(false)
  })
})
