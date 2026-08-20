import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useDashboardStore } from '@/store/dashboardStore.js'

describe('dashboardStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('allocationView에 cashBalance 기준 현금 비중을 포함한다', () => {
    const store = useDashboardStore()
    store.$patch({
      summary: {
        portfolio: {
          available: true,
          totalAssets: '10000000',
          cashBalance: '1000000',
          allocation: [
            { assetType: 'DEPOSIT_SAVINGS', ratio: 36 },
            { assetType: 'STOCK', ratio: 27 },
            { assetType: 'BOND', ratio: 18 },
            { assetType: 'OTHER', ratio: 9 },
          ],
        },
        dailyQuest: { status: 'ASSIGNED', answeredCount: 0, totalCount: 5 },
        learning: { available: true },
        upcomingEvents: [],
        latestNews: [],
      },
    })

    const cash = store.allocationView.find((item) => item.assetType === 'CASH')
    expect(cash).toMatchObject({ assetType: 'CASH', ratio: 10 })
  })

  it('cashBalance가 없으면 allocation 합계의 나머지를 현금으로 표시한다', () => {
    const store = useDashboardStore()
    store.$patch({
      summary: {
        portfolio: {
          available: true,
          totalAssets: '10000000',
          allocation: [
            { assetType: 'DEPOSIT_SAVINGS', ratio: 40 },
            { assetType: 'STOCK', ratio: 30 },
            { assetType: 'BOND', ratio: 20 },
          ],
        },
        dailyQuest: { status: 'ASSIGNED', answeredCount: 0, totalCount: 5 },
        learning: { available: true },
        upcomingEvents: [],
        latestNews: [],
      },
    })

    const cash = store.allocationView.find((item) => item.assetType === 'CASH')
    expect(cash?.ratio).toBe(10)
  })
})
