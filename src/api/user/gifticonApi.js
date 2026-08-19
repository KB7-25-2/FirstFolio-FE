import apiClient from '@/api/index.js'

// 아래 경로는 전부 GifticonController(BE) 기준으로 확정된 경로다.
// - GET  /gifticons                              상품 목록
// - POST /gifticon-orders                        포인트 교환(구 "redeem"). 멱등키는 body가 아니라
//                                                 Idempotency-Key 헤더로 보낸다.
// - GET  /gifticon-orders                        내 교환 목록. status 필터는 서버가 지원하지 않는다
//                                                 (cursor/size만 받음) — 상태 구분은 프론트에서
//                                                 is_disclosed/expires_at으로 직접 계산해야 한다.
// - GET  /gifticon-orders/{id}                   내 교환 상세
// - POST /gifticon-orders/{id}/disclosures       실제 코드(바코드) 공개.

export const getGifticons = (params = {}) =>
  apiClient.get('/gifticons', {
    params: {
      category: params.category,
      cursor: params.cursor,
      size: params.size,
    },
  })

// 교환은 상품별 하위 경로가 아니라 /gifticon-orders 컬렉션에 생성하는 방식이다.
// idempotencyKey는 사용자 범위 멱등 키로, 반드시 Idempotency-Key 헤더에 실어야 한다
// (body에 넣으면 서버가 못 읽는다).
export const redeemGifticon = (gifticonProductId, idempotencyKey) =>
  apiClient.post(
    '/gifticon-orders',
    { gifticon_product_id: gifticonProductId },
    { headers: { 'Idempotency-Key': idempotencyKey } },
  )

export const getRedemptionHistory = (params = {}) =>
  apiClient.get('/gifticon-orders', {
    params: {
      cursor: params.cursor,
      size: params.size,
    },
  })

export const getGifticonOrderDetail = (gifticonOrderId) =>
  apiClient.get(`/gifticon-orders/${gifticonOrderId}`)

// 주문을 확인한 뒤 실제 코드를 복호화해 받아온다. 최초 호출 시 first_disclosed_at이 기록되고,
// 이후 호출은 같은 코드를 다시 보여주면서 접근 이력만 남긴다(재발급이 아니다).
export const discloseGifticonCode = (gifticonOrderId) =>
  apiClient.post(`/gifticon-orders/${gifticonOrderId}/disclosures`)
