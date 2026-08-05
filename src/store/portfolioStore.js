import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  getPortfolioSummary,
  tradePortfolio,
  getPurchasableProducts,
  getFinancialProductDetail,
  resetPortfolio as resetPortfolioApi,
} from '@/api/portfolioApi.js'
import {
  mapPortfolioDetailResponse,
  mapFinancialProductsResponse,
  mapFinancialProductDetail,
  mapTradeResult,
  normalizeLocalSummary,
} from '@/api/portfolioMapper.js'
import { getAssetTypeMeta } from '@/constants/assetType.js'
import { mockPortfolioSummary, mockPurchasableProducts } from '@/mocks/portfolioMock.js'

export const usePortfolioStore = defineStore('portfolio', () => {
  const summary = ref(null)
  const purchasableProducts = ref([])
  const productsNextCursor = ref(null)

  const isLoading = ref(false)
  const error = ref(null)

  const fetchPurchasableProducts = async (params = {}) => {
    isLoading.value = true
    error.value = null

    try {
      const { data } = await getPurchasableProducts(params)
      // 응답이 { data: { items, next_cursor } } 형태로 한 번 더 감싸져 있음(FUNC-031 문서 기준)
      const mapped = mapFinancialProductsResponse(data.data ?? data)
      purchasableProducts.value = mapped.items
      productsNextCursor.value = mapped.nextCursor
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn('[portfolioStore] 상품 목록 API 호출 실패 — 목데이터로 대체합니다.', err)
        purchasableProducts.value = structuredClone(mockPurchasableProducts)
        productsNextCursor.value = null
      } else {
        error.value = err.message
        throw err
      }
    } finally {
      isLoading.value = false
    }
  }

  // productId → 상품 정보 맵. 포트폴리오 상세 응답의 holdings엔 asset_type/cycle_summary가
  // 없어서(product_id만 있음), 이 맵으로 조인해 채운다.
  const buildProductsById = () =>
    Object.fromEntries(purchasableProducts.value.map((product) => [product.productId, product]))

  // 구매 모달을 열 때 호출한다. 목록 API(FUNC-031)엔 가격이 없어서, 확인을 누르기 전에
  // 상세 조회(FUNC-032)로 현재가를 받아와야 정확한 예상 금액을 보여줄 수 있다.
  const fetchProductDetail = async (productId) => {
    try {
      const { data } = await getFinancialProductDetail(productId)
      return mapFinancialProductDetail(data.data ?? data)
    } catch (err) {
      if (import.meta.env.DEV) {
        console.warn(
          '[portfolioStore] 상품 상세 API 호출 실패 — 목데이터 가격으로 대체합니다.',
          err,
        )
        const fallback = mockPurchasableProducts.find((product) => product.productId === productId)
        return fallback ? { ...fallback, unitPrice: fallback.unitPrice } : null
      }
      throw err
    }
  }

  const fetchSummary = async () => {
    isLoading.value = true
    error.value = null

    try {
      // holdings에 asset_type/cycle_summary가 없어서 조인용 상품 카탈로그가 먼저 있어야 한다.
      if (!purchasableProducts.value.length) {
        await fetchPurchasableProducts()
      }

      const { data } = await getPortfolioSummary()
      summary.value = mapPortfolioDetailResponse(data.data ?? data, buildProductsById())
    } catch (err) {
      // 백엔드 준비 전까지는 개발 환경에서만 목데이터로 대체해 화면을 확인할 수 있게 한다.
      // 단, 이미 로컬 상태가 있으면(매수/매도로 바뀐 상태 포함) 덮어쓰지 않는다 —
      // 안 그러면 탭을 옮길 때마다 방금 한 거래가 원본 목데이터로 리셋돼버린다.
      if (import.meta.env.DEV) {
        if (!summary.value) {
          console.warn('[portfolioStore] 포트폴리오 API 호출 실패 — 목데이터로 대체합니다.', err)
          summary.value = normalizeLocalSummary(structuredClone(mockPortfolioSummary))
        } else {
          console.warn(
            '[portfolioStore] 포트폴리오 API 호출 실패 — 기존 로컬 상태를 유지합니다.',
            err,
          )
        }
      } else {
        error.value = err.message
        throw err
      }
    } finally {
      isLoading.value = false
    }
  }

  const lastTradeResult = ref(null)

  // holdingId 보유 상품을 amount원만큼 판매(가입형은 항상 전액 해지)한다.
  // 백엔드가 준비되기 전(DEV, API 실패)에는 로컬 summary를 직접 갱신해 즉시 반영한다.
  const sellHolding = async (holdingId, amount) => {
    const holding = summary.value?.holdings.find((item) => item.holdingId === holdingId)

    try {
      if (!holding) throw new Error('보유 내역을 찾을 수 없습니다.')
      const { data } = await tradePortfolio('SELL', holding.productId, amount)
      lastTradeResult.value = mapTradeResult(data.data ?? data)
      // 거래 응답엔 전체 holdings/allocation이 없어서, 성공 후 최신 상태를 다시 받아온다.
      await fetchSummary()
      return
    } catch (err) {
      if (!import.meta.env.DEV) {
        error.value = err.message
        throw err
      }
      console.warn('[portfolioStore] 판매 API 호출 실패 — 로컬 데이터를 직접 갱신합니다.', err)
    }

    if (!holding) return

    const meta = getAssetTypeMeta(holding.assetType)
    const isSubscription = meta.tradeType === 'SUBSCRIPTION'

    // 가입형(예·적금·채권)은 부분 해지가 없다 — 전액만 가능.
    const soldAmount = isSubscription
      ? holding.valuationAmount
      : Math.min(amount, holding.valuationAmount)
    const soldQuantity = isSubscription
      ? holding.quantity
      : Math.floor((soldAmount / holding.unitPrice) * 1e6) / 1e6

    holding.quantity -= soldQuantity
    holding.principalAmount -= soldAmount
    holding.valuationAmount -= soldAmount
    summary.value.cashBalance += soldAmount

    if (isSubscription || holding.quantity <= 0) {
      summary.value.holdings = summary.value.holdings.filter((item) => item.holdingId !== holdingId)
    }

    lastTradeResult.value = {
      transactionType: 'SELL',
      productId: holding.productId,
      requestedAmount: amount,
      amount: soldAmount,
      quantity: isSubscription ? null : soldQuantity,
      unitPrice: isSubscription ? null : holding.unitPrice,
      status: 'COMPLETED',
      cashBalance: summary.value.cashBalance,
    }

    // 총자산/비중 등 파생값을 최신 holdings·cashBalance 기준으로 다시 계산한다.
    summary.value = normalizeLocalSummary(summary.value)
  }

  // product를 amount원만큼 구매한다.
  // 가입형(예·적금·채권)은 이미 보유 중이면 차단(422 TRADE_NOT_ALLOWED와 동일 정책).
  // 매수형(주식·펀드)은 수량=내림(amount÷현재가)으로 환산 — 절사분은 현금에 그대로 남는다.
  const buyProduct = async (product, amount) => {
    try {
      const { data } = await tradePortfolio('BUY', product.productId, amount)
      lastTradeResult.value = mapTradeResult(data.data ?? data)
      // 거래 응답엔 전체 holdings/allocation이 없어서, 성공 후 최신 상태를 다시 받아온다.
      await fetchSummary()
      return
    } catch (err) {
      if (!import.meta.env.DEV) {
        if (err.data?.error?.code === 'TRADE_NOT_ALLOWED') {
          error.value = '이미 가입한 상품이에요. 예·적금·채권은 추가 가입이 안 돼요.'
        } else {
          error.value = err.message
        }
        throw err
      }
      console.warn('[portfolioStore] 구매 API 호출 실패 — 로컬 데이터를 직접 갱신합니다.', err)
    }

    const meta = getAssetTypeMeta(product.assetType)
    const isSubscription = meta.tradeType === 'SUBSCRIPTION'

    const existing = summary.value.holdings.find((item) => item.productId === product.productId)
    if (isSubscription && existing) {
      throw new Error('이미 가입한 상품이에요. 예·적금·채권은 추가 가입이 안 돼요.')
    }

    if (amount > summary.value.cashBalance) {
      throw new Error('현금이 부족합니다.')
    }

    // 매수형은 수량을 내림 처리하고, 남는 금액(단수)은 현금에 그대로 남긴다.
    const quantity = isSubscription ? 1 : Math.floor(amount / product.unitPrice)
    const filledAmount = isSubscription ? amount : quantity * product.unitPrice

    if (!isSubscription && quantity <= 0) {
      throw new Error('입력한 금액으로는 1주도 살 수 없어요. 금액을 늘려주세요.')
    }

    summary.value.cashBalance -= filledAmount

    if (existing) {
      existing.quantity += quantity
      existing.principalAmount += filledAmount
      existing.valuationAmount += filledAmount
    } else {
      summary.value.holdings.push({
        holdingId: Date.now(),
        productId: product.productId,
        displayName: product.displayName,
        assetType: product.assetType,
        cycleSummary: product.cycleSummary,
        quantity,
        unitPrice: product.unitPrice,
        principalAmount: filledAmount,
        valuationAmount: filledAmount,
        status: 'ACTIVE',
      })
    }

    lastTradeResult.value = {
      transactionType: 'BUY',
      productId: product.productId,
      requestedAmount: amount,
      amount: filledAmount,
      quantity: isSubscription ? null : quantity,
      unitPrice: isSubscription ? null : product.unitPrice,
      status: 'COMPLETED',
      cashBalance: summary.value.cashBalance,
    }

    summary.value = normalizeLocalSummary(summary.value)
  }

  // FUNC-037: 파산 신청·포트폴리오 초기화. 성공하면 새 세대(현금 3천만원)로 다시 조회한다.
  // DEV 폴백은 두지 않는다 — 되돌릴 수 없는 파괴적 동작이라 실제 백엔드 없이 "성공한 척"하면 위험하다.
  const resetPortfolio = async () => {
    try {
      await resetPortfolioApi()
      await fetchSummary()
    } catch (err) {
      if (err.status === 429) {
        throw new Error('초기화 횟수 제한에 도달했어요. 잠시 후 다시 시도해주세요.', { cause: err })
      }
      if (err.status === 400) {
        throw new Error('초기화 확인에 실패했어요. 다시 시도해주세요.', { cause: err })
      }
      throw new Error(err.message || '초기화 처리 중 문제가 발생했어요.', { cause: err })
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
    // 홈 위젯 호환용 별칭
    portfolioSummary,
    allocationView,
    totalAssetsDisplay,
    fetchPortfolioSummary,
  }
})
