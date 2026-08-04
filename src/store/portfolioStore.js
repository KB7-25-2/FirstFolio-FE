import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  getPortfolioSummary,
  sellHolding as sellHoldingApi,
  purchaseProduct as purchaseProductApi,
  getPurchasableProducts,
  getTimeCompressionRules,
} from '@/api/portfolioApi.js'
import { mapPortfolioSummaryResponse, recomputePortfolioSummary } from '@/api/portfolioMapper.js'
import {
  mockPortfolioSummary,
  mockPurchasableProducts,
  mockTimeCompressionRules,
} from '@/mocks/portfolioMock.js'

export const usePortfolioStore = defineStore('portfolio', () => {
  const summary = ref(null)
  const purchasableProducts = ref([])
  const timeCompressionRules = ref([])

  const isLoading = ref(false)
  const error = ref(null)

  const fetchSummary = async () => {
    isLoading.value = true
    error.value = null

    try {
      const { data } = await getPortfolioSummary()
      // 실제 API 응답도 목데이터와 동일하게 어댑터를 거친다.
      // 백엔드 응답 구조가 확정/변경돼도 여기(portfolioMapper.js)만 고치면 된다.
      summary.value = mapPortfolioSummaryResponse(data)
    } catch (err) {
      // 백엔드 준비 전까지는 개발 환경에서만 목데이터로 대체해 화면을 확인할 수 있게 한다.
      if (import.meta.env.DEV) {
        console.warn('[portfolioStore] 포트폴리오 API 호출 실패 — 목데이터로 대체합니다.', err)
        summary.value = mapPortfolioSummaryResponse(structuredClone(mockPortfolioSummary))
      } else {
        error.value = err.message
        throw err
      }
    } finally {
      isLoading.value = false
    }
  }

  const fetchPurchasableProducts = async () => {
    isLoading.value = true
    error.value = null

    try {
      const { data } = await getPurchasableProducts()
      purchasableProducts.value = data
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn('[portfolioStore] 상품 목록 API 호출 실패 — 목데이터로 대체합니다.', err)
        purchasableProducts.value = structuredClone(mockPurchasableProducts)
      } else {
        error.value = err.message
        throw err
      }
    } finally {
      isLoading.value = false
    }
  }

  const fetchTimeCompressionRules = async () => {
    isLoading.value = true
    error.value = null

    try {
      const { data } = await getTimeCompressionRules()
      timeCompressionRules.value = data
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn('[portfolioStore] 시간 압축 규칙 API 호출 실패 — 목데이터로 대체합니다.', err)
        timeCompressionRules.value = structuredClone(mockTimeCompressionRules)
      } else {
        error.value = err.message
        throw err
      }
    } finally {
      isLoading.value = false
    }
  }

  // holdingId 보유 상품을 quantity개만큼 판매한다.
  // 백엔드가 준비되기 전(DEV, API 실패)에는 로컬 summary를 직접 갱신해 즉시 반영한다.
  const sellHolding = async (holdingId, quantity) => {
    try {
      const { data } = await sellHoldingApi(holdingId, { quantity })
      summary.value = mapPortfolioSummaryResponse(data)
      return
    } catch (err) {
      if (!import.meta.env.DEV) {
        error.value = err.message
        throw err
      }
      console.warn('[portfolioStore] 판매 API 호출 실패 — 로컬 데이터를 직접 갱신합니다.', err)
    }

    const holding = summary.value.holdings.find((item) => item.holdingId === holdingId)
    if (!holding) return

    const soldQuantity = Math.min(quantity, holding.quantity)
    const soldAmount = soldQuantity * holding.unitPrice

    holding.quantity -= soldQuantity
    holding.principalAmount -= soldAmount
    summary.value.cashBalance += soldAmount

    if (holding.quantity <= 0) {
      summary.value.holdings = summary.value.holdings.filter((item) => item.holdingId !== holdingId)
    }

    // 총자산/비중 등 파생값을 최신 holdings·cashBalance 기준으로 다시 계산한다.
    summary.value = recomputePortfolioSummary(summary.value)
  }

  // product를 quantity개만큼 구매한다. 이미 보유 중인 상품이면 수량을 합산한다.
  const buyProduct = async (product, quantity) => {
    try {
      const { data } = await purchaseProductApi(product.productId, { quantity })
      summary.value = mapPortfolioSummaryResponse(data)
      return
    } catch (err) {
      if (!import.meta.env.DEV) {
        error.value = err.message
        throw err
      }
      console.warn('[portfolioStore] 구매 API 호출 실패 — 로컬 데이터를 직접 갱신합니다.', err)
    }

    const cost = quantity * product.unitPrice
    if (cost > summary.value.cashBalance) {
      throw new Error('현금이 부족합니다.')
    }

    summary.value.cashBalance -= cost

    const existing = summary.value.holdings.find((item) => item.productId === product.productId)
    if (existing) {
      existing.quantity += quantity
      existing.principalAmount += cost
    } else {
      summary.value.holdings.push({
        holdingId: Date.now(),
        productId: product.productId,
        displayName: product.displayName,
        assetType: product.assetType,
        cycleSummary: product.cycleSummary,
        quantity,
        unitPrice: product.unitPrice,
        principalAmount: cost,
        highlighted: false,
      })
    }

    summary.value = recomputePortfolioSummary(summary.value)
  }

  // --- 홈 화면 위젯(components/PortfolioSummary.vue) 호환용 별칭 ---
  // 그 컴포넌트는 storeToRefs로 portfolioSummary/allocationView/totalAssetsDisplay를
  // 기대하고, fetchPortfolioSummary()를 호출한다. 데이터 원본은 그대로 summary이고
  // 여기서는 그 모양만 맞춰서 파생시킨다 (진짜 데이터는 한 곳(summary)에서만 관리).
  const portfolioSummary = computed(() => {
    if (summary.value) return { available: true }
    return { available: false, reason: error.value }
  })

  const allocationView = computed(
    () =>
      summary.value?.allocations.map((item) => ({
        assetType: item.label,
        label: item.label,
        ratio: item.ratio,
        color: item.color,
      })) ?? [],
  )

  const totalAssetsDisplay = computed(() =>
    summary.value ? summary.value.totalAssetValue.toLocaleString('ko-KR') : '0',
  )

  const fetchPortfolioSummary = fetchSummary

  return {
    summary,
    purchasableProducts,
    timeCompressionRules,
    isLoading,
    error,
    fetchSummary,
    fetchPurchasableProducts,
    fetchTimeCompressionRules,
    sellHolding,
    buyProduct,
    // 홈 위젯 호환용 별칭
    portfolioSummary,
    allocationView,
    totalAssetsDisplay,
    fetchPortfolioSummary,
  }
})
