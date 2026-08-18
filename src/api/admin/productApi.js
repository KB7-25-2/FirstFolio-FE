import adminApiClient from '@/api/adminClient.js'

/**
 * GET /admin/financial-products
 * @param {{
 *   asset_type?: string,
 *   status?: string,
 *   cursor?: string,
 *   size?: number,
 * }} [params]
 */
export const getAdminFinancialProducts = (params = {}) =>
  adminApiClient.get('/admin/financial-products', { params })

/**
 * POST /admin/financial-products/imports
 * @param {{ source_provider: string, reference_at?: string }} body live DTO snake_case
 */
export const importAdminFinancialProducts = (body) =>
  adminApiClient.post('/admin/financial-products/imports', body)

/**
 * PATCH /admin/financial-products/{productId}
 * @param {number} productId
 * @param {object} body live DTO snake_case
 */
export const patchAdminFinancialProduct = (productId, body) =>
  adminApiClient.patch(`/admin/financial-products/${productId}`, body)
