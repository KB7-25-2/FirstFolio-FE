import {
  getPortfolioSummary,
  getPortfolioTransactions,
  tradePortfolio as tradePortfolioApi,
  getPurchasableProducts,
  getFinancialProductDetail,
  resetPortfolio as resetPortfolioApi,
} from '@/api/portfolioApi.js'
import {
  mapPortfolioDetailResponse,
  mapFinancialProductsResponse,
  mapFinancialProductDetail,
  mapTradeResult,
  mapTransactionsResponse,
  normalizeLocalSummary,
} from '@/mappers/portfolioMapper.js'
import { getAssetTypeMeta } from '@/constants/assetType.js'
import { mockPortfolioSummary, mockPurchasableProducts } from '@/mocks/portfolioMock.js'
import {
  INITIAL_SIMULATION_CASH,
  hasGrantedSimulationCash,
  setGrantedSimulationCash,
} from '@/utils/foundationGrant.js'

// ============================================================
// 상품 목록 / 상세 (FUNC-031, FUNC-032)
// ============================================================

/** 기초 수료 직후 지급된 초기 포트폴리오 (DEV mock) */
let mockGrantedPortfolio = null

const buildFreshGrantSummary = () =>
  normalizeLocalSummary({
    totalAssetValue: INITIAL_SIMULATION_CASH,
    cashBalance: INITIAL_SIMULATION_CASH,
    profitLossAmount: 0,
    goalAchievementRate: 0,
    holdings: [],
    aiFeedback: '모의투자금 3천만 원으로 첫 포트폴리오를 구성해 보세요.',
  })

/**
 * 포트폴리오 기초 수료 시 모의투자금 30,000,000원 지급 (목업)
 * @returns {Promise<object>}
 */
export const grantInitialSimulationCash = async () => {
  mockGrantedPortfolio = buildFreshGrantSummary()
  setGrantedSimulationCash(true)
  return structuredClone(mockGrantedPortfolio)
}

/** 테스트·프로필 전환용 */
export const __resetGrantedSimulationCash = () => {
  mockGrantedPortfolio = null
  setGrantedSimulationCash(false)
}
export const getPurchasableProductsList = async (params = {}) => {
  try {
    const { data } = await getPurchasableProducts(params)
    // 응답이 { data: { items, next_cursor } } 형태로 한 번 더 감싸져 있음(FUNC-031 문서 기준)
    return mapFinancialProductsResponse(data.data ?? data)
  } catch (err) {
    if (!import.meta.env.DEV) throw err
    console.warn('[portfolioService] 상품 목록 API 호출 실패 — 목데이터로 대체합니다.', err)
    return { items: structuredClone(mockPurchasableProducts), nextCursor: null }
  }
}

// 구매 모달을 열 때 호출한다. 목록 API엔 가격이 없어서, 확인을 누르기 전에
// 상세 조회로 현재가를 받아와야 정확한 예상 금액을 보여줄 수 있다.
export const getProductDetail = async (productId) => {
  try {
    const { data } = await getFinancialProductDetail(productId)
    return mapFinancialProductDetail(data.data ?? data)
  } catch (err) {
    if (!import.meta.env.DEV) throw err
    console.warn('[portfolioService] 상품 상세 API 호출 실패 — 목데이터 가격으로 대체합니다.', err)
    return mockPurchasableProducts.find((product) => product.productId === productId) ?? null
  }
}

// ============================================================
// 포트폴리오 상세 (FUNC-034)
// ============================================================

// currentSummary를 넘기면, 실패 시(DEV) 이미 로컬 상태가 있는 한 그걸 그대로 유지한다 —
// 안 그러면 탭을 옮길 때마다 방금 한 거래가 원본 목데이터로 리셋돼버린다.
export const getCurrentPortfolio = async ({ productsById = {}, currentSummary = null } = {}) => {
  try {
    const { data } = await getPortfolioSummary()
    return mapPortfolioDetailResponse(data.data ?? data, productsById)
  } catch (err) {
    if (!import.meta.env.DEV) throw err

    if (currentSummary) {
      console.warn(
        '[portfolioService] 포트폴리오 API 호출 실패 — 기존 로컬 상태를 유지합니다.',
        err,
      )
      return currentSummary
    }

    if (mockGrantedPortfolio && hasGrantedSimulationCash()) {
      console.warn('[portfolioService] 기초 수료 지급분 mock 포트폴리오를 사용합니다.', err)
      return structuredClone(mockGrantedPortfolio)
    }

    if (hasGrantedSimulationCash()) {
      mockGrantedPortfolio = buildFreshGrantSummary()
      console.warn('[portfolioService] 기초 수료 지급분 mock 포트폴리오를 사용합니다.', err)
      return structuredClone(mockGrantedPortfolio)
    }

    console.warn('[portfolioService] 포트폴리오 API 호출 실패 — 목데이터로 대체합니다.', err)
    return normalizeLocalSummary(structuredClone(mockPortfolioSummary))
  }
}

