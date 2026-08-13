import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  __getLeaderboardMock,
  __mapLeaderboardSnapshot,
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

  it('스냅샷 응답을 camelCase로 매핑한다', () => {
    const data = __mapLeaderboardSnapshot({
      snapshot_date: '2026-07-30',
      week_start_date: '2026-07-27',
      items: [{ rank: 1, nickname: '금융새싹', weekly_score: 32 }],
      my_rank: { rank: 47, nickname: '채권꿈나무', weekly_score: 18 },
      next_cursor: null,
    })

    expect(data).toEqual({
      snapshotDate: '2026-07-30',
      weekStartDate: '2026-07-27',
      items: [{ rank: 1, nickname: '금융새싹', weeklyScore: 32 }],
      myRank: { rank: 47, nickname: '채권꿈나무', weeklyScore: 18 },
      nextCursor: null,
    })
  })

  it('실 API 성공 시 매핑된 스냅샷을 반환한다', async () => {
    getLeaderboardApi.mockResolvedValue({
      data: {
        data: {
          snapshot_date: '2026-07-30',
          week_start_date: '2026-07-27',
          items: [{ rank: 1, nickname: '금융새싹', weekly_score: 32 }],
          my_rank: { rank: 2, nickname: '예금왕', weekly_score: 28 },
          next_cursor: null,
        },
      },
    })

    const { data } = await getLeaderboard({ size: 10 })
    expect(getLeaderboardApi).toHaveBeenCalledWith({ size: 10 })
    expect(data.items[0]).toEqual({ rank: 1, nickname: '금융새싹', weeklyScore: 32 })
    expect(data.myRank?.nickname).toBe('예금왕')
  })

  it('404 LEADERBOARD_SNAPSHOT_NOT_FOUND 는 폴백하지 않고 던진다', async () => {
    getLeaderboardApi.mockRejectedValue(
      new ApiError('집계 없음', 404, null, 'LEADERBOARD_SNAPSHOT_NOT_FOUND'),
    )

    await expect(getLeaderboard()).rejects.toMatchObject({
      code: 'LEADERBOARD_SNAPSHOT_NOT_FOUND',
      status: 404,
    })
    await expect(getLeaderboard()).rejects.toBeInstanceOf(LeaderboardApiError)
  })

  it('DEV에서 기타 API 실패 시 목업으로 폴백한다', async () => {
    getLeaderboardApi.mockRejectedValue(new ApiError('서버 오류', 500))

    const { data } = await getLeaderboardTop40()
    expect(__MOCK_TOP40_COUNT).toBe(40)
    expect(data.items).toHaveLength(40)
    expect(data.items[0]).toMatchObject({ rank: 1, nickname: '금융새싹' })
    expect(data.myRank).toEqual({ rank: 47, nickname: '채권꿈나무', weeklyScore: 18 })
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
