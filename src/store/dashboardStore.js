import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { getDashboard } from '@/services/dashboardService.js'
import { getAssetTypeMeta } from '@/constants/assetType.js'

/**
 * 홈 통합 요약 — GET /dashboard
 */
export const useDashboardStore = defineStore('dashboard', () => {
  /** @type {import('vue').Ref<import('@/types/portfolio.js').DashboardSummary | null>} */
  const summary = ref(null)
  const isLoading = ref(false)
  const error = ref(null)
  let inflight = null

  const portfolio = computed(() => summary.value?.portfolio ?? null)
  const dailyQuest = computed(() => summary.value?.dailyQuest ?? null)
  const learning = computed(() => summary.value?.learning ?? null)
  const upcomingEvents = computed(() => summary.value?.upcomingEvents ?? [])
  const latestNews = computed(() => summary.value?.latestNews ?? [])

  const portfolioAvailable = computed(() => Boolean(portfolio.value?.available))

  const allocationView = computed(() => {
    const items = portfolio.value?.allocation ?? []
    return items.map((item) => {
      const meta = getAssetTypeMeta(item.assetType)
      return {
        assetType: item.assetType,
        label: meta.label,
        ratio: Number(item.ratio) || 0,
        color: meta.color,
      }
    })
  })

  const totalAssetsDisplay = computed(() => {
    const raw = portfolio.value?.totalAssets
    if (raw == null || raw === '') return '0'
    const amount = Number(raw)
    if (Number.isNaN(amount)) return String(raw)
    return Math.round(amount).toLocaleString('ko-KR')
  })

  const profitLossDisplay = computed(() => {
    const raw = portfolio.value?.profitLoss
    if (raw == null || raw === '') return null
    const amount = Number(raw)
    if (Number.isNaN(amount)) return String(raw)
    const sign = amount > 0 ? '+' : ''
    return `${sign}${Math.round(amount).toLocaleString('ko-KR')}`
  })

  /** OpenAPI LearningContinue.route 예시와 동일: /learning/sub-chapters/{id} */
  const learningContinueRoute = computed(() => {
    const item = learning.value
    if (!item || item.available === false) return null
    if (item.subChapterId != null) {
      return `/learning/sub-chapters/${item.subChapterId}`
    }
    if (item.mainChapterId != null) {
      return `/learning?mainChapterId=${item.mainChapterId}`
    }
    return '/learning'
  })

  const fetchDashboard = async ({ force = false } = {}) => {
    if (!force && summary.value && !error.value) return summary.value
    if (!force && inflight) return inflight

    isLoading.value = true
    error.value = null

    inflight = (async () => {
      try {
        const { data } = await getDashboard()
        summary.value = data
        return data
      } catch (err) {
        error.value = err?.message || '홈 정보를 불러오지 못했습니다.'
        throw err
      } finally {
        isLoading.value = false
        inflight = null
      }
    })()

    return inflight
  }

  const clear = () => {
    summary.value = null
    error.value = null
    isLoading.value = false
    inflight = null
  }

  return {
    summary,
    isLoading,
    error,
    portfolio,
    dailyQuest,
    learning,
    upcomingEvents,
    latestNews,
    portfolioAvailable,
    allocationView,
    totalAssetsDisplay,
    profitLossDisplay,
    learningContinueRoute,
    fetchDashboard,
    clear,
  }
})
