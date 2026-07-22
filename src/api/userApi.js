import apiClient from '@/api/index.js'

export const getUserProfile = () => apiClient.get('/users/me')

export const updateUserProfile = (payload) => apiClient.put('/users/me', payload)
