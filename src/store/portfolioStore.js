import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import * as portfolioService from '@/services/portfolioTradeService.js'
import { getKoreanMarketSession } from '@/utils/koreanMarketSession.js'
import { useDashboardStore } from '@/store/dashboardStore.js'

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
      // GET /financial-products는 한 번에 최대 20개(size 기본값)만 준다. 필터 없이 한 번만
      // 받아오면 product_id가 늦은 자산군(채권·펀드 등)이 첫 페이지 밖으로 밀려 어떤 탭에서도
      // 안 보이는 문제가 생긴다. purchasableProducts는 이 화면뿐 아니라 시간 압축 탭,
      // 보유 목록 cycleSummary 조인(buildProductsById)까지 전역으로 쓰이는 "전체 카탈로그"라
      // 커서를 따라 끝까지 모아 하나로 합친다. 무한 루프 방지용 안전장치로 최대 50페이지.
      const items = []
      let cursor = params.cursor
      for (let page = 0; page < 50; page += 1) {
        const result = await portfolioService.getPurchasableProductsList({
          ...params,
          cursor,
          size: params.size ?? 100,
        })
        items.push(...result.items)
        if (!result.nextCursor) {
          break
        }
        cursor = result.nextCursor
      }
      purchasableProducts.value = items
      productsNextCursor.value = null
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

  // 목록 API(FUNC-031)는 애초에 가격을 안 준다 — 매수형(주식·펀드)은 unitPrice가 항상 null로
  // 온다. 모달을 열 때(fetchProductDetail)는 그때그때 채워지지만, 상품 구매 "목록 화면" 자체는
  // 아무도 이걸 채워준 적이 없어서 "가격 정보 준비 중"이 영구히 떠 있었다(FUNC-032로 채울
  // 계획이었다는 매퍼 주석만 남아있고 실제 구현이 빠져 있었음). 목록을 받아온 뒤, 아직 가격이
  // 없는 매수형 상품들의 상세를 병렬로 조회해 채운다. isTimeCompressionExempt는 STOCK/FUND
  // (=매수형) 판별에 그대로 재사용 — 시간압축 예외 = 실시간 시세 상품이라는 뜻이라서다.
  const hydrateProductPrices = async () => {
    const targets = purchasableProducts.value.filter(
      (product) => product.isTimeCompressionExempt && product.unitPrice == null,
    )
    if (!targets.length) return

    const results = await Promise.allSettled(
      targets.map((product) => portfolioService.getProductDetail(product.productId)),
    )

    const priceByProductId = new Map()
    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value?.unitPrice != null) {
        priceByProductId.set(targets[index].productId, result.value.unitPrice)
      }
    })
    if (!priceByProductId.size) return

    purchasableProducts.value = purchasableProducts.value.map((product) =>
      priceByProductId.has(product.productId)
        ? { ...product, unitPrice: priceByProductId.get(product.productId) }
        : product,
    )
  }

  // 상품 구매 화면이 열려있는 동안 실시간 시세(주식·펀드)를 2초마다 갱신한다. hydrateProductPrices와
  // 다르게 이미 가격이 있는 상품도 매번 다시 조회한다(진짜 "폴링" — 계속 갱신하는 게 목적이라
  // null-필터를 안 건다). purchasableProducts가 비어있으면(최초 진입) 카탈로그부터 받아온다.
  let productPricePollTimer = null

  const pollProductPrices = async () => {
    if (!purchasableProducts.value.length) {
      await fetchPurchasableProducts()
    }

    const targets = purchasableProducts.value.filter((product) => product.isTimeCompressionExempt)
    if (!targets.length) return

    const results = await Promise.allSettled(
      targets.map((product) => portfolioService.getProductDetail(product.productId)),
    )

    const priceByProductId = new Map()
    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value?.unitPrice != null) {
        priceByProductId.set(targets[index].productId, result.value.unitPrice)
      }
    })
    if (!priceByProductId.size) return

    purchasableProducts.value = purchasableProducts.value.map((product) =>
      priceByProductId.has(product.productId)
        ? { ...product, unitPrice: priceByProductId.get(product.productId) }
        : product,
    )
  }

  const startProductPricePolling = () => {
    if (productPricePollTimer) return // 이미 돌고 있으면 중복 시작 방지
    pollProductPrices()
    productPricePollTimer = setInterval(pollProductPrices, 2_000)
  }

  const stopProductPricePolling = () => {
    if (!productPricePollTimer) return
    clearInterval(productPricePollTimer)
    productPricePollTimer = null
  }

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
  // tradeResult를 반환한다 — 호출부(뷰)가 거래 완료 모달에 상품명 등과 함께 표시할 수 있도록.
  const sellHolding = async (holdingId, quantity) => {
    const { summary: updatedSummary, tradeResult } = await portfolioService.sellHoldingService({
      holdingId,
      quantity,
      currentSummary: summary.value,
      productsById: buildProductsById(),
    })
    summary.value = updatedSummary
    lastTradeResult.value = tradeResult
    await syncDashboardAfterPortfolioChange()
    return tradeResult
  }

  // product를 amount원만큼 구매한다. tradeResult를 반환한다(용도는 sellHolding과 동일).
  const buyProduct = async (product, amount) => {
    const { summary: updatedSummary, tradeResult } = await portfolioService.buyProductService({
      product,
      amount,
      productsById: buildProductsById(),
    })
    summary.value = updatedSummary
    lastTradeResult.value = tradeResult
    await syncDashboardAfterPortfolioChange()
    return tradeResult
  }

  // FUNC-037: 파산 신청·포트폴리오 초기화. 성공하면 새 세대(현금 3천만원)로 다시 조회한다.
  const resetPortfolio = async () => {
    await portfolioService.resetPortfolioService()
    await fetchSummary()
  }

  /** 홈 PortfolioSummary가 최신 배분·총자산을 쓰도록 대시보드 캐시 갱신 */
  const syncDashboardAfterPortfolioChange = async () => {
    const dashboardStore = useDashboardStore()
    dashboardStore.invalidate()
    try {
      await dashboardStore.fetchDashboard({ force: true })
    } catch {
      // 거래는 이미 성공 — 대시보드 재조회 실패는 홈 재진입 시 ensure로 복구
    }
  }

  /** 기초 수료 직후 모의투자금 지급 + 요약·대시보드 갱신 */
  const grantFoundationCash = async () => {
    summary.value = await portfolioService.grantInitialSimulationCash()
    error.value = null
    await syncDashboardAfterPortfolioChange()
    return summary.value
  }

  // FUNC-034: 거래·자산 이벤트 이력(예정 이벤트 포함) 조회.
  // append=true면 커서로 다음 페이지를 이어붙인다("더 보기"), 아니면 목록을 새로 채운다(필터 변경 등).
  //
  // 필터 탭을 빠르게 연달아 누르면 요청이 여러 개 동시에 날아가는데, 네트워크 타이밍상 나중에
  // 보낸 요청의 응답이 먼저 온 요청보다 늦게 도착할 수 있다(경쟁 상태) — 그러면 방금 누른
  // "매도" 목록이 그보다 먼저 눌렀던 "전체" 응답으로 덮어써져서, 화면엔 매도 탭인데 다른 유형
  // 거래가 섞여 보이는 버그가 생긴다. 요청마다 순번을 매겨서, 가장 최근에 보낸 요청의 응답만
  // 실제로 반영한다(그보다 오래된 요청의 응답은 늦게 와도 버린다).
  let transactionsRequestId = 0
  const fetchTransactions = async (params = {}) => {
    const { append = false, ...queryParams } = params
    const requestId = (transactionsRequestId += 1)
    isLoading.value = true
    error.value = null

    try {
      const { items, nextCursor } = await portfolioService.getPortfolioTransactionsList(queryParams)
      if (requestId !== transactionsRequestId) return // 더 최신 요청이 이미 나간 뒤라 이 응답은 버린다
      // API는 status 필터가 없어서(type/cursor/size만 지원) SCHEDULED(예정)·CANCELLED(취소)까지
      // 전부 내려준다. 화면엔 실제로 처리 완료된 이력만 보여준다 — 예정 이벤트는 아직 안 일어난
      // 일이라 목록에 섞이면(취소되면 더더욱) 헷갈린다.
      const completedItems = items.filter((item) => item.status === 'COMPLETED')
      transactions.value = append ? [...transactions.value, ...completedItems] : completedItems
      transactionsNextCursor.value = nextCursor
    } catch (err) {
      if (requestId === transactionsRequestId) error.value = err.message
      throw err
    } finally {
      if (requestId === transactionsRequestId) isLoading.value = false
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

  /** 로그아웃 등 세션 종료 시 이전 사용자의 잔여 상태를 전부 비운다 (userSessionCleanup.js). */
  const clear = () => {
    stopProductPricePolling()
    summary.value = null
    purchasableProducts.value = []
    productsNextCursor.value = null
    lastTradeResult.value = null
    transactions.value = []
    transactionsNextCursor.value = null
    isLoading.value = false
    error.value = null
  }

  return {
    summary,
    purchasableProducts,
    productsNextCursor,
    isLoading,
    error,
    fetchSummary,
    fetchPurchasableProducts,
    fetchProductDetail,
    hydrateProductPrices,
    startProductPricePolling,
    stopProductPricePolling,
    sellHolding,
    buyProduct,
    lastTradeResult,
    resetPortfolio,
    grantFoundationCash,
    transactions,
    transactionsNextCursor,
    fetchTransactions,
    clear,
    // 홈 위젯 호환용 별칭
    portfolioSummary,
    allocationView,
    totalAssetsDisplay,
    fetchPortfolioSummary,
    getKoreanMarketSession,
  }
})
