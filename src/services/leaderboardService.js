/**
 * GET /leaderboard 서비스
 * — 실 API 우선, DEV에서 실패 시 목업 폴백
 * — 404 LEADERBOARD_SNAPSHOT_NOT_FOUND 는 폴백하지 않고 UI에 전달
 */

/**
 * @typedef {import('@/types/leaderboard.js').LeaderboardItem} LeaderboardItem
 * @typedef {import('@/types/leaderboard.js').LeaderboardSnapshot} LeaderboardSnapshot
 */

import { getLeaderboard as getLeaderboardApi } from '@/api/leaderboardApi.js'
import { ApiError } from '@/api/errorHandler.js'

/** @type {Record<string, string>} */
const LEADERBOARD_ERROR_MESSAGES = {
  UNAUTHORIZED: '인증이 필요합니다. 다시 로그인해 주세요.',
  LEADERBOARD_SNAPSHOT_NOT_FOUND:
    '이번 주 리더보드를 집계하는 중이에요. 잠시 후 다시 확인해 주세요.',
}

export class LeaderboardApiError extends Error {
  /**
   * @param {string} code
   * @param {string} message
   * @param {number} [status=400]
   */
  constructor(code, message, status = 400) {
    super(message)
    this.name = 'LeaderboardApiError'
    this.code = code
    this.status = status
  }
}

/**
 * @param {object} raw
 * @returns {LeaderboardItem}
 */
const mapItem = (raw) => ({
  rank: raw.rank,
  nickname: raw.nickname,
  weeklyScore: raw.weekly_score ?? raw.weeklyScore,
})

/**
 * @param {object} raw
 * @returns {LeaderboardSnapshot}
 */
export const mapLeaderboardSnapshot = (raw) => ({
  snapshotDate: raw.snapshot_date ?? raw.snapshotDate ?? '',
  weekStartDate: raw.week_start_date ?? raw.weekStartDate ?? '',
  items: (raw.items ?? []).map(mapItem),
  myRank: raw.my_rank || raw.myRank ? mapItem(raw.my_rank ?? raw.myRank) : null,
  nextCursor: raw.next_cursor ?? raw.nextCursor ?? null,
})

/**
 * @param {unknown} error
 * @param {string} fallbackCode
 * @param {string} fallbackMessage
 * @returns {LeaderboardApiError}
 */
const mapLeaderboardError = (error, fallbackCode, fallbackMessage) => {
  if (error instanceof LeaderboardApiError) return error

  if (error instanceof ApiError) {
    const code = error.code ?? fallbackCode
    const message = LEADERBOARD_ERROR_MESSAGES[code] ?? error.message ?? fallbackMessage
    return new LeaderboardApiError(code, message, error.status)
  }

  if (error && typeof error === 'object' && 'code' in error && 'message' in error) {
    const code = /** @type {{ code: string, message: string, status?: number }} */ (error).code
    const message =
      LEADERBOARD_ERROR_MESSAGES[code] ?? /** @type {{ message: string }} */ (error).message
    const status = /** @type {{ status?: number }} */ (error).status ?? 400
    return new LeaderboardApiError(code, message, status)
  }

  return new LeaderboardApiError(fallbackCode, fallbackMessage, 500)
}

const MOCK_NICKNAMES = [
  '금융새싹',
  '예금왕',
  '주식초보',
  '펀드탐험가',
  '이자수집가',
  '배당수집',
  '절약요정',
  '저축러',
  '채권꿈나무',
  '포트폴리오장인',
  '적금마스터',
  '금리헌터',
  '분산투자러',
  '안전자산파',
  '성장주러버',
  '가치투자생',
  '현금흐름왕',
  '복리마니아',
  '예산관리왕',
  '소비절제러',
  'ETF초보',
  '지수추종러',
  '리밸런싱왕',
  '비상금지킴이',
  '목표달성러',
  '재무설계생',
  '세금고민러',
  '환율지킴이',
  '인플레이션파',
  '장기투자러',
  '단기챌린저',
  '퀴즈만점왕',
  '뉴스스크랩러',
  '상담연습생',
  '명예도전자',
  '랭킹클리머',
  '포인트모으미',
  '학습열정러',
  '금융왕후보',
  '새싹투자자',
]

/**
 * @returns {{ rank: number, nickname: string, weekly_score: number }[]}
 */
const buildMockItems = () =>
  Array.from({ length: 40 }, (_, index) => {
    const rank = index + 1
    return {
      rank,
      nickname: MOCK_NICKNAMES[index] ?? `투자자${rank}`,
      weekly_score: Math.max(1, 41 - rank),
    }
  })

const MOCK_ALL_ITEMS = buildMockItems()
const delay = (ms = 150) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * @param {{ cursor?: string, size?: number }} [params]
 * @returns {Promise<{ data: LeaderboardSnapshot }>}
 */
const getLeaderboardMock = async (params = {}) => {
  await delay()

  const size = Math.min(Math.max(Number(params.size) || 10, 1), 40)
  const start = params.cursor ? Number(params.cursor) : 0
  const safeStart = Number.isFinite(start) && start >= 0 ? start : 0
  const pageItems = MOCK_ALL_ITEMS.slice(safeStart, safeStart + size)
  const nextStart = safeStart + size
  const nextCursor = nextStart < MOCK_ALL_ITEMS.length ? String(nextStart) : null

  return {
    data: mapLeaderboardSnapshot({
      snapshot_date: '2026-07-30',
      week_start_date: '2026-07-27',
      items: pageItems,
      my_rank: {
        rank: 47,
        nickname: '채권꿈나무',
        weekly_score: 18,
      },
      next_cursor: nextCursor,
    }),
  }
}

/**
 * GET /leaderboard
 * @param {{ cursor?: string, size?: number }} [params]
 * @returns {Promise<{ data: LeaderboardSnapshot }>}
 */
export const getLeaderboard = async (params = {}) => {
  const query = {}
  if (params.cursor) query.cursor = params.cursor
  if (params.size != null) query.size = params.size

  try {
    const { data } = await getLeaderboardApi(query)
    const raw = data?.data ?? data
    return { data: mapLeaderboardSnapshot(raw) }
  } catch (error) {
    const mapped = mapLeaderboardError(
      error,
      'LEADERBOARD_FETCH_FAILED',
      '리더보드를 불러오지 못했습니다.',
    )

    // 스냅샷 없음(명시 코드)은 목업으로 가리지 않고 UI에 전달
    if (mapped.code === 'LEADERBOARD_SNAPSHOT_NOT_FOUND') {
      throw mapped
    }

    if (!import.meta.env.DEV) {
      if (mapped.status === 404) {
        throw new LeaderboardApiError(
          'LEADERBOARD_SNAPSHOT_NOT_FOUND',
          LEADERBOARD_ERROR_MESSAGES.LEADERBOARD_SNAPSHOT_NOT_FOUND,
          404,
        )
      }
      throw mapped
    }

    console.warn('[leaderboardService] API 호출 실패 — 목데이터로 대체합니다.', mapped)
    return getLeaderboardMock(params)
  }
}

/**
 * TOP 목록 (화면 초기 로드용, size 기본 40)
 * @param {{ size?: number }} [params]
 * @returns {Promise<{ data: LeaderboardSnapshot }>}
 */
export const getLeaderboardTop40 = async (params = {}) =>
  getLeaderboard({ size: params.size ?? 40 })

/** @internal 테스트용 */
export const __mapLeaderboardSnapshot = mapLeaderboardSnapshot
export const __MOCK_TOP40_COUNT = MOCK_ALL_ITEMS.length
export const __getLeaderboardMock = getLeaderboardMock
