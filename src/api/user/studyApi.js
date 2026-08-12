import apiClient from '@/api/index.js'

/** GET /curriculums — 확정된 개인 커리큘럼 */
export const getCurriculum = () => apiClient.get('/curriculums')

/**
 * GET /learning/main-chapters/{mainChapterId}/progress
 * @param {number} mainChapterId
 */
export const getLearningProgress = (mainChapterId) =>
  apiClient.get(`/learning/main-chapters/${mainChapterId}/progress`)

/**
 * GET /learning/sub-chapters/{subChapterId}
 * — 소단원 메타 + 인라인 lesson JSON (LessonContentResponse)
 * @param {number} subChapterId
 */
export const getSubChapterLesson = (subChapterId) =>
  apiClient.get(`/learning/sub-chapters/${subChapterId}`)

/**
 * PATCH /learning/sub-chapters/{subChapterId}/progress
 * @param {number} subChapterId
 * @param {{ last_page_id: string, status?: string }} body
 */
export const saveLessonProgress = (subChapterId, body) =>
  apiClient.patch(`/learning/sub-chapters/${subChapterId}/progress`, body)

/** GET /learning/continue — StudyNote「이어서」 */
export const getContinuePosition = () => apiClient.get('/learning/continue')

/**
 * GET /learning/main-chapters/{mainChapterId}/game
 * @param {number} mainChapterId
 */
export const getChapterGame = (mainChapterId) =>
  apiClient.get(`/learning/main-chapters/${mainChapterId}/game`)

/**
 * GET /scenarios/{scenarioId}
 * @param {number} scenarioId
 */
export const getScenario = (scenarioId) => apiClient.get(`/scenarios/${scenarioId}`)

/**
 * POST /scenarios/{scenarioId}/attempts
 * @param {number} scenarioId
 * @param {{ main_chapter_id: number, answers: { step_id: number, selected_key: string }[] }} body
 */
export const submitScenarioAttempt = (scenarioId, body) =>
  apiClient.post(`/scenarios/${scenarioId}/attempts`, body)
