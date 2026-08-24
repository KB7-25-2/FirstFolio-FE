/**
 * 관리자 기프티콘 상품·코드 관리
 * — GET/POST /admin/gifticons
 * — PATCH /admin/gifticons/{id}
 * — GET/POST /admin/gifticons/{id}/codes
 * — POST /admin/gifticon-codes/{codeId}/void
 */

import { parseApiError } from '@/api/user/errorHandler.js'
import {
  createAdminGifticonCodes,
  createAdminGifticonProduct,
  getAdminGifticonCodes,
  getAdminGifticonProducts,
  patchAdminGifticonProduct,
  voidAdminGifticonCode,
} from '@/api/admin/gifticonApi.js'
import { getCategoryLabel } from '@/mappers/gifticonMapper.js'
import { pickField, unwrapData } from '@/utils/apiMapper.js'

/**
 * @typedef {import('@/types/adminGifticon.js').AdminGifticonProduct} AdminGifticonProduct
 * @typedef {import('@/types/adminGifticon.js').AdminGifticonProductPage} AdminGifticonProductPage
 * @typedef {import('@/types/adminGifticon.js').AdminGifticonProductCreateInput} AdminGifticonProductCreateInput
 * @typedef {import('@/types/adminGifticon.js').AdminGifticonProductPatchInput} AdminGifticonProductPatchInput
 * @typedef {import('@/types/adminGifticon.js').AdminGifticonCode} AdminGifticonCode
 * @typedef {import('@/types/adminGifticon.js').AdminGifticonCodePage} AdminGifticonCodePage
 * @typedef {import('@/types/adminGifticon.js').AdminGifticonCodeCreateItem} AdminGifticonCodeCreateItem
 * @typedef {import('@/types/adminGifticon.js').AdminGifticonCodeBatchResult} AdminGifticonCodeBatchResult
 * @typedef {import('@/types/adminGifticon.js').AdminGifticonCodeVoidResult} AdminGifticonCodeVoidResult
 */

export const ADMIN_GIFTICON_LIST_SIZE = 20
export const ADMIN_GIFTICON_CODE_BATCH_MAX = 100

export const CATEGORY_OPTIONS = [
  { value: 'CAFE', label: '카페' },
  { value: 'DELIVERY', label: '배달' },
  { value: 'CONVENIENCE', label: '편의점' },
]

export const PRODUCT_STATUS_OPTIONS = [
  { value: 'ON_SALE', label: '판매 중' },
  { value: 'STOPPED', label: '판매 중지' },
]

export const CODE_STATUS_OPTIONS = [
  { value: '', label: '전체' },
  { value: 'AVAILABLE', label: '교환 가능' },
  { value: 'ASSIGNED', label: '배정됨' },
  { value: 'VOID', label: '폐기' },
]

export const PRODUCT_STATUS_LABELS = Object.fromEntries(
  PRODUCT_STATUS_OPTIONS.map((opt) => [opt.value, opt.label]),
)

export const CODE_STATUS_LABELS = {
  AVAILABLE: '교환 가능',
  ASSIGNED: '배정됨',
  VOID: '폐기',
}

export const STOCK_STATUS_LABELS = {
  AVAILABLE: '재고 있음',
  SOLD_OUT: '품절',
}

export const categoryLabel = (category) =>
  CATEGORY_OPTIONS.find((opt) => opt.value === category)?.label ??
  getCategoryLabel(category) ??
  category ??
  '—'

const invalidRequest = (message) => {
  const error = new Error(message)
  error.code = 'INVALID_REQUEST'
  error.status = 400
  return error
}

