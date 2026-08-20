import { useCurriculumStore } from '@/store/curriculumStore.js'
import { useDailyQuestStore } from '@/store/dailyQuestStore.js'
import { useDashboardStore } from '@/store/dashboardStore.js'
import { useGifticonStore } from '@/store/gifticonStore.js'
import { useLeaderboardStore } from '@/store/leaderboardStore.js'
import { useLevelTestStore } from '@/store/levelTestStore.js'
import { useNewsStore } from '@/store/newsStore.js'
import { usePortfolioStore } from '@/store/portfolioStore.js'
import { useStudyStore } from '@/store/studyStore.js'
import { useUserStore } from '@/store/userStore.js'

/** Pinia에 남은 이전 사용자 데이터를 모두 비운다. */
export const clearUserScopedStores = () => {
  useUserStore().clearProfile()
  useLevelTestStore().clear()
  useCurriculumStore().clear()
  useDashboardStore().clear()
  useStudyStore().clearStudy()
  useDailyQuestStore().clear()
  useLeaderboardStore().clear()
  useNewsStore().clearNews()
  usePortfolioStore().clear()
  useGifticonStore().clear()
}

/** 로그아웃 시 브라우저 저장소에 남은 사용자별·목업 상태를 제거한다. */
export const clearPersistedUserSession = () => {
  try {
    localStorage.clear()
  } catch {
    // 저장소 접근이 막힌 환경은 무시한다.
  }
  try {
    sessionStorage.clear()
  } catch {
    // 저장소 접근이 막힌 환경은 무시한다.
  }
}

/** 401 등 Store 밖에서 발생한 세션 종료를 Pinia 정리로 연결한다. */
export const initUserSessionCleanupListener = () => {
  if (typeof window === 'undefined') return
  window.addEventListener('ff:clear-user-session', clearUserScopedStores)
}
