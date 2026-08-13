import adminApiClient from '@/api/adminClient.js'

/**
 * GET /admin/main-chapters
 * @param {{ chapter_type?: 'FOUNDATION' | 'ASSET', is_active?: boolean }} [params]
 */
export const getAdminMainChapters = (params = {}) =>
  adminApiClient.get('/admin/main-chapters', { params })

/**
 * POST /admin/main-chapters
 * @param {object} body
 */
export const createAdminMainChapter = (body) => adminApiClient.post('/admin/main-chapters', body)

/**
 * PATCH /admin/main-chapters/{mainChapterId}
 * @param {number} mainChapterId
 * @param {object} body
 */
export const patchAdminMainChapter = (mainChapterId, body) =>
  adminApiClient.patch(`/admin/main-chapters/${mainChapterId}`, body)

/**
 * GET /admin/main-chapters/{mainChapterId}/sub-chapters
 * @param {number} mainChapterId
 */
export const getAdminSubChapters = (mainChapterId) =>
  adminApiClient.get(`/admin/main-chapters/${mainChapterId}/sub-chapters`)

/**
 * POST /admin/main-chapters/{mainChapterId}/sub-chapters
 * @param {number} mainChapterId
 * @param {object} body
 */
export const createAdminSubChapter = (mainChapterId, body) =>
  adminApiClient.post(`/admin/main-chapters/${mainChapterId}/sub-chapters`, body)

/**
 * PATCH /admin/sub-chapters/{subChapterId}
 * @param {number} subChapterId
 * @param {object} body
 */
export const patchAdminSubChapter = (subChapterId, body) =>
  adminApiClient.patch(`/admin/sub-chapters/${subChapterId}`, body)
