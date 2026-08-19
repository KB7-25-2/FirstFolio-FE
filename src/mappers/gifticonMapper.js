// 아래 매핑은 전부 실제 BE DTO(GifticonProductListItemResponse/GifticonProductResponse/
// GifticonExchangeResponse/MyGifticonListItemResponse/MyGifticonResponse/
// GifticonCodeDisclosureResponse) 기준이다. 상품에는 status/stock_quantity/valid_until 같은
// 필드가 없고, 주문에도 REQUESTED/SENT/COMPLETED 같은 상태값이 없다 — 교환은 트랜잭션 하나로
// 즉시 완료되고, 이후엔 "코드를 확인했는지(is_disclosed)"만 남는다.

// 상품 재고 상태(stock_status). ON_SALE/STOPPED 같은 판매 상태 개념 자체가 서버에 없다.
const STOCK_STATUS_LABEL = {
  AVAILABLE: '구매 가능',
  SOLD_OUT: '품절',
}

// category enum → 한글 라벨. 문서 예시엔 CAFE만 나와있어 나머지는 추정치.
const CATEGORY_LABEL = {
  CAFE: '카페',
  DELIVERY: '배달',
  CONVENIENCE: '편의점',
}

export const getCategoryLabel = (category) => CATEGORY_LABEL[category] ?? category

// ============================================================
// GET /gifticons — 상품 목록 (GifticonProductPageResponse)
// ============================================================

// 목록 아이템(GifticonProductListItemResponse)엔 point_balance가 없다 — can_exchange는
// 서버가 이미 "재고 있음 && 포인트 충분"까지 계산해서 준 값이라 그대로 신뢰한다.
// 프론트에서 재고 수량이나 포인트 잔액을 다시 비교해 재계산하지 않는다.
export const mapGifticon = (raw) => {
  const isSoldOut = raw.stock_status === 'SOLD_OUT'

  return {
    gifticonId: raw.gifticon_product_id,
    displayName: raw.name,
    brandName: raw.brand_name ?? null,
    category: raw.category ?? null,
    categoryLabel: raw.category ? getCategoryLabel(raw.category) : null,
    imageUrl: raw.image_url ?? null,
    pricePoints: Number(raw.required_points ?? 0),
    faceValueKrw: Number(raw.face_value_krw ?? 0),
    stockStatus: raw.stock_status ?? 'AVAILABLE',
    // 교환 불가 사유를 구분해서 보여줄 수 있게 statusLabel을 재고/포인트 둘로 나눈다.
    statusLabel: isSoldOut
      ? STOCK_STATUS_LABEL.SOLD_OUT
      : raw.can_exchange
        ? STOCK_STATUS_LABEL.AVAILABLE
        : '포인트 부족',
    // 서버가 확정한 값 그대로 — 여기서 재고 수량·유효기간으로 다시 계산하지 않는다.
    isRedeemable: Boolean(raw.can_exchange),
  }
}

export const mapGifticonsResponse = (raw) => ({
  items: (raw.items ?? []).map(mapGifticon),
  nextCursor: raw.next_cursor ?? null,
  // 목록 조회 시점의 사용자 포인트 잔액(페이지 단위로 한 번만 내려온다).
  pointBalance: raw.point_balance != null ? Number(raw.point_balance) : null,
})

// GET /gifticons/{id} — 상품 상세 (GifticonProductResponse). 목록과 달리 point_balance가
// 아이템 자체에 포함되어 있다.
export const mapGifticonDetail = (raw) => ({
  ...mapGifticon(raw),
  pointBalance: raw.point_balance != null ? Number(raw.point_balance) : null,
})

// ============================================================
// POST /gifticon-orders — 교환(구 redeem) 응답 (GifticonExchangeResponse)
// ============================================================

