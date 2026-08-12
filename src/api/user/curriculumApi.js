import apiClient from '@/api/index.js'

/** GET /curriculums/draft — 온보딩 커리큘럼 초안 */
export const getCurriculumDraft = () => apiClient.get('/curriculums/draft')

/**
 * PUT /curriculums/draft
 * @param {{ main_chapter_ids: number[] }} body FOUNDATION 제외 선택 ID 순서
 */
export const saveCurriculumDraft = (body) => apiClient.put('/curriculums/draft', body)

/**
 * POST /curriculums/confirm
 * @param {{ main_chapter_ids?: number[] }} [body]
 */
export const confirmCurriculum = (body = {}) => apiClient.post('/curriculums/confirm', body)
