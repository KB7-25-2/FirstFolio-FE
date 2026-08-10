import apiClient from '@/api/index.js'

/**
 * GET /leaderboard
 * @param {{ cursor?: string, size?: number }} [params]
 */
export const getLeaderboard = (params = {}) => apiClient.get('/leaderboard', { params })
