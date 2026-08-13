import adminApiClient from '@/api/adminClient.js'

/**
 * GET /admin/sub-chapters/{subChapterId}/content-versions
 * @param {number} subChapterId
 */
export const getAdminContentVersions = (subChapterId) =>
  adminApiClient.get(`/admin/sub-chapters/${subChapterId}/content-versions`)

/**
 * POST /admin/sub-chapters/{subChapterId}/content-versions
 * @param {number} subChapterId
 * @param {{ versionNo: number, lesson: object }} body
 */
export const createAdminContentVersion = (subChapterId, body) =>
  adminApiClient.post(`/admin/sub-chapters/${subChapterId}/content-versions`, body)

/**
 * POST /admin/content-versions/{contentVersionId}/publish
 * @param {number} contentVersionId
 */
export const publishAdminContentVersion = (contentVersionId) =>
  adminApiClient.post(`/admin/content-versions/${contentVersionId}/publish`)
