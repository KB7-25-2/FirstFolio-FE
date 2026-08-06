// GET /gifticons(사용자용) 문서 기준. category/image_url 실제 응답에 존재 확인됨.

const STATUS_LABEL = {
  ON_SALE: '판매중',
  SOLD_OUT: '품절',
  STOPPED: '판매중지',
}

export const getStatusLabel = (status) => STATUS_LABEL[status] ?? status

// 기프티콘 주문(gifticon_order) 상태. /admin/gifticon-orders/{id}/status 문서 기준
// REQUESTED → SENT → COMPLETED 순서로만 전이된다(취소/환불 상태 전이는 미지원).
const ORDER_STATUS_LABEL = {
  REQUESTED: '교환 신청됨',
  SENT: '발송됨',
  COMPLETED: '수령 완료',
}

export const getOrderStatusLabel = (status) => ORDER_STATUS_LABEL[status] ?? status

// category enum → 한글 라벨. 문서 예시엔 CAFE만 나와있어 나머지는 추정치.
const CATEGORY_LABEL = {
  CAFE: '카페',
  DELIVERY: '배달',
  CONVENIENCE: '편의점',
}

export const getCategoryLabel = (category) => CATEGORY_LABEL[category] ?? category

export const mapGifticon = (raw) => {
  const isExpired = raw.valid_until != null && new Date(raw.valid_until) < new Date()

  return {
    gifticonId: raw.gifticon_product_id,
    displayName: raw.name,
    category: raw.category ?? null,
    categoryLabel: raw.category ? getCategoryLabel(raw.category) : null,
    imageUrl: raw.image_url ?? null,
    pricePoints: Number(raw.required_points ?? 0),
    stockQuantity: raw.stock_quantity != null ? Number(raw.stock_quantity) : null,
    status: raw.status ?? 'ON_SALE',
    statusLabel: getStatusLabel(raw.status ?? 'ON_SALE'),
    validUntil: raw.valid_until ?? null,
    isExpired,
    // 품절(재고 0), 판매중지, 유효기간 만료면 교환 불가.
    isRedeemable:
      (raw.status ?? 'ON_SALE') === 'ON_SALE' && (raw.stock_quantity ?? 1) > 0 && !isExpired,
  }
}

export const mapGifticonsResponse = (raw) => ({
  items: (raw.items ?? []).map(mapGifticon),
  nextCursor: raw.next_cursor ?? null,
})

// /admin/gifticon-orders/{id}/status 문서 기준 실제 엔티티명은 "gifticon_order".
// 교환 신청 직후엔 REQUESTED(대기)이지 COMPLETED가 아니다 — 관리자가 SENT→COMPLETED로 전환한다.
export const mapRedemptionResult = (raw) => ({
  gifticonOrderId: raw.gifticon_order_id,
  gifticonId: raw.gifticon_product_id,
  pricePoints: Number(raw.required_points ?? 0),
  pointBalance: raw.point_balance != null ? Number(raw.point_balance) : null,
  status: raw.status ?? 'REQUESTED',
  statusLabel: getOrderStatusLabel(raw.status ?? 'REQUESTED'),
  redeemedAt: raw.redeemed_at ?? null,
})

// GET /gifticon-orders 응답 필드명 기준. 목록 API(gifticon_product_id, required_points 등)와
// 필드명이 다르다 — 여긴 gifticon_order_id/product_name/requested_at/completed_at만 준다.
export const mapRedemptionHistoryItem = (raw) => ({
  gifticonOrderId: raw.gifticon_order_id,
  displayName: raw.product_name,
  status: raw.status,
  statusLabel: getOrderStatusLabel(raw.status),
  requestedAt: raw.requested_at ?? null,
  completedAt: raw.completed_at ?? null,
})

export const mapRedemptionHistoryResponse = (raw) => ({
  items: (raw.items ?? []).map(mapRedemptionHistoryItem),
  nextCursor: raw.next_cursor ?? null,
})

// GET /gifticon-orders/{id} 응답 — 목록엔 없는 spent_points/provider_reference/gifticon_product_id 포함.
// ERD엔 point_transaction_id, delivery_info 컬럼도 있지만 어떤 API 응답에도 아직 노출 안 됨 — TODO.
export const mapGifticonOrderDetail = (raw) => ({
  gifticonOrderId: raw.gifticon_order_id,
  gifticonId: raw.gifticon_product_id,
  displayName: raw.product_name,
  pricePoints: Number(raw.spent_points ?? 0),
  status: raw.status,
  statusLabel: getOrderStatusLabel(raw.status),
  providerReference: raw.provider_reference ?? null,
  requestedAt: raw.requested_at ?? null,
  completedAt: raw.completed_at ?? null,
})
