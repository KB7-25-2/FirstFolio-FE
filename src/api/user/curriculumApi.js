import apiClient from '@/api/index.js'

export const fetchCurriculumDraft = () => apiClient.get('/curriculum/draft')

export const updateCurriculumDraft = (body) => apiClient.put('/curriculum/draft', body)

export const confirmCurriculumDraft = (body) => apiClient.post('/curriculum/confirm', body)

/** 확정된 개인 커리큘럼 조회 */
export const getUserCurriculum = () => apiClient.get('/curriculum')

/** 확정된 개인 커리큘럼 수정 */
export const updateUserCurriculum = (body) => apiClient.put('/curriculum', body)
