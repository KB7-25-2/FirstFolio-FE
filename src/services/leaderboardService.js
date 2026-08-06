/**
 * @typedef {import('@/types/leaderboard.js').LeaderboardItem} LeaderboardItem
 * @typedef {import('@/types/leaderboard.js').LeaderboardSnapshot} LeaderboardSnapshot
 */

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
 * TOP 40 목업 목록 생성
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

/**
 * GET /leaderboard 목업 (API 원본 snake_case)
 * TODO: API 연동 시 leaderboardApi.getLeaderboard 로 교체
 */
const MOCK_ALL_ITEMS = buildMockItems()

const delay = (ms = 150) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * 최신 일일 스냅샷 리더보드 조회 (목업, cursor 페이지네이션)
 * GET /leaderboard
 * @param {{ cursor?: string, size?: number }} [params]
 * @returns {Promise<{ data: LeaderboardSnapshot }>}
 */
export const getLeaderboard = async (params = {}) => {
  await delay()

  const size = Math.min(Math.max(Number(params.size) || 10, 1), 40)
  const start = params.cursor ? Number(params.cursor) : 0
  const safeStart = Number.isFinite(start) && start >= 0 ? start : 0
  const pageItems = MOCK_ALL_ITEMS.slice(safeStart, safeStart + size)
  const nextStart = safeStart + size
  const nextCursor = nextStart < MOCK_ALL_ITEMS.length ? String(nextStart) : null

  return {
    data: mapSnapshot({
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
 * 목업 전체 TOP 40 (화면 확장·클라이언트 페이지네이션용)
 * @returns {Promise<{ data: LeaderboardSnapshot }>}
 */
export const getLeaderboardTop40 = async () => {
  await delay()
  return {
    data: mapSnapshot({
      snapshot_date: '2026-07-30',
      week_start_date: '2026-07-27',
      items: structuredClone(MOCK_ALL_ITEMS),
      my_rank: {
        rank: 47,
        nickname: '채권꿈나무',
        weekly_score: 18,
      },
      next_cursor: null,
    }),
  }
}

/** @internal 테스트용 */
export const __mapLeaderboardSnapshot = mapSnapshot
export const __MOCK_TOP40_COUNT = MOCK_ALL_ITEMS.length
