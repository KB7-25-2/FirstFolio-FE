import apiClient from '@/api/index.js'

export const getPortfolioSummary = () => apiClient.get('/portfolios/me')

export const sellHolding = (holdingId, payload) =>
  apiClient.post(`/portfolios/me/holdings/${holdingId}/sell`, payload)

export const purchaseProduct = (productId, payload) =>
  apiClient.post('/portfolios/me/holdings', { productId, ...payload })

export const getPurchasableProducts = () => apiClient.get('/products')

export const getTimeCompressionRules = () => apiClient.get('/products/time-compression-rules')
