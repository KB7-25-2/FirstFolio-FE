import adminApiClient from '@/api/adminClient.js'

/**
 * PATCH /admin/financial-news/{financialNewsId}
 * — NewsPatchRequest: 본문에 넣은 필드만 변경. image_url: null이면 썸네일 제거.
 *   source_url·source_name·발행 시점은 보내지 않는다.
 * @param {number} financialNewsId
 * @param {{ title?: string, summary?: string, image_url?: string | null }} body
 */
export const patchAdminFinancialNews = (financialNewsId, body) =>
  adminApiClient.patch(`/admin/financial-news/${financialNewsId}`, body)

/**
 * DELETE /admin/financial-news/{financialNewsId}
 * @param {number} financialNewsId
 */
export const deleteAdminFinancialNews = (financialNewsId) =>
  adminApiClient.delete(`/admin/financial-news/${financialNewsId}`)