// FUNC-034: 거래·자산 이벤트 이력. 목데이터 폴백은 빈 목록으로 — 지어낼 근거가 없다.
export const getPortfolioTransactionsList = async (params = {}) => {
  try {
    const { data } = await getPortfolioTransactions(params)
    return mapTransactionsResponse(data.data ?? data)
  } catch (err) {
    if (!import.meta.env.DEV) throw err
    console.warn('[portfolioService] 거래 이력 API 호출 실패 — 빈 목록으로 대체합니다.', err)
    return { items: [], nextCursor: null }
  }
}

// ============================================================
// 오류 문구 — 코드별로 정리 (FE_CHANGE_GUIDE 3-4)
// ============================================================

const TRADE_ERROR_MESSAGE = {
  INSUFFICIENT_SIMULATION_CASH: '보유 현금이 부족합니다.',
  ACTIVE_PORTFOLIO_NOT_FOUND: '포트폴리오가 없습니다. 기초 과정을 먼저 완료해주세요.',
}

// TRADE_NOT_ALLOWED는 사유가 여러 개(환산 수량 0, 기준 가격 없음, 재매수 차단, 정규장 외 거래 등)라
// 코드 하나로는 못 갈라서, 서버가 준 message를 그대로 보여준다(가이드 3-4 권장 방식).
const toTradeErrorMessage = (err) => TRADE_ERROR_MESSAGE[err.code] ?? err.message

// ============================================================
// 매수/매도 (FUNC-035, 2026-08-06 확정) — 실패 시(DEV) 로컬 시뮬레이션
//
// 매수: 전 자산군 공통으로 amount(금액)만 보낸다.
// 매도 — 주식·펀드(MARKET): quantity(정수 수량)만 보낸다. 부분 매도 가능.
// 매도 — 예·적금·채권(SUBSCRIPTION): 아무 파라미터도 안 보낸다(product_id만) — 서버가 전액 처리.
// ============================================================

// summary를 직접 mutate한다 — 호출부(store)에서 summary.value를 그대로 넘기고,
// 반환값을 다시 summary.value에 대입하는 방식으로 쓴다.
const simulateSell = (currentSummary, holding, quantity) => {
  const meta = getAssetTypeMeta(holding.assetType)
  const isSubscription = meta.tradeType === 'SUBSCRIPTION'

  // 가입형(예·적금·채권)은 quantity를 안 받는다 — 항상 전량.
  const soldQuantity = isSubscription ? holding.quantity : Math.min(quantity, holding.quantity)
  const soldAmount = isSubscription ? holding.valuationAmount : soldQuantity * holding.unitPrice

  holding.quantity -= soldQuantity
  holding.principalAmount -= soldAmount
  holding.valuationAmount -= soldAmount
  currentSummary.cashBalance += soldAmount

  if (isSubscription || holding.quantity <= 0) {
    currentSummary.holdings = currentSummary.holdings.filter(
      (item) => item.holdingId !== holding.holdingId,
    )
  }

  const tradeResult = {
    transactionType: 'SELL',
    productId: holding.productId,
    requestedAmount: soldAmount,
    amount: soldAmount,
    quantity: isSubscription ? null : soldQuantity,
    unitPrice: isSubscription ? null : holding.unitPrice,
    status: 'COMPLETED',
    cashBalance: currentSummary.cashBalance,
  }

  return { summary: normalizeLocalSummary(currentSummary), tradeResult }
}

