import apiClient from '@/api/index.js'

// FUNC(기프티콘 상품 조회): GET /gifticons — 경로 확정됨.
// FUNC(기프티콘 교환 목록 조회): GET /gifticon-orders — 경로 확정됨.
// FUNC(기프티콘 교환 상세 조회): GET /gifticon-orders/{id} — 경로 확정됨.
// 교환 신청(redeem) 엔드포인트는 아직 문서 없어 이 경로 패턴을 참고한 추정치.

export const getGifticons = (params = {}) =>
  apiClient.get('/gifticons', {
    params: {
      category: params.category,
      cursor: params.cursor,
      size: params.size,
    },
  })

export const redeemGifticon = (gifticonId, idempotencyKey) =>
  apiClient.post(`/gifticons/${gifticonId}/redeem`, {
    idempotency_key: idempotencyKey,
  })

export const getRedemptionHistory = (params = {}) =>
  apiClient.get('/gifticon-orders', {
    params: {
      status: params.status,
      cursor: params.cursor,
    },
  })

export const getGifticonOrderDetail = (gifticonOrderId) =>
  apiClient.get(`/gifticon-orders/${gifticonOrderId}`)
