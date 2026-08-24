import adminApiClient from '@/api/adminClient.js'

/**
 * GET /admin/newsletters
 * — status 필수 (REVIEW | PUBLISHED | RETIRED). 생략·전체 조회 불가.
 * @param {{ status: 'REVIEW' | 'PUBLISHED' | 'RETIRED' }} params
 */
export const getAdminNewsletters = (params) =>
  adminApiClient.get('/admin/newsletters', {
    params: {
      status: params.status,
    },
  })

/**
 * GET /admin/newsletters/{newsletterId}
 * @param {number} newsletterId
 */
export const getAdminNewsletterDetail = (newsletterId) =>
  adminApiClient.get(`/admin/newsletters/${newsletterId}`)

/**
 * POST /admin/newsletters/{newsletterId}/publish
 * @param {number} newsletterId
 */
export const publishAdminNewsletter = (newsletterId) =>
  adminApiClient.post(`/admin/newsletters/${newsletterId}/publish`)

/**
 * POST /admin/newsletters/{newsletterId}/retire
 * @param {number} newsletterId
 */
export const retireAdminNewsletter = (newsletterId) =>
  adminApiClient.post(`/admin/newsletters/${newsletterId}/retire`)
