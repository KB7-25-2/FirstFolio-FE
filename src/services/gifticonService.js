import {
  getGifticons,
  redeemGifticon,
  getRedemptionHistory,
  getGifticonOrderDetail,
} from '@/api/gifticonApi.js'
import {
  mapGifticonsResponse,
  mapRedemptionResult,
  mapRedemptionHistoryResponse,
  mapGifticonOrderDetail,
} from '@/mappers/gifticonMapper.js'
import { applyPointBalanceDelta } from '@/services/userService.js'
import { mockGifticons, mockRedemptionHistory } from '@/mocks/gifticonMock.js'

export const getGifticonList = async (params = {}) => {
  try {
    const { data } = await getGifticons(params)
    return mapGifticonsResponse(data.data ?? data)
  } catch (err) {
    if (!import.meta.env.DEV) throw err
    console.warn('[gifticonService] 상품 목록 API 호출 실패 — 목데이터로 대체합니다.', err)
    return { items: structuredClone(mockGifticons), nextCursor: null }
  }
}

// gifticon을 교환한다. 실패 시(DEV) 재고/판매상태를 먼저 검사하고,
// 포인트 부족을 검사한 뒤, 별개 도메인(userService)의 applyPointBalanceDelta로
// 실제 잔액을 차감한다 — 포인트 잔액의 진짜 소스는 userStore 하나뿐이라 여기서 따로 관리하지 않는다.
export const redeemGifticonService = async ({ gifticon, currentPointBalance }) => {
  const idempotencyKey = `redeem-${gifticon.gifticonId}-${Date.now()}`

  try {
    const { data } = await redeemGifticon(gifticon.gifticonId, idempotencyKey)
    return mapRedemptionResult(data.data ?? data)
  } catch (err) {
    if (!import.meta.env.DEV) throw err
    console.warn('[gifticonService] 교환 API 호출 실패 — 로컬 포인트 차감으로 대체합니다.', err)

    if (!gifticon.isRedeemable) {
      throw new Error('품절되었거나 판매가 중지된 상품이에요.', { cause: err })
    }
    if (gifticon.pricePoints > currentPointBalance) {
      throw new Error('포인트가 부족해요.', { cause: err })
    }

    const { data: profile } = await applyPointBalanceDelta(-gifticon.pricePoints)

    const localOrder = {
      gifticonOrderId: Date.now(),
      gifticonId: gifticon.gifticonId,
      displayName: gifticon.displayName,
      pricePoints: gifticon.pricePoints,
      pointBalance: profile.pointBalance,
      status: 'REQUESTED',
      statusLabel: '교환 신청됨',
      providerReference: null,
      requestedAt: new Date().toISOString(),
      completedAt: null,
    }
    // mockRedemptionHistory는 userService의 MOCK_USER_PROFILE_RESPONSE와 같은 패턴 —
    // 모듈 안 배열을 직접 mutate해서, 다음 fetchRedemptionHistory 호출에도 반영되게 한다.
    mockRedemptionHistory.unshift(localOrder)

    return localOrder
  }
}

export const getRedemptionHistoryList = async (params = {}) => {
  try {
    const { data } = await getRedemptionHistory(params)
    return mapRedemptionHistoryResponse(data.data ?? data)
  } catch (err) {
    if (!import.meta.env.DEV) throw err
    console.warn('[gifticonService] 교환 내역 API 호출 실패 — 목데이터로 대체합니다.', err)
    const items = params.status
      ? mockRedemptionHistory.filter((item) => item.status === params.status)
      : mockRedemptionHistory
    return { items: structuredClone(items), nextCursor: null }
  }
}

export const getGifticonOrderDetailService = async (gifticonOrderId) => {
  try {
    const { data } = await getGifticonOrderDetail(gifticonOrderId)
    return mapGifticonOrderDetail(data.data ?? data)
  } catch (err) {
    if (!import.meta.env.DEV) throw err
    console.warn('[gifticonService] 교환 상세 API 호출 실패 — 목데이터로 대체합니다.', err)
    const fallback = mockRedemptionHistory.find((item) => item.gifticonOrderId === gifticonOrderId)
    return fallback ? structuredClone(fallback) : null
  }
}
