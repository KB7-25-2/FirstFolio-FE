/**
 * @typedef {import('@/types/leaderboard.js').LeaderboardItem} LeaderboardItem
 * @typedef {import('@/types/leaderboard.js').LeaderboardSnapshot} LeaderboardSnapshot
 */

/** @type {Record<string, string>} */
const LEADERBOARD_ERROR_MESSAGES = {
  LEADERBOARD_SNAPSHOT_NOT_FOUND: '이번 주 순위 집계를 준비 중이에요. 잠시 후 다시 확인해 주세요.',
  UNAUTHORIZED: '인증이 필요합니다. 다시 로그인해 주세요.',
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
  weeklyScore: raw.weekly_score,
})

/**
 * @param {object} raw
 * @returns {LeaderboardSnapshot}
 */
const mapSnapshot = (raw) => ({
  snapshotDate: raw.snapshot_date,
  weekStartDate: raw.week_start_date,
  items: (raw.items ?? []).map(mapItem),
  myRank: raw.my_rank ? mapItem(raw.my_rank) : null,
  nextCursor: raw.next_cursor ?? null,
})

/**
 * GET /leaderboard 목업 (API 원본 snake_case)
 * TODO: API 연동 시 leaderboardApi.getLeaderboard 로 교체
 */
const MOCK_LEADERBOARD_RESPONSE = {
  data: {
    snapshot_date: '2026-07-30',
    week_start_date: '2026-07-27',
    items: [
      { rank: 1, nickname: '금융새싹', weekly_score: 32 },
      { rank: 2, nickname: '예금왕', weekly_score: 28 },
      { rank: 3, nickname: '주식초보', weekly_score: 25 },
      { rank: 4, nickname: '펀드탐험가', weekly_score: 22 },
      { rank: 5, nickname: '이자수집가', weekly_score: 20 },
    ],
    my_rank: {
      rank: 47,
      nickname: '채권꿈나무',
      weekly_score: 18,
    },
    next_cursor: null,
  },
}

const delay = (ms = 150) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * 최신 일일 스냅샷 리더보드 조회 (목업)
 * GET /leaderboard
 * @param {{ cursor?: string, size?: number }} [_params]
 * @returns {Promise<{ data: LeaderboardSnapshot }>}
 */
export const getLeaderboard = async (_params = {}) => {
  await delay()
  const raw = structuredClone(MOCK_LEADERBOARD_RESPONSE)
  if (!raw?.data) {
    throw new LeaderboardApiError(
      'LEADERBOARD_SNAPSHOT_NOT_FOUND',
      LEADERBOARD_ERROR_MESSAGES.LEADERBOARD_SNAPSHOT_NOT_FOUND,
      404,
    )
  }
  return { data: mapSnapshot(raw.data) }
}

/** @internal 테스트용 */
export const __mapLeaderboardSnapshot = mapSnapshot
