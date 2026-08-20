import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const { getPurchasableProductsList, getProductDetail } = vi.hoisted(() => ({
  getPurchasableProductsList: vi.fn(),
  getProductDetail: vi.fn(),
}))

vi.mock('@/services/portfolioTradeService.js', () => ({
  getPurchasableProductsList,
  getProductDetail,
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
        },
      ],
      nextCursor: null,
    })
    getProductDetail.mockResolvedValue({ unitPrice: 10_000 })
  })

  it('포트폴리오 화면이 열려 있는 동안 2초마다 현재가를 갱신한다', async () => {
    const store = usePortfolioStore()
    store.startProductPricePolling()

    await vi.advanceTimersByTimeAsync(0)
    expect(getProductDetail).toHaveBeenCalledTimes(1)
    expect(store.purchasableProducts[0].unitPrice).toBe(10_000)

    getProductDetail.mockResolvedValueOnce({ unitPrice: 10_100 })
    await vi.advanceTimersByTimeAsync(2_000)

    expect(getProductDetail).toHaveBeenCalledTimes(2)
    expect(store.purchasableProducts[0].unitPrice).toBe(10_100)

    store.stopProductPricePolling()
    await vi.advanceTimersByTimeAsync(2_000)
    expect(getProductDetail).toHaveBeenCalledTimes(2)
  })
})
