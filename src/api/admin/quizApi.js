import adminApiClient from '@/api/adminClient.js'

/**
 * GET /admin/quiz-questions
 * @param {{
 *   usage_type?: string,
 *   main_chapter_id?: number,
 *   sub_chapter_id?: number,
 *   status?: string,
 *   question_key?: string,
 *   cursor?: string,
 * }} [params]
 */
export const getAdminQuizQuestions = (params = {}) =>
  adminApiClient.get('/admin/quiz-questions', { params })

/**
 * POST /admin/quiz-questions
 * @param {object} body snake_case 문항 원본
 */
export const createAdminQuizQuestion = (body) => adminApiClient.post('/admin/quiz-questions', body)

/**
 * POST /admin/quiz-questions/{questionId}/versions
 * @param {number} questionId
 * @param {object} body
 */
export const createAdminQuizQuestionVersion = (questionId, body) =>
  adminApiClient.post(`/admin/quiz-questions/${questionId}/versions`, body)

/**
 * PATCH /admin/quiz-questions/{questionId}
 * — 상태 전환(DRAFT→REVIEW 등). BE 미구현 시 404/405
 * @param {number} questionId
 * @param {object} body
 */
export const patchAdminQuizQuestion = (questionId, body) =>
  adminApiClient.patch(`/admin/quiz-questions/${questionId}`, body)

/**
 * POST /admin/quiz-questions/{questionId}/publish
 * — content-versions publish 패턴과 동일. BE 미구현 시 404
 * @param {number} questionId
 */
export const publishAdminQuizQuestion = (questionId) =>
  adminApiClient.post(`/admin/quiz-questions/${questionId}/publish`)
