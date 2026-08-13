import apiClient from '@/api/index.js'

/** POST /learning/sub-chapters/{subChapterId}/quiz-attempts */
export const startSubChapterQuizAttempt = (subChapterId) =>
  apiClient.post(`/learning/sub-chapters/${subChapterId}/quiz-attempts`)

/** POST /learning/main-chapters/{mainChapterId}/quiz-attempts */
export const startMainChapterQuizAttempt = (mainChapterId) =>
  apiClient.post(`/learning/main-chapters/${mainChapterId}/quiz-attempts`)

/**
 * PUT /learning/quiz-attempts/{attemptId}/answers/{questionId}
 * @param {number} attemptId
 * @param {number} questionId
 * @param {{ answer: { key: string } }} body
 */
export const gradeQuizAnswer = (attemptId, questionId, body) =>
  apiClient.put(`/learning/quiz-attempts/${attemptId}/answers/${questionId}`, body)
