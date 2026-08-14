import apiClient from '@/api/index.js'

/** GET /daily-quests/today — Authorization: Bearer {Firebase ID Token} */
export const getToday = () => apiClient.get('/daily-quests/today')

/**
 * PUT /daily-quests/today/items/{dailyQuestItemId}/answer
 * @param {number} dailyQuestItemId
 * @param {{ answer: { key: string } }} body
 */
export const saveAnswer = (dailyQuestItemId, body) =>
  apiClient.put(`/daily-quests/today/items/${dailyQuestItemId}/answer`, body)

/** POST /daily-quests/today/submit — 최종 제출·채점 (body 없음) */
export const submitToday = () => apiClient.post('/daily-quests/today/submit')
