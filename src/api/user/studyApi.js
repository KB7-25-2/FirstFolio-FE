import apiClient from '@/api/index.js'

/** GET /learning/main-chapters */
export const getMainChapters = () => apiClient.get('/learning/main-chapters')

/** GET /learning/main-chapters/{mainChapterId}/sub-chapters */
export const getSubChapters = (mainChapterId) =>
  apiClient.get(`/learning/main-chapters/${mainChapterId}/sub-chapters`)

/** GET /learning/sub-chapters/{subChapterId} — 공개 강좌 JSON 포함 */
export const getSubChapterLesson = (subChapterId) =>
  apiClient.get(`/learning/sub-chapters/${subChapterId}`)

/** GET /learning/sub-chapters/{subChapterId}/progress */
export const getSubChapterProgress = (subChapterId) =>
  apiClient.get(`/learning/sub-chapters/${subChapterId}/progress`)

/**
 * PUT /learning/sub-chapters/{subChapterId}/progress
 * 라이브 BE는 snake_case 요청 본문만 수용
 * @param {number} subChapterId
 * @param {{ contentVersionId: number, lastPageId?: string | null, status: 'IN_PROGRESS' | 'COMPLETED' }} body
 */
export const putSubChapterProgress = (subChapterId, body) =>
  apiClient.put(`/learning/sub-chapters/${subChapterId}/progress`, {
    content_version_id: body.contentVersionId ?? body.content_version_id,
    last_page_id: body.lastPageId ?? body.last_page_id ?? null,
    status: body.status,
  })

/** GET /learning/continue */
export const getContinuePosition = () => apiClient.get('/learning/continue')
