import apiClient from '@/api/index.js'

/**
 * GET /quiz/questions?question_ids=1,2,3
 * — 사용자 조회: 정답·해설 제외 (QuizQuestionView)
 * @param {number[]} questionIds
 */
export const getQuizQuestions = (questionIds) =>
  apiClient.get('/quiz/questions', {
    params: { question_ids: questionIds.join(',') },
  })

/**
 * POST /learning/sub-chapters/{subChapterId}/quiz/answers
 * — 문항 단위 제출·채점
 * @param {number} subChapterId
 * @param {{ question_id: number, selected_key: string }} body
 */
export const gradeQuizAnswer = (subChapterId, body) =>
  apiClient.post(`/learning/sub-chapters/${subChapterId}/quiz/answers`, body)

/**
 * POST /quiz/attempts
 * — 소단원 퀴즈 일괄 제출·채점
 * @param {{
 *   quiz_type: string,
 *   sub_chapter_id: number,
 *   answers: { question_id: number, selected_key: string }[]
 * }} body
 */
export const submitQuizAttempt = (body) => apiClient.post('/quiz/attempts', body)
