/**
 * GET /dashboard 서비스
 * — 실 API 우선, DEV에서 실패 시 목업 폴백
 * — mock의 daily_quest 는 일일 퀘스트 서비스 진행 상태와 동기화
 */

/**
 * @typedef {import('@/types/portfolio.js').DashboardSummary} DashboardSummary
 * @typedef {import('@/types/portfolio.js').AssetAllocation} AssetAllocation
 * @typedef {import('@/types/portfolio.js').DashboardDailyQuest} DashboardDailyQuest
 */

import { getDashboard as getDashboardApi } from '@/api/user/dashboardApi.js'
import { ApiError } from '@/api/user/errorHandler.js'
import { getActivePortfolio } from '@/services/portfolioService.js'
import { getTodayDailyQuest } from '@/services/dailyQuestService.js'

const delay = (ms = 150) => new Promise((resolve) => setTimeout(resolve, ms))

/** @type {Record<string, string>} */
const DASHBOARD_ERROR_MESSAGES = {
  UNAUTHORIZED: '인증이 필요합니다. 다시 로그인해 주세요.',
}

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
    this.requestId = `req-${Date.now()}`
  }
}

/**
 * @param {string | null | undefined} status
 * @returns {DashboardDailyQuest['status']}
 */
const mapDailyQuestStatus = (status) => {
  if (status === 'IN_PROGRESS' || status === 'COMPLETED' || status === 'ASSIGNED') {
    return status
  }
  // 구 스펙 호환
  if (status === 'NOT_STARTED') return 'ASSIGNED'
  return 'ASSIGNED'
}

/**
 * @param {object} item
 * @returns {AssetAllocation}
 */
const mapAllocation = (item) => ({
  assetType: item.asset_type ?? item.assetType,
  ratio: item.ratio,
})

/**
 * @param {object} raw
 * @returns {DashboardDailyQuest}
 */
export const mapDashboardDailyQuest = (raw) => ({
  status: mapDailyQuestStatus(raw?.status),
  answeredCount: raw?.answered_count ?? raw?.answeredCount ?? 0,
  totalCount: raw?.total_count ?? raw?.totalCount ?? 5,
})

/**
 * @param {object} raw
 * @returns {DashboardSummary}
 */
export const mapDashboardSummary = (raw) => ({
  portfolio: {
    available: raw.portfolio?.available ?? false,
    reason: raw.portfolio?.reason,
    totalAssets: raw.portfolio?.total_assets ?? raw.portfolio?.totalAssets,
    profitLoss: raw.portfolio?.profit_loss ?? raw.portfolio?.profitLoss,
    allocation: (raw.portfolio?.allocation ?? []).map(mapAllocation),
  },
  dailyQuest: mapDashboardDailyQuest(raw.daily_quest ?? raw.dailyQuest ?? {}),
  learning: {
    mainChapterId: raw.learning?.main_chapter_id ?? raw.learning?.mainChapterId,
    subChapterId: raw.learning?.sub_chapter_id ?? raw.learning?.subChapterId,
    progressPercent: raw.learning?.progress_percent ?? raw.learning?.progressPercent,
  },
  upcomingEvents: (raw.upcoming_events ?? raw.upcomingEvents ?? []).map((event) => ({
    type: event.type,
    scheduledAt: event.scheduled_at ?? event.scheduledAt,
  })),
  latestNews: (raw.latest_news ?? raw.latestNews ?? []).map((news) => ({
    knowledgeContentId: news.knowledge_content_id ?? news.knowledgeContentId,
    title: news.title,
    referenceAt: news.reference_at ?? news.referenceAt,
  })),
})

/**
 * @param {unknown} error
 * @param {string} fallbackCode
 * @param {string} fallbackMessage
 * @returns {DashboardApiError}
 */
const mapDashboardError = (error, fallbackCode, fallbackMessage) => {
  if (error instanceof DashboardApiError) return error

  if (error instanceof ApiError) {
    const code = error.code ?? fallbackCode
    const message = DASHBOARD_ERROR_MESSAGES[code] ?? error.message ?? fallbackMessage
    return new DashboardApiError(code, message, error.status)
  }

  if (error && typeof error === 'object' && 'code' in error && 'message' in error) {
    const err = /** @type {{ code: string, message: string, status?: number }} */ (error)
    return new DashboardApiError(
      err.code,
      DASHBOARD_ERROR_MESSAGES[err.code] ?? err.message,
      err.status ?? 400,
    )
  }

  return new DashboardApiError(fallbackCode, fallbackMessage, 500)
}

/**
 * mock daily_quest — 일일 퀘스트 진행 상태와 동기화
 * @returns {Promise<{ status: string, answered_count: number, total_count: number }>}
 */
const buildMockDailyQuestRaw = async () => {
  try {
    const { data } = await getTodayDailyQuest()
    return {
      status: data.status,
      answered_count: data.answeredCount,
      total_count: data.totalCount,
    }
  } catch {
    return {
      status: 'ASSIGNED',
      answered_count: 0,
      total_count: 5,
    }
  }
}

/**
 * 홈 통합 요약 목업
 * 포트폴리오 섹션은 활성 포트폴리오 상세 목업과 동기화
 * 일일 퀘스트는 dailyQuestService 진행 상태와 동기화
 */
const getDashboardMock = async () => {
  await delay()
  const { data: portfolio } = await getActivePortfolio()
  const dailyQuest = await buildMockDailyQuestRaw()

  return {
    data: mapDashboardSummary({
      portfolio: {
        available: true,
        total_assets: portfolio.summary.totalAssets,
        profit_loss: portfolio.summary.profitLoss,
        allocation: portfolio.allocation.map((item) => ({
          asset_type: item.assetType,
          ratio: item.ratio,
        })),
      },
      daily_quest: dailyQuest,
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
    }),
  }
}

/**
 * GET /dashboard
 * @returns {Promise<{ data: DashboardSummary }>}
 */
export const getDashboard = async () => {
  try {
    const { data } = await getDashboardApi()
    const raw = data?.data ?? data
    return { data: mapDashboardSummary(raw) }
  } catch (error) {
    const mapped = mapDashboardError(
      error,
      'DASHBOARD_FETCH_FAILED',
      '홈 정보를 불러오지 못했습니다.',
    )
    if (!import.meta.env.DEV) throw mapped
    console.warn('[dashboardService] GET /dashboard 실패 — mock으로 대체합니다.', mapped)
    return getDashboardMock()
  }
}
