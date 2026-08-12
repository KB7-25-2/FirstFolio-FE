import apiClient from '@/api/index.js'

/** GET /curriculum/draft — 온보딩 커리큘럼 초안 */
export const getCurriculumDraft = () => apiClient.get('/curriculum/draft')

/**
 * PUT /curriculum/draft
 * @param {{ main_chapter_ids: number[] }} body FOUNDATION 제외 선택 ID 순서
 */
export const saveCurriculumDraft = (body) => apiClient.put('/curriculum/draft', body)

/**
 * POST /curriculum/confirm
 * @param {{ main_chapter_ids?: number[] }} [body]
 */
export const confirmCurriculum = (body = {}) => apiClient.post('/curriculum/confirm', body)
