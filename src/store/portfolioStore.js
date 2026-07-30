import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { getDashboard } from '@/services/dashboardService.js'
import {
  ASSET_TYPE_COLORS,
  ASSET_TYPE_LABELS,
  getActivePortfolio,
} from '@/services/portfolioService.js'

export const usePortfolioStore = defineStore('portfolio', () => {
  const dashboard = ref(null)
  const activePortfolio = ref(null)
  const isLoading = ref(false)
  const error = ref(null)

  /** 홈 카드용 포트폴리오 요약 (dashboard.portfolio 우선) */
  const portfolioSummary = computed(() => {
    const section = dashboard.value?.portfolio
    if (section?.available) {
      return {
        available: true,
        totalAssets: section.totalAssets ?? '0',
        profitLoss: section.profitLoss ?? '0',
        allocation: section.allocation ?? [],
      }
    }

    if (activePortfolio.value) {
      return {
        available: true,
        totalAssets: activePortfolio.value.summary.totalAssets,
        profitLoss: activePortfolio.value.summary.profitLoss,
        allocation: activePortfolio.value.allocation,
      }
    }

    return {
      available: false,
      reason: section?.reason ?? '포트폴리오 정보가 없습니다.',
      totalAssets: '0',
      profitLoss: '0',
      allocation: [],
    }
  })

  /** 비중 바·범례용 (라벨·색상 포함) */
  const allocationView = computed(() =>
    (portfolioSummary.value.allocation ?? []).map((item) => ({
      ...item,
      label: ASSET_TYPE_LABELS[item.assetType] ?? item.assetType,
      color: ASSET_TYPE_COLORS[item.assetType] ?? ASSET_TYPE_COLORS.OTHER,
    })),
  )

  /** 표시용 총자산 (천 단위 콤마, 원 단위 정수) */
  const totalAssetsDisplay = computed(() => {
    const amount = Number(portfolioSummary.value.totalAssets)
    if (Number.isNaN(amount)) return '0'
    return Math.round(amount).toLocaleString('ko-KR')
  })

  const fetchActivePortfolio = async () => {
    try {
      const { data } = await getActivePortfolio()
      activePortfolio.value = data
    } catch (err) {
      if (err.code === 'ACTIVE_PORTFOLIO_NOT_FOUND') {
        activePortfolio.value = null
        return
      }
      throw err
    }
  }

  const fetchDashboard = async () => {
    const { data } = await getDashboard()
    dashboard.value = data
  }

  /** 홈 포트폴리오 요약 카드용 */
  const fetchPortfolioSummary = async () => {
    if (isLoading.value) return

    isLoading.value = true
    error.value = null

    try {
      await Promise.all([fetchDashboard(), fetchActivePortfolio()])
    } catch (err) {
      error.value = err?.message || '포트폴리오 요약을 불러오지 못했습니다.'
    } finally {
      isLoading.value = false
    }
  }

  const clearPortfolio = () => {
    dashboard.value = null
    activePortfolio.value = null
    error.value = null
  }

  return {
    dashboard,
    activePortfolio,
    isLoading,
    error,
    portfolioSummary,
    allocationView,
    totalAssetsDisplay,
    fetchActivePortfolio,
    fetchDashboard,
    fetchPortfolioSummary,
    clearPortfolio,
  }
})
