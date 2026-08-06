import { describe, expect, it } from 'vitest'
import {
  __mapLeaderboardSnapshot,
  __MOCK_TOP40_COUNT,
  getLeaderboard,
  getLeaderboardTop40,
} from '@/services/leaderboardService.js'

describe('leaderboardService (unit)', () => {
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

  it('TOP 40 목업을 반환한다', async () => {
    const { data } = await getLeaderboardTop40()

    expect(__MOCK_TOP40_COUNT).toBe(40)
    expect(data.items).toHaveLength(40)
    expect(data.items[0]).toMatchObject({ rank: 1, nickname: '금융새싹' })
    expect(data.items[39].rank).toBe(40)
    expect(data.myRank).toEqual({ rank: 47, nickname: '채권꿈나무', weeklyScore: 18 })
  })

  it('cursor·size로 페이지를 자른다', async () => {
    const first = await getLeaderboard({ size: 20 })
    expect(first.data.items).toHaveLength(20)
    expect(first.data.items[0].rank).toBe(1)
    expect(first.data.nextCursor).toBe('20')

    const second = await getLeaderboard({ cursor: '20', size: 20 })
    expect(second.data.items).toHaveLength(20)
    expect(second.data.items[0].rank).toBe(21)
    expect(second.data.nextCursor).toBeNull()
  })
})
