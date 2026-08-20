import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  __getLeaderboardMock,
  mapDailyQuestLeaderboard,
  __MOCK_TOP40_COUNT,
  getLeaderboard,
  getLeaderboardTop40,
  LeaderboardApiError,
} from '@/services/leaderboardService.js'

vi.mock('@/api/user/leaderboardApi.js', () => ({
  getLeaderboard: vi.fn(),
}))

import { getLeaderboard as getLeaderboardApi } from '@/api/user/leaderboardApi.js'
import { ApiError } from '@/api/user/errorHandler.js'

describe('leaderboardService (unit)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('일일 리더보드 응답을 camelCase로 매핑한다', () => {
    const data = mapDailyQuestLeaderboard({
      quest_date: '2026-08-20',
      calculated_at: '2026-08-20T06:30:00Z',
      items: [{ rank: 1, nickname: '금융새싹', score: 5 }],
      my_rank: { rank: 47, score: 3 },
      next_cursor: null,
    })

    expect(data).toEqual({
      questDate: '2026-08-20',
      calculatedAt: '2026-08-20T06:30:00Z',
      items: [{ rank: 1, nickname: '금융새싹', score: 5 }],
      myRank: { rank: 47, score: 3 },
      nextCursor: null,
    })
  })

  it('실 API 성공 시 매핑된 일일 리더보드을 반환한다', async () => {
    getLeaderboardApi.mockResolvedValue({
      data: {
        data: {
          quest_date: '2026-08-20',
          calculated_at: '2026-08-20T06:30:00Z',
          items: [{ rank: 1, nickname: '금융새싹', score: 5 }],
          my_rank: { rank: 2, score: 4 },
          next_cursor: null,
        },
      },
    })

    const { data } = await getLeaderboard({ size: 10 })
    expect(getLeaderboardApi).toHaveBeenCalledWith({ size: 10 })
    expect(data.items[0]).toEqual({ rank: 1, nickname: '금융새싹', score: 5 })
    expect(data.myRank).toEqual({ rank: 2, score: 4 })
  })

  it('INVALID_LEADERBOARD_PAGE는 DEV에서도 목업으로 대체하지 않는다', async () => {
    getLeaderboardApi.mockRejectedValue(
      new ApiError('잘못된 페이지', 400, null, 'INVALID_LEADERBOARD_PAGE'),
    )

    await expect(getLeaderboard({ size: 101 })).rejects.toBeInstanceOf(LeaderboardApiError)
  })

  it('DEV에서 기타 API 실패 시 목업으로 폴백한다', async () => {
    getLeaderboardApi.mockRejectedValue(new ApiError('서버 오류', 500))

    const { data } = await getLeaderboardTop40()
    expect(__MOCK_TOP40_COUNT).toBe(40)
    expect(data.items).toHaveLength(40)
    expect(data.items[0]).toMatchObject({ rank: 1, nickname: '금융새싹' })
    expect(data.myRank).toEqual({ rank: 47, score: 3 })
  })

  it('목업은 cursor·size로 페이지를 자른다', async () => {
    const first = await __getLeaderboardMock({ size: 20 })
    expect(first.data.items).toHaveLength(20)
    expect(first.data.items[0].rank).toBe(1)
    expect(first.data.nextCursor).toBe('20')

    const second = await __getLeaderboardMock({ cursor: '20', size: 20 })
    expect(second.data.items).toHaveLength(20)
    expect(second.data.items[0].rank).toBe(21)
    expect(second.data.nextCursor).toBeNull()
  })
})