/** @param {unknown} raw @returns {AdminGifticonProduct} */
export const mapAdminGifticonProduct = (raw) => ({
  gifticonProductId: Number(pickField(raw, 'gifticonProductId', 'gifticon_product_id') ?? 0),
  name: String(pickField(raw, 'name') ?? ''),
  brandName: (() => {
    const v = pickField(raw, 'brandName', 'brand_name')
    return v == null ? null : String(v)
  })(),
  category: (() => {
    const v = pickField(raw, 'category')
    return v == null ? null : String(v)
  })(),
  faceValueKrw: Number(pickField(raw, 'faceValueKrw', 'face_value_krw') ?? 0),
  requiredPoints: Number(pickField(raw, 'requiredPoints', 'required_points') ?? 0),
  status: String(pickField(raw, 'status') ?? 'ON_SALE'),
  stockStatus: String(pickField(raw, 'stockStatus', 'stock_status') ?? 'AVAILABLE'),
  availableCodeCount: Number(pickField(raw, 'availableCodeCount', 'available_code_count') ?? 0),
  assignedCodeCount: Number(pickField(raw, 'assignedCodeCount', 'assigned_code_count') ?? 0),
  voidCodeCount: Number(pickField(raw, 'voidCodeCount', 'void_code_count') ?? 0),
  imageUrl: (() => {
    const v = pickField(raw, 'imageUrl', 'image_url')
    return v == null ? null : String(v)
  })(),
  createdAt: pickField(raw, 'createdAt', 'created_at') ?? null,
  updatedAt: pickField(raw, 'updatedAt', 'updated_at') ?? null,
})

/** @param {unknown} data @returns {AdminGifticonProductPage} */
const mapProductPage = (data) => {
  const root = data && typeof data === 'object' ? data : {}
  const items = Array.isArray(root.items) ? root.items : Array.isArray(root) ? root : []
  return {
    items: items.map(mapAdminGifticonProduct),
    nextCursor: pickField(root, 'nextCursor', 'next_cursor') ?? null,
  }
}

/** @param {unknown} raw @returns {AdminGifticonCode} */
export const mapAdminGifticonCode = (raw) => ({
  gifticonCodeId: Number(pickField(raw, 'gifticonCodeId', 'gifticon_code_id') ?? 0),
  gifticonProductId: Number(pickField(raw, 'gifticonProductId', 'gifticon_product_id') ?? 0),
  codeMasked: String(pickField(raw, 'codeMasked', 'code_masked') ?? ''),
  status: String(pickField(raw, 'status') ?? ''),
  expiresAt: pickField(raw, 'expiresAt', 'expires_at') ?? null,
  createdAt: pickField(raw, 'createdAt', 'created_at') ?? null,
})

/** @param {unknown} data @returns {AdminGifticonCodePage} */
const mapCodePage = (data) => {
  const root = data && typeof data === 'object' ? data : {}
  const items = Array.isArray(root.items) ? root.items : Array.isArray(root) ? root : []
  return {
    items: items.map(mapAdminGifticonCode),
    nextCursor: pickField(root, 'nextCursor', 'next_cursor') ?? null,
  }
}

/**
 * @param {AdminGifticonProductCreateInput} input
 * @returns {object}
 */
export const buildProductCreateBody = (input = {}) => {
  const name = String(input.name ?? '').trim()
  const category = String(input.category ?? '').trim()
  const faceValueKrw = Number(input.faceValueKrw)
  const requiredPoints = Number(input.requiredPoints)

  if (!name) throw invalidRequest('상품명(name)은 필수입니다.')
  if (!category) throw invalidRequest('카테고리(category)는 필수입니다.')
  if (!Number.isInteger(faceValueKrw) || faceValueKrw <= 0) {
    throw invalidRequest('액면가(face_value_krw)는 1 이상의 정수여야 합니다.')
  }
  if (!Number.isInteger(requiredPoints) || requiredPoints <= 0) {
    throw invalidRequest('교환 포인트(required_points)는 1 이상의 정수여야 합니다.')
  }

  const body = {
    name,
    category,
    face_value_krw: faceValueKrw,
    required_points: requiredPoints,
    status: input.status ?? 'ON_SALE',
  }

  const brandName = String(input.brandName ?? '').trim()
  if (brandName) body.brand_name = brandName

  const imageUrl = String(input.imageUrl ?? '').trim()
  if (imageUrl) body.image_url = imageUrl

  return body
}

