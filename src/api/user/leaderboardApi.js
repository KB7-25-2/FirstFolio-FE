import apiClient from '@/api/index.js'

/**
 * GET /daily-quests/leaderboard
 * @param {{ cursor?: string, size?: number }} [params]
 */
export const getLeaderboard = (params = {}) =>
  apiClient.get('/daily-quests/leaderboard', { params })