// 교환은 즉시 완료된다 — "신청" 상태로 남는 중간 단계가 없다.
export const mapRedemptionResult = (raw) => ({
  gifticonOrderId: raw.gifticon_order_id,
  gifticonId: raw.gifticon_product_id,
  pricePoints: Number(raw.spent_points ?? 0),
  pointBalance: raw.point_balance != null ? Number(raw.point_balance) : null,
  completedAt: raw.completed_at ?? null,
  // 같은 Idempotency-Key로 재요청해서 원래 있던 주문을 그대로 돌려받은 경우.
  isIdempotentReplay: Boolean(raw.idempotent_replay),
})

// ============================================================
// GET /gifticon-orders — 내 교환 목록 (MyGifticonListItemResponse)
// ============================================================

// 주문 자체엔 상태 필드가 없다. "코드를 확인했는지(isDisclosed)"와 만료 여부로
// 화면에 보여줄 상태를 프론트에서 조합한다.
const deriveOrderStatus = (expiresAt, isDisclosed) => {
  const isExpired = expiresAt != null && new Date(expiresAt) < new Date()
  if (isExpired) return { status: 'EXPIRED', statusLabel: '기간 만료' }
  if (isDisclosed) return { status: 'DISCLOSED', statusLabel: '코드 확인 완료' }
  return { status: 'UNDISCLOSED', statusLabel: '코드 확인 전' }
}

export const mapRedemptionHistoryItem = (raw) => {
  const { status, statusLabel } = deriveOrderStatus(raw.expires_at, raw.is_disclosed)

  return {
    gifticonOrderId: raw.gifticon_order_id,
    gifticonId: raw.gifticon_product_id,
    brandName: raw.brand_name ?? null,
    displayName: raw.product_name,
    pricePoints: Number(raw.spent_points ?? 0),
    codeMasked: raw.code_masked ?? null,
    expiresAt: raw.expires_at ?? null,
    isDisclosed: Boolean(raw.is_disclosed),
    status,
    statusLabel,
    completedAt: raw.completed_at ?? null,
  }
}

export const mapRedemptionHistoryResponse = (raw) => ({
  items: (raw.items ?? []).map(mapRedemptionHistoryItem),
  nextCursor: raw.next_cursor ?? null,
})

// ============================================================
// GET /gifticon-orders/{id} — 내 교환 상세 (MyGifticonResponse)
// ============================================================

// 목록엔 없는 category/face_value_krw/image_url/first_disclosed_at을 포함한다.
// provider_reference, delivery_info 같은 필드는 어떤 API 응답에도 없다 — 배송 개념 자체가 없다.
export const mapGifticonOrderDetail = (raw) => {
  const { status, statusLabel } = deriveOrderStatus(raw.expires_at, raw.first_disclosed_at != null)

  return {
    gifticonOrderId: raw.gifticon_order_id,
    gifticonId: raw.gifticon_product_id,
    brandName: raw.brand_name ?? null,
    displayName: raw.product_name,
    category: raw.category ?? null,
    categoryLabel: raw.category ? getCategoryLabel(raw.category) : null,
    faceValueKrw: Number(raw.face_value_krw ?? 0),
    pricePoints: Number(raw.spent_points ?? 0),
    imageUrl: raw.image_url ?? null,
    codeMasked: raw.code_masked ?? null,
    expiresAt: raw.expires_at ?? null,
    firstDisclosedAt: raw.first_disclosed_at ?? null,
    isDisclosed: raw.first_disclosed_at != null,
    status,
    statusLabel,
    completedAt: raw.completed_at ?? null,
  }
}

// ============================================================
// POST /gifticon-orders/{id}/disclosures — 코드 공개 (GifticonCodeDisclosureResponse)
// ============================================================

// code는 표시/보관용 원문, barcodeValue는 CODE_128 바코드 렌더링용 정규화된 값이다.
// 응답 자체가 민감정보라 프론트에서도 캐시하지 말고 화면에만 잠깐 띄워야 한다.
export const mapGifticonDisclosure = (raw) => ({
  gifticonOrderId: raw.gifticon_order_id,
  code: raw.code,
  barcodeValue: raw.barcode_value,
  barcodeFormat: raw.barcode_format,
  expiresAt: raw.expires_at ?? null,
  isExpired: Boolean(raw.is_expired),
  firstDisclosedAt: raw.first_disclosed_at ?? null,
})