/**
 * @param {AdminGifticonProductPatchInput} input
 * @returns {object}
 */
export const buildProductPatchBody = (input = {}) => {
  const body = {}

  if (input.name !== undefined) {
    const name = String(input.name).trim()
    if (!name) throw invalidRequest('상품명(name)은 비울 수 없습니다.')
    body.name = name
  }
  if (input.brandName !== undefined) {
    body.brand_name = input.brandName == null ? null : String(input.brandName).trim() || null
  }
  if (input.category !== undefined) {
    const category = String(input.category).trim()
    if (!category) throw invalidRequest('카테고리(category)는 비울 수 없습니다.')
    body.category = category
  }
  if (input.faceValueKrw !== undefined) {
    const faceValueKrw = Number(input.faceValueKrw)
    if (!Number.isInteger(faceValueKrw) || faceValueKrw <= 0) {
      throw invalidRequest('액면가(face_value_krw)는 1 이상의 정수여야 합니다.')
    }
    body.face_value_krw = faceValueKrw
  }
  if (input.requiredPoints !== undefined) {
    const requiredPoints = Number(input.requiredPoints)
    if (!Number.isInteger(requiredPoints) || requiredPoints <= 0) {
      throw invalidRequest('교환 포인트(required_points)는 1 이상의 정수여야 합니다.')
    }
    body.required_points = requiredPoints
  }
  if (input.imageUrl !== undefined) {
    body.image_url = input.imageUrl == null ? null : String(input.imageUrl).trim() || null
  }
  if (input.status !== undefined) {
    body.status = input.status
  }

  if (!Object.keys(body).length) {
    throw invalidRequest('수정할 필드가 없습니다.')
  }

  return body
}

/**
 * @param {AdminGifticonCodeCreateItem[]} items
 * @returns {{ items: Array<{ code: string, expires_at: string }> }}
 */
export const buildCodeBatchBody = (items = []) => {
  if (!items.length) throw invalidRequest('등록할 코드가 없습니다.')
  if (items.length > ADMIN_GIFTICON_CODE_BATCH_MAX) {
    throw invalidRequest(`한 번에 최대 ${ADMIN_GIFTICON_CODE_BATCH_MAX}개까지 등록할 수 있습니다.`)
  }

  const mapped = items.map((item, index) => {
    const code = String(item.code ?? '').trim()
    const expiresAt = String(item.expiresAt ?? '').trim()
    if (!code) throw invalidRequest(`${index + 1}번째 코드가 비어 있습니다.`)
    if (!expiresAt)
      throw invalidRequest(`${index + 1}번째 코드의 만료 시각(expires_at)이 필요합니다.`)
    const parsed = new Date(expiresAt)
    if (Number.isNaN(parsed.getTime())) {
      throw invalidRequest(`${index + 1}번째 코드의 만료 시각 형식이 올바르지 않습니다.`)
    }
    return { code, expires_at: parsed.toISOString() }
  })

  return { items: mapped }
}

/**
 * @param {{ status?: string, cursor?: string, size?: number }} [params]
 * @returns {Promise<AdminGifticonProductPage>}
 */
export const fetchAdminGifticonProducts = async (params = {}) => {
  try {
    const response = await getAdminGifticonProducts({
      status: params.status || undefined,
      cursor: params.cursor || undefined,
      size: params.size ?? ADMIN_GIFTICON_LIST_SIZE,
    })
    return mapProductPage(unwrapData(response))
  } catch (error) {
    throw parseApiError(error)
  }
}

/**
 * @param {AdminGifticonProductCreateInput} input
 * @returns {Promise<AdminGifticonProduct>}
 */
