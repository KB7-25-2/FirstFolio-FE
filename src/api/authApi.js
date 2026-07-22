import apiClient from '@/api/index.js'

export const login = (credentials) => apiClient.post('/auth/login', credentials)

export const logout = () => apiClient.post('/auth/logout')

export const refreshToken = () => apiClient.post('/auth/refresh')
