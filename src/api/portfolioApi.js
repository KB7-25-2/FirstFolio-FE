import apiClient from '@/api/index.js'

export const getPortfolioSummary = () => apiClient.get('/portfolios/current')

// FUNC-035(개정): 매수/매도 통합 거래 API. transactionType: 'BUY' | 'SELL'.
// quantity가 아니라 amount(금액) 기반으로 바뀜(API 변경 제안 반영, 2026-08-05).
// - 가입형(예·적금, 채권): amount가 그대로 원금이 됨. 이미 보유 중이면 422 TRADE_NOT_ALLOWED.
// - 매수형(주식, 펀드): 서버가 수량=내림(amount÷현재가)으로 환산, 응답의 requested_amount와
//   실제 체결 amount가 다를 수 있음(단수 절사분은 현금에 남음).
// amount는 문서 예시상 "5000000.00" 형태의 문자열로 전송해야 함(부동소수점 오차 방지).
// idempotency_key는 호출마다 달라야 하는 중복 거래 방지 키라 매 호출 시 새로 생성한다.
export const tradePortfolio = (transactionType, productId, amount) =>
  apiClient.post('/portfolios/current/trades', {
    idempotency_key: `trade-${productId}-${Date.now()}`,
    transaction_type: transactionType,
    product_id: productId,
    amount: Number(amount).toFixed(2),
  })

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
