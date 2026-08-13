import apiClient from '@/api/index.js'

export const fetchCurriculumDraft = () => apiClient.get('/curriculum/draft')

export const updateCurriculumDraft = (body) => apiClient.put('/curriculum/draft', body)

export const confirmCurriculumDraft = (body) => apiClient.post('/curriculum/confirm', body)

export const getUserCurriculum = () => apiClient.get('/curriculum')
