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
} from '@/mappers/portfolioMapper.js'
import { getAssetTypeMeta } from '@/constants/assetType.js'

// ============================================================
// 상품 목록 / 상세 (FUNC-031, FUNC-032)
// ============================================================

export const getPurchasableProductsList = async (params = {}) => {
  const { data } = await getPurchasableProducts(params)
  // 응답이 { data: { items, next_cursor } } 형태로 한 번 더 감싸져 있음(FUNC-031 문서 기준)
  return mapFinancialProductsResponse(data.data ?? data)
}

// 구매 모달을 열 때 호출한다. 목록 API엔 가격이 없어서, 확인을 누르기 전에
// 상세 조회로 현재가를 받아와야 정확한 예상 금액을 보여줄 수 있다.
export const getProductDetail = async (productId) => {
  const { data } = await getFinancialProductDetail(productId)
  return mapFinancialProductDetail(data.data ?? data)
}

// ============================================================
// 포트폴리오 상세 (FUNC-034)
// ============================================================

export const getCurrentPortfolio = async ({ productsById = {} } = {}) => {
  const { data } = await getPortfolioSummary()
  return mapPortfolioDetailResponse(data.data ?? data, productsById)
}

// FUNC-034: 거래·자산 이벤트 이력.
export const getPortfolioTransactionsList = async (params = {}) => {
  const { data } = await getPortfolioTransactions(params)
  return mapTransactionsResponse(data.data ?? data)
}

// ============================================================
// 오류 문구 — 코드별로 정리 (FE_CHANGE_GUIDE 3-4)
// ============================================================

const TRADE_ERROR_MESSAGE = {
  // 2026-08-12: 수수료·증권거래세가 실제로 붙으면서 "잔액을 정확히 다 넣는" 매수도
  // 수수료분만큼 모자라 이 코드로 거부될 수 있다(오류 코드 자체는 기존과 동일).
  INSUFFICIENT_SIMULATION_CASH: '보유 현금이 부족합니다. 매수는 수수료가 별도로 붙어요.',
  ACTIVE_PORTFOLIO_NOT_FOUND: '포트폴리오가 없습니다. 기초 과정을 먼저 완료해주세요.',
}

// TRADE_NOT_ALLOWED는 사유가 여러 개(환산 수량 0, 기준 가격 없음, 재매수 차단, 정규장 외 거래 등)라
// 코드 하나로는 못 갈라서, 서버가 준 message를 그대로 보여준다(가이드 3-4 권장 방식).
const toTradeErrorMessage = (err) => TRADE_ERROR_MESSAGE[err.code] ?? err.message

// ============================================================
// 매수/매도 (FUNC-035, 2026-08-06 확정, 2026-08-12 비용 반영)
//
// 매수: 전 자산군 공통으로 amount(금액)만 보낸다.
// 매도 — 주식·펀드(MARKET): quantity(정수 수량)만 보낸다. 부분 매도 가능.
// 매도 — 예·적금·채권(SUBSCRIPTION): 아무 파라미터도 안 보낸다(product_id만) — 서버가 전액 처리.
// ============================================================

// holdingId 보유 상품을 판매한다. 가입형(예·적금·채권)은 quantity를 무시하고 항상 전량 처리한다.
// 매수형(주식·펀드)은 quantity(정수)만큼만 판매한다.
export const sellHoldingService = async ({
  holdingId,
  quantity,
  currentSummary,
  productsById = {},
}) => {
  const holding = currentSummary?.holdings.find((item) => item.holdingId === holdingId)
  if (!holding) throw new Error('보유 내역을 찾을 수 없습니다.')

  const meta = getAssetTypeMeta(holding.assetType)
  const isSubscription = meta.tradeType === 'SUBSCRIPTION'

  try {
    const { data } = await tradePortfolioApi({
      transactionType: 'SELL',
      productId: holding.productId,
      // 가입형은 quantity를 아예 안 보낸다(보내면 422 TRADE_NOT_ALLOWED).
      quantity: isSubscription ? undefined : quantity,
    })
    const tradeResult = mapTradeResult(data.data ?? data)
    const summary = await getCurrentPortfolio({ productsById })
    return { summary, tradeResult }
  } catch (err) {
    throw new Error(toTradeErrorMessage(err), { cause: err })
  }
}

// product를 amount원만큼 구매한다(전 자산군 공통). 성공하면 최신 포트폴리오 상세를 다시 조회해 함께 반환한다.
export const buyProductService = async ({ product, amount, productsById = {} }) => {
  try {
    const { data } = await tradePortfolioApi({
      transactionType: 'BUY',
      productId: product.productId,
      amount,
    })
    const tradeResult = mapTradeResult(data.data ?? data)
    const summary = await getCurrentPortfolio({ productsById })
    return { summary, tradeResult }
  } catch (err) {
    throw new Error(toTradeErrorMessage(err), { cause: err })
  }
}

// ============================================================
// 파산 신청·초기화 (FUNC-037)
// ============================================================

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
