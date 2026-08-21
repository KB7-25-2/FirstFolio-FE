import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const { getPurchasableProductsList, getProductMarketSnapshotData } = vi.hoisted(() => ({
  getPurchasableProductsList: vi.fn(),
  getProductMarketSnapshotData: vi.fn(),
}))

vi.mock('@/services/portfolioTradeService.js', () => ({
  getPurchasableProductsList,
  getProductMarketSnapshotData,
}))

import { usePortfolioStore } from '@/store/portfolioStore.js'

describe('portfolioStore 상품 가격 폴링', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  beforeEach(() => {
    vi.useFakeTimers()
    setActivePinia(createPinia())
    getPurchasableProductsList.mockResolvedValue({
      items: [
        {
          productId: 1,
          displayName: '테스트 주식',
          isTimeCompressionExempt: true,
          unitPrice: null,
          openPrice: null,
        },
      ],
      nextCursor: null,
    })
    getProductMarketSnapshotData.mockResolvedValue({
      currentPrice: 10_000,
      currentCandle: { openPrice: 9_800 },
    })
  })

  it('포트폴리오 화면이 열려 있는 동안 2초마다 현재가·시가를 갱신한다', async () => {
    const store = usePortfolioStore()
    store.startProductPricePolling()

    await vi.advanceTimersByTimeAsync(0)
    expect(getProductMarketSnapshotData).toHaveBeenCalledTimes(1)
    expect(store.purchasableProducts[0].unitPrice).toBe(10_000)
    expect(store.purchasableProducts[0].openPrice).toBe(9_800)

    getProductMarketSnapshotData.mockResolvedValueOnce({
      currentPrice: 10_100,
      currentCandle: { openPrice: 9_800 },
    })
    await vi.advanceTimersByTimeAsync(2_000)

    expect(getProductMarketSnapshotData).toHaveBeenCalledTimes(2)
    expect(store.purchasableProducts[0].unitPrice).toBe(10_100)

    store.stopProductPricePolling()
    await vi.advanceTimersByTimeAsync(2_000)
    expect(getProductMarketSnapshotData).toHaveBeenCalledTimes(2)
  })
})
