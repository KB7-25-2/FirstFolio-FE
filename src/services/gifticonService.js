import {
  getGifticons,
  redeemGifticon,
  getRedemptionHistory,
  getGifticonOrderDetail,
  discloseGifticonCode,
} from '@/api/user/gifticonApi.js'
import { ApiError } from '@/api/user/errorHandler.js'
import {
  mapGifticonsResponse,
  mapRedemptionResult,
  mapRedemptionHistoryResponse,
  mapGifticonOrderDetail,
  mapGifticonDisclosure,
} from '@/mappers/gifticonMapper.js'

const GIFTICON_ERROR_MESSAGES = {
  INVALID_REQUEST: '교환 요청이 올바르지 않아요. 다시 시도해주세요.',
  GIFTICON_PRODUCT_NOT_FOUND: '기프티콘 상품을 찾을 수 없어요.',
  GIFTICON_NOT_ON_SALE: '현재 판매 중이 아닌 상품이에요.',
  GIFTICON_PRICE_CHANGED: '교환 포인트가 변경됐어요. 상품 정보를 다시 확인해주세요.',
  GIFTICON_SOLD_OUT: '품절된 상품이에요.',
  INSUFFICIENT_POINTS: '포인트가 부족해요.',
  IDEMPOTENCY_CONFLICT: '같은 요청이 이미 처리 중이거나 다른 내용으로 재시도됐어요.',
}

export class GifticonApiError extends Error {
  /**
   * @param {string} code
   * @param {string} message
   * @param {number} [status=400]
   */
  constructor(code, message, status = 400) {
    super(message)
    this.name = 'GifticonApiError'
    this.code = code
    this.status = status
  }
}

/**
 * @param {unknown} error
 * @param {string} fallbackCode
 * @param {string} fallbackMessage
 * @returns {GifticonApiError}
 */
const mapGifticonError = (error, fallbackCode, fallbackMessage) => {
  if (error instanceof GifticonApiError) return error

  if (error instanceof ApiError) {
    const code = error.code ?? fallbackCode
    return new GifticonApiError(
      code,
      GIFTICON_ERROR_MESSAGES[code] ?? error.message ?? fallbackMessage,
      error.status,
    )
  }

  if (error && typeof error === 'object' && 'code' in error && 'message' in error) {
    const code = /** @type {{ code: string, message: string, status?: number }} */ (error).code
    return new GifticonApiError(
      code,
      GIFTICON_ERROR_MESSAGES[code] ?? /** @type {{ message: string }} */ (error).message,
      /** @type {{ status?: number }} */ (error).status ?? 400,
    )
  }

  return new GifticonApiError(fallbackCode, fallbackMessage, 500)
}

/** 멱등 키 최대 100자 (서버 검증과 동일) */
const buildRedeemIdempotencyKey = (gifticonId, expectedRequiredPoints) => {
  const uuid =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  return `redeem:${gifticonId}:${expectedRequiredPoints}:${uuid}`.slice(0, 100)
}

export const getGifticonList = async (params = {}) => {
  const { data } = await getGifticons(params)
  return mapGifticonsResponse(data.data ?? data)
}

// gifticon을 교환한다. POST /gifticon-orders는 즉시 완료 처리되므로(대기 상태 없음),
// 성공하면 spent_points·point_balance가 채워진 최종 주문을 돌려받는다.
// expected_required_points는 화면에서 본 pricePoints(required_points)를 그대로 보낸다 —
// 서버 현재가와 불일치하면 차감 없이 GIFTICON_PRICE_CHANGED로 거절된다.
export const redeemGifticonService = async ({ gifticon, currentPointBalance }) => {
  const expectedRequiredPoints = Number(gifticon.pricePoints)

  if (!gifticon.isRedeemable) {
    throw new GifticonApiError('GIFTICON_SOLD_OUT', GIFTICON_ERROR_MESSAGES.GIFTICON_SOLD_OUT, 409)
  }
  if (!Number.isInteger(expectedRequiredPoints) || expectedRequiredPoints <= 0) {
    throw new GifticonApiError('INVALID_REQUEST', GIFTICON_ERROR_MESSAGES.INVALID_REQUEST, 400)
  }
  if (expectedRequiredPoints > currentPointBalance) {
    throw new GifticonApiError(
      'INSUFFICIENT_POINTS',
      GIFTICON_ERROR_MESSAGES.INSUFFICIENT_POINTS,
      422,
    )
  }

  const idempotencyKey = buildRedeemIdempotencyKey(gifticon.gifticonId, expectedRequiredPoints)

  try {
    const { data } = await redeemGifticon({
      gifticonProductId: gifticon.gifticonId,
      expectedRequiredPoints,
      idempotencyKey,
    })
    return mapRedemptionResult(data.data ?? data)
  } catch (error) {
    throw mapGifticonError(
      error,
      'INVALID_REQUEST',
      '교환 처리 중 문제가 발생했어요. 다시 시도해주세요.',
    )
  }
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
