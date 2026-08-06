import apiClient from '@/api/index.js'

/**
 * @param {import('@/types/auth.js').SignupRequest} body
 * @param {string} idToken
 */
export const signUp = (body, idToken) =>
  apiClient.post('/auth/signup', body, {
    headers: { Authorization: `Bearer ${idToken}` },
  })

/**
 * @param {string} idToken Firebase ID Token
 */
export const login = (idToken) =>
  apiClient.post('/auth/login', null, {
    headers: { Authorization: `Bearer ${idToken}` },
  })

export const logout = () => apiClient.post('/auth/logout')

export const refreshToken = () => apiClient.post('/auth/refresh')