// 가입형(예·적금·채권)은 이미 보유 중이면 차단(422 TRADE_NOT_ALLOWED와 동일 정책).
// 매수형(주식·펀드)은 수량=내림(amount÷현재가)으로 환산 — 절사분은 현금에 그대로 남는다.
const simulateBuy = (currentSummary, product, amount) => {
  const meta = getAssetTypeMeta(product.assetType)
  const isSubscription = meta.tradeType === 'SUBSCRIPTION'

  const existing = currentSummary.holdings.find((item) => item.productId === product.productId)
  if (isSubscription && existing) {
    throw new Error('이미 가입한 상품이에요. 예·적금·채권은 추가 가입이 안 돼요.')
  }
  if (amount > currentSummary.cashBalance) {
    throw new Error('보유 현금이 부족합니다.')
  }

  const quantity = isSubscription ? 1 : Math.floor(amount / product.unitPrice)
  const filledAmount = isSubscription ? amount : quantity * product.unitPrice

  if (!isSubscription && quantity <= 0) {
    throw new Error('현재가보다 적은 금액으로는 매수할 수 없습니다.')
  }

  currentSummary.cashBalance -= filledAmount

  if (existing) {
    existing.quantity += quantity
    existing.principalAmount += filledAmount
    existing.valuationAmount += filledAmount
  } else {
    currentSummary.holdings.push({
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
      valuationBasis: 'PRINCIPAL',
      isPriceUnavailable: false,
    })
  }

  const tradeResult = {
    transactionType: 'BUY',
    productId: product.productId,
    requestedAmount: amount,
    amount: filledAmount,
    quantity: isSubscription ? null : quantity,
    unitPrice: isSubscription ? null : product.unitPrice,
    status: 'COMPLETED',
    cashBalance: currentSummary.cashBalance,
  }

  return { summary: normalizeLocalSummary(currentSummary), tradeResult }
}

// holdingId 보유 상품을 판매한다. 가입형(예·적금·채권)은 quantity를 무시하고 항상 전량 처리한다.
// 매수형(주식·펀드)은 quantity(정수)만큼만 판매한다.
export const sellHoldingService = async ({
  holdingId,
  quantity,
  currentSummary,
  productsById = {},
}) => {
  const holding = currentSummary?.holdings.find((item) => item.holdingId === holdingId)

  try {
    if (!holding) throw new Error('보유 내역을 찾을 수 없습니다.')
    const meta = getAssetTypeMeta(holding.assetType)
    const isSubscription = meta.tradeType === 'SUBSCRIPTION'

    const { data } = await tradePortfolioApi({
      transactionType: 'SELL',
      productId: holding.productId,
      // 가입형은 quantity를 아예 안 보낸다(보내면 422 TRADE_NOT_ALLOWED).
      quantity: isSubscription ? undefined : quantity,
    })
    const tradeResult = mapTradeResult(data.data ?? data)
    const summary = await getCurrentPortfolio({ productsById, currentSummary })
    return { summary, tradeResult }
  } catch (err) {
    if (!import.meta.env.DEV || !holding) {
      throw new Error(toTradeErrorMessage(err), { cause: err })
    }
    console.warn('[portfolioService] 판매 API 호출 실패 — 로컬 데이터를 직접 갱신합니다.', err)
    return simulateSell(currentSummary, holding, quantity)
  }
}

// product를 amount원만큼 구매한다(전 자산군 공통). 성공하면 최신 포트폴리오 상세를 다시 조회해 함께 반환한다.
export const buyProductService = async ({ product, amount, currentSummary, productsById = {} }) => {
  try {
    const { data } = await tradePortfolioApi({
      transactionType: 'BUY',
      productId: product.productId,
      amount,
    })
    const tradeResult = mapTradeResult(data.data ?? data)
    const summary = await getCurrentPortfolio({ productsById, currentSummary })
    return { summary, tradeResult }
  } catch (err) {
    if (!import.meta.env.DEV) {
      throw new Error(toTradeErrorMessage(err), { cause: err })
    }
    console.warn('[portfolioService] 구매 API 호출 실패 — 로컬 데이터를 직접 갱신합니다.', err)
    return simulateBuy(currentSummary, product, amount)
  }
}

// ============================================================
// 파산 신청·초기화 (FUNC-037)
// ============================================================

// 되돌릴 수 없는 파괴적 동작이라 DEV 폴백은 두지 않는다 — 백엔드 없이 "성공한 척"하면 위험하다.
export const resetPortfolioService = async () => {
  try {
    await resetPortfolioApi()
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
