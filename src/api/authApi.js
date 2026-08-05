import apiClient from '@/api/index.js'

/**
 * @param {import('@/types/auth.js').SignupRequest} body
 * @param {string} idToken
 */
export const signUp = (body, idToken) =>
  apiClient.post('/auth/signup', body, {
    headers: { Authorization: `Bearer ${idToken}` },
  })

export const login = (credentials) => apiClient.post('/auth/login', credentials)

export const logout = () => apiClient.post('/auth/logout')

export const refreshToken = () => apiClient.post('/auth/refresh')
