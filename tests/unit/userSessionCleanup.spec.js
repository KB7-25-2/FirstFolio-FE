import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { clearPersistedUserSession, clearUserScopedStores } from '@/utils/userSessionCleanup.js'
import { useDailyQuestStore } from '@/store/dailyQuestStore.js'
import { useGifticonStore } from '@/store/gifticonStore.js'
import { useLeaderboardStore } from '@/store/leaderboardStore.js'
import { useNewsStore } from '@/store/newsStore.js'
import { usePortfolioStore } from '@/store/portfolioStore.js'
import { useStudyStore } from '@/store/studyStore.js'
import { useUserStore } from '@/store/userStore.js'

describe('userSessionCleanup', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    sessionStorage.clear()
  })

  it('모든 사용자 Store의 데이터를 초기화한다', () => {
    const user = useUserStore()
    const study = useStudyStore()
    const dailyQuest = useDailyQuestStore()
    const leaderboard = useLeaderboardStore()
    const portfolio = usePortfolioStore()
    const gifticon = useGifticonStore()
    const news = useNewsStore()

    user.profile = { nickname: '이전 사용자' }
    study.currentContent = { subChapterId: 101 }
    dailyQuest.quest = { dailyQuestId: 1 }
    leaderboard.snapshot = { myRank: { rank: 1, score: 5 } }
    portfolio.summary = { totalAssetValue: 1000 }
    portfolio.transactions = [{ transactionId: 1 }]
    gifticon.gifticons = [{ gifticonId: 1 }]
    gifticon.redemptionHistory = [{ gifticonOrderId: 1 }]
    news.items = [{ financial_news_id: 1 }]

    clearUserScopedStores()

    expect(user.profile).toBeNull()
    expect(study.currentContent).toBeNull()
    expect(dailyQuest.quest).toBeNull()
    expect(leaderboard.snapshot).toBeNull()
    expect(portfolio.summary).toBeNull()
    expect(portfolio.transactions).toEqual([])
    expect(gifticon.gifticons).toEqual([])
    expect(gifticon.redemptionHistory).toEqual([])
    expect(news.items).toEqual([])
  })

  it('로그아웃 시 localStorage와 sessionStorage를 모두 비운다', () => {
    localStorage.setItem('daily_quest_state', 'old-user')
    localStorage.setItem('admin_quiz_questions_cache', 'old-user')
    sessionStorage.setItem('simulation_cash_granted', '1')
    sessionStorage.setItem('mock_learning_profile', 'mid-curriculum')

    clearPersistedUserSession()

    expect(localStorage.length).toBe(0)
    expect(sessionStorage.length).toBe(0)
  })
})
