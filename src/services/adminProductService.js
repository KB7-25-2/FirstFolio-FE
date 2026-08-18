/**
 * 관리자 모의 금융상품 서비스
 * — GET /admin/financial-products (asset_type, status, cursor, size)
 * — POST /admin/financial-products/imports
 * — PATCH /admin/financial-products/{product_id}
 */

import { parseApiError } from '@/api/user/errorHandler.js'
import {
  getAdminFinancialProducts,
  importAdminFinancialProducts,
  patchAdminFinancialProduct,
} from '@/api/admin/productApi.js'
import { pickField, unwrapData } from '@/utils/apiMapper.js'

/**
 * @typedef {import('@/types/adminProduct.js').AdminProduct} AdminProduct
 * @typedef {import('@/types/adminProduct.js').AdminProductPage} AdminProductPage
 * @typedef {import('@/types/adminProduct.js').AdminProductImportResult} AdminProductImportResult
 * @typedef {import('@/types/adminProduct.js').AdminProductAssetType} AdminProductAssetType
 * @typedef {import('@/types/adminProduct.js').AdminProductStatus} AdminProductStatus
 * @typedef {import('@/types/adminProduct.js').AdminProductRiskLevel} AdminProductRiskLevel
 */

/** @param {unknown} raw @returns {AdminProduct} */
export const mapAdminProduct = (raw) => ({
  productId: Number(pickField(raw, 'productId', 'product_id')),
  displayName: String(pickField(raw, 'displayName', 'display_name') ?? ''),
  assetType: /** @type {AdminProductAssetType | string} */ (
    pickField(raw, 'assetType', 'asset_type') ?? ''
  ),
  description: (() => {
    const v = pickField(raw, 'description')
    return v == null ? null : String(v)
  })(),
  riskLevel: (() => {
    const v = pickField(raw, 'riskLevel', 'risk_level')
    return v == null ? null : String(v)
  })(),
  sourceProvider: (() => {
    const v = pickField(raw, 'sourceProvider', 'source_provider')
    return v == null ? null : String(v)
  })(),
  sourceProductCode: (() => {
    const v = pickField(raw, 'sourceProductCode', 'source_product_code')
    return v == null ? null : String(v)
  })(),
  sourceProductName: (() => {
    const v = pickField(raw, 'sourceProductName', 'source_product_name')
    return v == null ? null : String(v)
  })(),
  sourceReferenceAt: pickField(raw, 'sourceReferenceAt', 'source_reference_at') ?? null,
  realTerms: pickField(raw, 'realTerms', 'real_terms') ?? null,
  simulationTerms: pickField(raw, 'simulationTerms', 'simulation_terms') ?? null,
  status: /** @type {AdminProductStatus | string} */ (pickField(raw, 'status') ?? 'INACTIVE'),
})

/** @param {unknown} data @returns {AdminProductPage} */
const mapPage = (data) => {
  const root = data && typeof data === 'object' ? data : {}
  const items = Array.isArray(root.items) ? root.items : Array.isArray(root) ? root : []
  return {
    items: items.map(mapAdminProduct),
    nextCursor: pickField(root, 'nextCursor', 'next_cursor') ?? null,
  }
}

/** @param {unknown} raw @returns {AdminProductImportResult} */
const mapImportResult = (raw) => {
  const root = raw && typeof raw === 'object' ? raw : {}
  const ids = pickField(root, 'productIds', 'product_ids')
  return {
    importedCount: Number(pickField(root, 'importedCount', 'imported_count') ?? 0),
    skippedCount: Number(pickField(root, 'skippedCount', 'skipped_count') ?? 0),
    productIds: Array.isArray(ids) ? ids.map(Number) : [],
    referenceAt: pickField(root, 'referenceAt', 'reference_at') ?? null,
  }
}

/**
 * GET /admin/financial-products
 * @param {{
 *   assetType?: AdminProductAssetType | '',
 *   status?: AdminProductStatus | '',
 *   cursor?: string | null,
 *   size?: number,
 * }} [filters]
 * @returns {Promise<AdminProductPage>}
 */
export const fetchAdminProducts = async (filters = {}) => {
  const params = {}
  if (filters.assetType) params.asset_type = filters.assetType
  if (filters.status) params.status = filters.status
  if (filters.cursor) params.cursor = filters.cursor
  if (filters.size != null) params.size = filters.size

  try {
    const response = await getAdminFinancialProducts(params)
    return mapPage(unwrapData(response))
  } catch (error) {
    throw parseApiError(error)
  }
}

/**
 * 목록에서 productId로 상세를 고른다 (관리자 단건 GET은 OpenAPI에 없음).
 * @param {number} productId
 * @param {AdminProduct[]} [knownItems]
 * @returns {Promise<AdminProduct>}
 */