export const createAdminGifticonProductService = async (input) => {
  const body = buildProductCreateBody(input)
  try {
    const response = await createAdminGifticonProduct(body)
    return mapAdminGifticonProduct(unwrapData(response))
  } catch (error) {
    throw parseApiError(error)
  }
}

/**
 * @param {number} gifticonProductId
 * @param {AdminGifticonProductPatchInput} input
 * @returns {Promise<AdminGifticonProduct>}
 */
export const updateAdminGifticonProduct = async (gifticonProductId, input) => {
  const body = buildProductPatchBody(input)
  try {
    const response = await patchAdminGifticonProduct(gifticonProductId, body)
    return mapAdminGifticonProduct(unwrapData(response))
  } catch (error) {
    throw parseApiError(error)
  }
}

/**
 * @param {number} gifticonProductId
 * @param {{ status?: string, cursor?: string, size?: number }} [params]
 * @returns {Promise<AdminGifticonCodePage>}
 */
export const fetchAdminGifticonCodes = async (gifticonProductId, params = {}) => {
  try {
    const response = await getAdminGifticonCodes(gifticonProductId, {
      status: params.status || undefined,
      cursor: params.cursor || undefined,
      size: params.size ?? ADMIN_GIFTICON_LIST_SIZE,
    })
    return mapCodePage(unwrapData(response))
  } catch (error) {
    throw parseApiError(error)
  }
}

/**
 * @param {number} gifticonProductId
 * @param {AdminGifticonCodeCreateItem[]} items
 * @returns {Promise<AdminGifticonCodeBatchResult>}
 */
export const registerAdminGifticonCodes = async (gifticonProductId, items) => {
  const body = buildCodeBatchBody(items)
  try {
    const response = await createAdminGifticonCodes(gifticonProductId, body)
    const raw = unwrapData(response)
    const root = raw && typeof raw === 'object' ? raw : {}
    const list = Array.isArray(root.items) ? root.items : []
    return {
      createdCount: Number(pickField(root, 'createdCount', 'created_count') ?? list.length),
      items: list.map(mapAdminGifticonCode),
    }
  } catch (error) {
    throw parseApiError(error)
  }
}

/**
 * @param {number} gifticonCodeId
 * @param {string} [reason]
 * @returns {Promise<AdminGifticonCodeVoidResult>}
 */
export const voidAdminGifticonCodeService = async (gifticonCodeId, reason = '') => {
  try {
    const response = await voidAdminGifticonCode(gifticonCodeId, {
      reason: reason.trim() || undefined,
    })
    const raw = unwrapData(response)
    return {
      gifticonCodeId: Number(
        pickField(raw, 'gifticonCodeId', 'gifticon_code_id') ?? gifticonCodeId,
      ),
      status: String(pickField(raw, 'status') ?? 'VOID'),
    }
  } catch (error) {
    throw parseApiError(error)
  }
}

export const ADMIN_GIFTICON_ERROR_MESSAGES = {
  ADMIN_REQUIRED: '관리자 권한이 필요합니다.',
  GIFTICON_PRODUCT_NOT_FOUND: '기프티콘 상품을 찾을 수 없습니다.',
  GIFTICON_CODE_NOT_FOUND: '기프티콘 코드를 찾을 수 없습니다.',
  GIFTICON_CODE_NOT_VOIDABLE: '폐기할 수 없는 코드입니다. (AVAILABLE만 가능)',
  GIFTICON_CODE_DUPLICATE: '이미 등록된 코드가 포함되어 있습니다.',
  INVALID_REQUEST: '요청 값이 올바르지 않습니다.',
}

export const formatAdminGifticonError = (error) => {
  const beMessage = error?.message || error?.data?.error?.message
  if (error?.code === 'INVALID_REQUEST' && beMessage) return beMessage
  if (error?.code && ADMIN_GIFTICON_ERROR_MESSAGES[error.code]) {
    return ADMIN_GIFTICON_ERROR_MESSAGES[error.code]
  }
  return beMessage || '요청에 실패했습니다.'
}
