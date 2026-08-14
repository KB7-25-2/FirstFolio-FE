import apiClient from '@/api/index.js'

export const getPortfolioSummary = () => apiClient.get('/portfolios/current')

// FUNC-034: 포트폴리오 거래·자산 이벤트 이력 조회.
export const getPortfolioTransactions = (params = {}) =>
  apiClient.get('/portfolios/current/transactions', {
    params: {
      type: params.type,
      cursor: params.cursor,
      size: params.size,
    },
  })

// FUNC-035(2026-08-06 확정): 매수/매도 통합 거래 API.
// - BUY: 전 자산군 공통으로 amount(금액)만 보낸다.
// - SELL 주식·펀드: quantity(수량)만 보낸다.
// - SELL 예·적금·채권: 아무 파라미터도 안 보낸다(product_id만) — 서버가 전액 처리한다.
// amount/quantity는 문서 예시상 문자열이어야 함(부동소수점 오차 방지).
// idempotency_key는 호출마다 달라야 하는 중복 거래 방지 키라 매 호출 시 새로 생성한다.
export const tradePortfolio = ({ transactionType, productId, amount, quantity }) => {
  const body = {
    idempotency_key: `trade-${productId}-${Date.now()}`,
    transaction_type: transactionType,
    product_id: productId,
  }
  if (amount != null) body.amount = Number(amount).toFixed(2)
  if (quantity != null) body.quantity = Number(quantity).toFixed(6)

  return apiClient.post('/portfolios/current/trades', body)
}

// FUNC-031: 선택 가능 모의 상품 조회. params: { assetType, cursor, size }
export const getPurchasableProducts = (params = {}) =>
  apiClient.get('/financial-products', {
    params: {
      asset_type: params.assetType,
      cursor: params.cursor,
      size: params.size,
    },
  })

// FUNC-032: 모의 상품 상세 조회. 목록 API엔 없는 current_price(현재가)가 여기 있다.
export const getFinancialProductDetail = (productId) =>
  apiClient.get(`/financial-products/${productId}`)

// FUNC-037: 파산 신청·포트폴리오 초기화. confirmation은 고정 문구 'RESET_PORTFOLIO'.
export const resetPortfolio = () =>
  apiClient.post('/portfolios/current/reset', {
    confirmation: 'RESET_PORTFOLIO',
    idempotency_key: `reset-${Date.now()}`,
  })
