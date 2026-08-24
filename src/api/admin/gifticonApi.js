import adminApiClient from '@/api/adminClient.js'

/**
 * GET /admin/gifticons
 * @param {{ status?: string, cursor?: string, size?: number }} [params]
 */
export const getAdminGifticonProducts = (params = {}) =>
  adminApiClient.get('/admin/gifticons', { params })

/**
 * POST /admin/gifticons
 * @param {object} body GifticonProductCreateRequest (snake_case)
 */
export const createAdminGifticonProduct = (body) => adminApiClient.post('/admin/gifticons', body)

/**
 * PATCH /admin/gifticons/{gifticonProductId}
 * @param {number} gifticonProductId
 * @param {object} body GifticonProductPatchRequest (snake_case)
 */
export const patchAdminGifticonProduct = (gifticonProductId, body) =>
  adminApiClient.patch(`/admin/gifticons/${gifticonProductId}`, body)

/**
 * GET /admin/gifticons/{gifticonProductId}/codes
 * @param {number} gifticonProductId
 * @param {{ status?: string, expires_before?: string, cursor?: string, size?: number }} [params]
 */
export const getAdminGifticonCodes = (gifticonProductId, params = {}) =>
  adminApiClient.get(`/admin/gifticons/${gifticonProductId}/codes`, { params })

/**
 * POST /admin/gifticons/{gifticonProductId}/codes
 * @param {number} gifticonProductId
 * @param {{ items: Array<{ code: string, expires_at: string }> }} body
 */
export const createAdminGifticonCodes = (gifticonProductId, body) =>
  adminApiClient.post(`/admin/gifticons/${gifticonProductId}/codes`, body)

/**
 * POST /admin/gifticon-codes/{gifticonCodeId}/void
 * @param {number} gifticonCodeId
 * @param {{ reason?: string }} body
 */
export const voidAdminGifticonCode = (gifticonCodeId, body = {}) =>
  adminApiClient.post(`/admin/gifticon-codes/${gifticonCodeId}/void`, body)
