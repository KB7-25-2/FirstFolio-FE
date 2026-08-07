import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as portfolioService from '@/services/portfolioTradeService.js'

export const usePortfolioStore = defineStore('portfolio', () => {
  const summary = ref(null)
  const purchasableProducts = ref([])
  const productsNextCursor = ref(null)
  const lastTradeResult = ref(null)
  const transactions = ref([])
  const transactionsNextCursor = ref(null)

  const isLoading = ref(false)
  const error = ref(null)

  // productId → 상품 정보 맵. 포트폴리오 상세 응답의 holdings엔 asset_type/cycle_summary가
  // 없어서(product_id만 있음), 이 맵으로 조인해 채운다.
  const buildProductsById = () =>
    Object.fromEntries(purchasableProducts.value.map((product) => [product.productId, product]))

  const fetchPurchasableProducts = async (params = {}) => {
    isLoading.value = true
    error.value = null

    try {
      const { items, nextCursor } = await portfolioService.getPurchasableProductsList(params)
      purchasableProducts.value = items
      productsNextCursor.value = nextCursor
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // 구매 모달을 열 때 호출한다. 목록 API엔 가격이 없어서, 확인을 누르기 전에
  // 상세 조회로 현재가를 받아와야 정확한 예상 금액을 보여줄 수 있다.
  const fetchProductDetail = (productId) => portfolioService.getProductDetail(productId)

  const fetchSummary = async () => {
    isLoading.value = true
    error.value = null

    try {
      // holdings에 asset_type/cycle_summary가 없어서 조인용 상품 카탈로그가 먼저 있어야 한다.
      if (!purchasableProducts.value.length) {
        await fetchPurchasableProducts()
      }

      summary.value = await portfolioService.getCurrentPortfolio({
        productsById: buildProductsById(),
        currentSummary: summary.value,
      })
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // holdingId 보유 상품을 판매한다. 매수형(주식·펀드)은 quantity(개수), 가입형(예·적금·채권)은
  // quantity 없이(undefined) 호출하면 서비스 레이어가 전량 처리한다.
  const sellHolding = async (holdingId, quantity) => {
    const { summary: updatedSummary, tradeResult } = await portfolioService.sellHoldingService({
      holdingId,
      quantity,
      currentSummary: summary.value,
      productsById: buildProductsById(),
    })
    summary.value = updatedSummary
    lastTradeResult.value = tradeResult
  }

  // product를 amount원만큼 구매한다.
  const buyProduct = async (product, amount) => {
    const { summary: updatedSummary, tradeResult } = await portfolioService.buyProductService({
      product,
      amount,
      currentSummary: summary.value,
      productsById: buildProductsById(),
    })
    summary.value = updatedSummary
    lastTradeResult.value = tradeResult
  }

  // FUNC-037: 파산 신청·포트폴리오 초기화. 성공하면 새 세대(현금 3천만원)로 다시 조회한다.
  const resetPortfolio = async () => {
    await portfolioService.resetPortfolioService()
    await fetchSummary()
  }

  // FUNC-034: 거래·자산 이벤트 이력(예정 이벤트 포함) 조회.
  const fetchTransactions = async (params = {}) => {
    isLoading.value = true
    error.value = null

    try {
      const { items, nextCursor } = await portfolioService.getPortfolioTransactionsList(params)
      transactions.value = items
      transactionsNextCursor.value = nextCursor
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
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
    productsNextCursor,
    isLoading,
    error,
    fetchSummary,
    fetchPurchasableProducts,
    fetchProductDetail,
    sellHolding,
    buyProduct,
    lastTradeResult,
    resetPortfolio,
    transactions,
    transactionsNextCursor,
    fetchTransactions,
    // 홈 위젯 호환용 별칭
    portfolioSummary,
    allocationView,
    totalAssetsDisplay,
    fetchPortfolioSummary,
  }
})
