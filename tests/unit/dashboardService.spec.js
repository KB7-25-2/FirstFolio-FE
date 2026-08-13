import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/api/errorHandler.js'

vi.mock('@/api/dashboardApi.js', () => ({
  getDashboard: vi.fn(() => Promise.reject(new ApiError('unavailable', 500))),
}))

vi.mock('@/services/dailyQuestService.js', () => ({
  getTodayDailyQuest: vi.fn(),
}))

vi.mock('@/services/portfolioService.js', () => ({
  getActivePortfolio: vi.fn(() =>
    Promise.resolve({
      data: {
        summary: {
          totalAssets: '10000000.00',
          profitLoss: '200000.00',
        },
        allocation: [{ assetType: 'BOND', ratio: 40 }],
      },
    }),
  ),
}))

import { getDashboard as getDashboardApi } from '@/api/dashboardApi.js'
import { getTodayDailyQuest } from '@/services/dailyQuestService.js'
import {
  getDashboard,
  mapDashboardDailyQuest,
  mapDashboardSummary,
} from '@/services/dashboardService.js'

describe('dashboardService (unit)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getDashboardApi.mockRejectedValue(new ApiError('unavailable', 500))
    getTodayDailyQuest.mockResolvedValue({
      data: {
        status: 'ASSIGNED',
        answeredCount: 0,
        totalCount: 5,
      },
    })
  })

  it('대시보드 응답을 camelCase로 매핑한다', () => {
    const data = mapDashboardSummary({
      portfolio: {
        available: true,
        total_assets: '30420000.00',
        profit_loss: '420000.00',
        allocation: [{ asset_type: 'BOND', ratio: 40 }],
      },
      daily_quest: {
        status: 'IN_PROGRESS',
        answered_count: 2,
        total_count: 5,
      },
      learning: {
        main_chapter_id: 2,
        sub_chapter_id: 101,
        progress_percent: 35,
      },
      upcoming_events: [{ type: 'INTEREST', scheduled_at: '2026-07-30T00:00:00Z' }],
      latest_news: [
        {
          knowledge_content_id: 9001,
          title: '기준금리 뉴스',
          reference_at: '2026-07-29T00:00:00Z',
        },
      ],
    })

    expect(data.dailyQuest).toEqual({
      available: true,
      reason: undefined,
      status: 'IN_PROGRESS',
      answeredCount: 2,
      totalCount: 5,
    })
    expect(data.portfolio.totalAssets).toBe('30420000.00')
    expect(data.learning.progressPercent).toBe(35)
    expect(data.learning.available).toBe(true)
    expect(data.latestNews[0].knowledgeContentId).toBe(9001)
  })

  it('섹션 available=false 와 reason 을 보존한다', () => {
    const data = mapDashboardSummary({
      portfolio: { available: false, reason: 'NO_PORTFOLIO' },
      daily_quest: { available: false, reason: 'NOT_ASSIGNED', status: 'ASSIGNED' },
      learning: { available: false, reason: 'NOT_STARTED' },
      upcoming_events: [],
      latest_news: [],
    })

    expect(data.portfolio).toMatchObject({ available: false, reason: 'NO_PORTFOLIO' })
    expect(data.dailyQuest).toMatchObject({ available: false, reason: 'NOT_ASSIGNED' })
    expect(data.learning).toMatchObject({ available: false, reason: 'NOT_STARTED' })
  })

  it('일퀘 status NOT_STARTED 는 ASSIGNED 로 정규화한다', () => {
    expect(mapDashboardDailyQuest({ status: 'NOT_STARTED', answered_count: 0 }).status).toBe(
      'ASSIGNED',
    )
  })

  it('실 API 성공 시 매핑된 요약을 반환한다', async () => {
    getDashboardApi.mockResolvedValue({
      data: {
        data: {
          portfolio: { available: true, total_assets: '1.00', profit_loss: '0.00', allocation: [] },
          daily_quest: { status: 'ASSIGNED', answered_count: 0, total_count: 5 },
          learning: { main_chapter_id: 1, sub_chapter_id: 1, progress_percent: 0 },
          upcoming_events: [],
          latest_news: [],
        },
      },
    })

    const { data } = await getDashboard()
    expect(getDashboardApi).toHaveBeenCalled()
    expect(data.dailyQuest).toEqual({
      available: true,
      reason: undefined,
      status: 'ASSIGNED',
      answeredCount: 0,
      totalCount: 5,
    })
  })

  it('DEV mock에서 daily_quest 는 일퀘 진행 상태를 따른다', async () => {
    getTodayDailyQuest.mockResolvedValue({
      data: {
        status: 'IN_PROGRESS',
        answeredCount: 3,
        totalCount: 5,
      },
    })

    const { data } = await getDashboard()
    expect(data.dailyQuest).toEqual({
      available: true,
      reason: undefined,
      status: 'IN_PROGRESS',
      answeredCount: 3,
      totalCount: 5,
    })
  })
})
