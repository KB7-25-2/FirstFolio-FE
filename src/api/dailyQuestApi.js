import apiClient from '@/api/index.js'

/** GET /daily-quests/today — Authorization: Bearer {Firebase ID Token} */
export const getToday = () => apiClient.get('/daily-quests/today')

/**
 * PUT /daily-quests/today/answers — 문항별 답안 중간 저장
 * @param {{
 *   daily_quest_item_id: number,
 *   user_answer_json: { selected_key?: string, selected_keys?: string[] }
 * }} body
 */
export const saveAnswer = (body) => apiClient.put('/daily-quests/today/answers', body)
