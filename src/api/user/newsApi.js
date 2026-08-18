import apiClient from '@/api/index.js'

/**
 * GET /financial-news
 * @param {{ limit?: number }} [params]
 */
export const getFinancialNews = (params = {}) => apiClient.get('/financial-news', { params })
