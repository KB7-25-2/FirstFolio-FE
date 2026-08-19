import {
  getGifticons,
  redeemGifticon,
  getRedemptionHistory,
  getGifticonOrderDetail,
  discloseGifticonCode,
} from '@/api/user/gifticonApi.js'
import {
  mapGifticonsResponse,
  mapRedemptionResult,
  mapRedemptionHistoryResponse,
  mapGifticonOrderDetail,
  mapGifticonDisclosure,
} from '@/mappers/gifticonMapper.js'

export const getGifticonList = async (params = {}) => {
  const { data } = await getGifticons(params)
  return mapGifticonsResponse(data.data ?? data)
}

// gifticon을 교환한다. POST /gifticon-orders는 즉시 완료 처리되므로(대기 상태 없음),
// 성공하면 바로 codeMasked/expiresAt이 채워진 최종 주문을 돌려받는다.
export const redeemGifticonService = async ({ gifticon, currentPointBalance }) => {
  const idempotencyKey = `redeem-${gifticon.gifticonId}-${Date.now()}`

  if (!gifticon.isRedeemable) {
    throw new Error('품절되었거나 포인트가 부족한 상품이에요.')
  }
  if (gifticon.pricePoints > currentPointBalance) {
    throw new Error('포인트가 부족해요.')
  }

  const { data } = await redeemGifticon(gifticon.gifticonId, idempotencyKey)
  return mapRedemptionResult(data.data ?? data)
}

export const getRedemptionHistoryList = async (params = {}) => {
  const { data } = await getRedemptionHistory(params)
  return mapRedemptionHistoryResponse(data.data ?? data)
}

export const getGifticonOrderDetailService = async (gifticonOrderId) => {
  const { data } = await getGifticonOrderDetail(gifticonOrderId)
  return mapGifticonOrderDetail(data.data ?? data)
}

// 교환내역 상세에서 "코드 확인" 버튼을 눌렀을 때 호출한다. 민감정보라 스토어에 오래 남기지 않고
// 호출한 화면에서만 잠깐 보여주는 용도로 쓴다.
export const discloseGifticonCodeService = async (gifticonOrderId) => {
  const { data } = await discloseGifticonCode(gifticonOrderId)
  return mapGifticonDisclosure(data.data ?? data)
}
