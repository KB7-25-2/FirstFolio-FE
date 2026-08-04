/**
 * @typedef {import('@/types/portfolio.js').DashboardSummary} DashboardSummary
 * @typedef {import('@/types/portfolio.js').AssetAllocation} AssetAllocation
 */

import { getActivePortfolio } from '@/services/portfolioService.js'

const delay = (ms = 150) => new Promise((resolve) => setTimeout(resolve, ms))

export class DashboardApiError extends Error {
  /**
   * @param {string} code
   * @param {string} message
   * @param {number} [status=400]
   */
  constructor(code, message, status = 400) {
    super(message)
    this.name = 'DashboardApiError'
    this.code = code
    this.status = status
    this.requestId = `req-mock-${Date.now()}`
  }
}

/**
 * @param {object} item
 * @returns {AssetAllocation}
 */
const mapAllocation = (item) => ({
  assetType: item.asset_type,
  ratio: item.ratio,
})

/**
 * @param {object} raw
 * @returns {DashboardSummary}
 */
const mapDashboardSummary = (raw) => ({
  portfolio: {
    available: raw.portfolio.available,
    reason: raw.portfolio.reason,
    totalAssets: raw.portfolio.total_assets,
    profitLoss: raw.portfolio.profit_loss,
    allocation: (raw.portfolio.allocation ?? []).map(mapAllocation),
  },
  dailyQuest: {
    status: raw.daily_quest.status,
    answeredCount: raw.daily_quest.answered_count,
    totalCount: raw.daily_quest.total_count,
  },
  learning: {
    mainChapterId: raw.learning.main_chapter_id,
    subChapterId: raw.learning.sub_chapter_id,
    progressPercent: raw.learning.progress_percent,
  },
  upcomingEvents: (raw.upcoming_events ?? []).map((event) => ({
    type: event.type,
    scheduledAt: event.scheduled_at,
  })),
  latestNews: (raw.latest_news ?? []).map((news) => ({
    knowledgeContentId: news.knowledge_content_id,
    title: news.title,
    referenceAt: news.reference_at,
  })),
})

/**
 * 홈 통합 요약 목업 골격 (API 미확정)
 * 포트폴리오 섹션은 활성 포트폴리오 상세 목업과 동기화
 */
const buildMockDashboardRaw = async () => {
  const { data: portfolio } = await getActivePortfolio()

  return {
    data: {
      portfolio: {
        available: true,
        total_assets: portfolio.summary.totalAssets,
        profit_loss: portfolio.summary.profitLoss,
        allocation: portfolio.allocation.map((item) => ({
          asset_type: item.assetType,
          ratio: item.ratio,
        })),
      },
      daily_quest: {
        status: 'IN_PROGRESS',
        answered_count: 2,
        total_count: 5,
      },
      learning: {
        main_chapter_id: 2,
        sub_chapter_id: 103,
        progress_percent: 50,
      },
      upcoming_events: [
        {
          type: 'INTEREST',
          scheduled_at: '2026-07-30T00:00:00Z',
        },
      ],
      latest_news: [
        {
          knowledge_content_id: 9001,
          title: '예·적금 금리 비교 수요 증가…은행권 경쟁 격화',
          reference_at: '2026-07-29T00:00:00Z',
        },
      ],
    },
  }
}

/**
 * 홈 통합 요약 조회 (목업)
 * GET /dashboard — API 스펙 미확정, Service만 선구현
 * TODO: API 연동 시 apiClient.get('/dashboard') 로 교체
 * @returns {Promise<{ data: DashboardSummary }>}
 */
export const getDashboard = async () => {
  await delay()
  const raw = await buildMockDashboardRaw()
  return { data: mapDashboardSummary(raw.data) }
}