export const fetchAdminProductDetail = async (productId, knownItems = []) => {
  const hit = knownItems.find((item) => item.productId === Number(productId))
  if (hit) return hit

  let cursor = null
  for (let page = 0; page < 20; page += 1) {
    const result = await fetchAdminProducts({ cursor, size: 50 })
    const found = result.items.find((item) => item.productId === Number(productId))
    if (found) return found
    if (!result.nextCursor) break
    cursor = result.nextCursor
  }

  const err = new Error('상품을 찾을 수 없습니다.')
  err.code = 'PRODUCT_NOT_FOUND'
  err.status = 404
  throw err
}

/**
 * POST /admin/financial-products/imports
 * @param {{ sourceProvider: string, referenceAt?: string | null }} payload
 * @returns {Promise<AdminProductImportResult>}
 */
export const importAdminProducts = async (payload) => {
  // Live DTO: source_provider, reference_at (OpenAPI camelCase와 불일치)
  const body = {
    source_provider: String(payload.sourceProvider || '').trim(),
  }
  if (payload.referenceAt) body.reference_at = payload.referenceAt

  try {
    const response = await importAdminFinancialProducts(body)
    return mapImportResult(unwrapData(response))
  } catch (error) {
    throw parseApiError(error)
  }
}

/**
 * PATCH /admin/financial-products/{productId}
 * @param {number} productId
 * @param {{
 *   displayName?: string,
 *   description?: string | null,
 *   riskLevel?: string | null,
 *   simulationTerms?: object | null,
 *   status?: AdminProductStatus | string,
 * }} payload
 * @returns {Promise<AdminProduct>}
 */
export const updateAdminProduct = async (productId, payload) => {
  // Live 요청은 snake_case (ProductImportRequest와 동일 패턴)
  const body = {}
  if (payload.displayName !== undefined) body.display_name = payload.displayName
  if (payload.description !== undefined) body.description = payload.description
  if (payload.riskLevel !== undefined) body.risk_level = payload.riskLevel
  if (payload.simulationTerms !== undefined) body.simulation_terms = payload.simulationTerms
  if (payload.status !== undefined) body.status = payload.status

  try {
    const response = await patchAdminFinancialProduct(productId, body)
    return mapAdminProduct(unwrapData(response))
  } catch (error) {
    throw parseApiError(error)
  }
}

export const ASSET_TYPE_OPTIONS = [
  { value: 'DEPOSIT_SAVINGS', label: '예·적금' },
  { value: 'BOND', label: '채권' },
  { value: 'STOCK', label: '주식' },
  { value: 'FUND', label: '펀드' },
]

export const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: '공개' },
  { value: 'INACTIVE', label: '비공개' },
]

export const RISK_LEVEL_OPTIONS = [
  { value: 'LOW', label: '저위험' },
  { value: 'MEDIUM', label: '중위험' },
  { value: 'HIGH', label: '고위험' },
]

export const SOURCE_PROVIDER_OPTIONS = [
  { value: 'FSS_FINLIFE', label: '금융감독원 FinLife' },
  { value: 'DATA_GO_KR_BOND', label: '공공데이터 채권' },
  { value: 'DATA_GO_KR_ETF', label: '공공데이터 ETF' },
  { value: 'TOSSINVEST', label: '토스증권' },
]

export const STATUS_LABELS = Object.fromEntries(STATUS_OPTIONS.map((o) => [o.value, o.label]))

export const RISK_LEVEL_LABELS = Object.fromEntries(
  RISK_LEVEL_OPTIONS.map((o) => [o.value, o.label]),
)

export const assetTypeLabel = (assetType) =>
  ASSET_TYPE_OPTIONS.find((o) => o.value === assetType)?.label ?? assetType ?? '—'

export const ADMIN_PRODUCT_ERROR_MESSAGES = {
  ADMIN_REQUIRED: '관리자 권한이 필요합니다.',
  PRODUCT_NOT_FOUND: '상품을 찾을 수 없습니다.',
  INVALID_SOURCE_PRODUCT: '제공처 또는 기준 시점이 올바르지 않습니다.',
  INVALID_PRODUCT_FILTER: '상품 필터가 올바르지 않습니다.',
}

export const formatAdminProductError = (error) => {
  const beMessage = error?.message || error?.data?.error?.message
  // 외부 API 키 미설정 등 BE 메시지가 더 구체함
  if (error?.code === 'INVALID_SOURCE_PRODUCT' && beMessage) {
    return beMessage
  }
  if (error?.code && ADMIN_PRODUCT_ERROR_MESSAGES[error.code]) {
    return ADMIN_PRODUCT_ERROR_MESSAGES[error.code]
  }
  return beMessage || '요청에 실패했습니다.'
}
