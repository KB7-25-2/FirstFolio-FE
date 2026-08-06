import apiClient from '@/api/index.js'

/** GET /users/me — Authorization: Bearer {Firebase ID Token} */
export const getUserProfile = () => apiClient.get('/users/me')

/**
 * PATCH /users/me — 전달된 필드만 부분 수정
 * @param {{ nickname?: string, newsletter_opt_in?: boolean }} payload
 */
export const updateUserProfile = (payload) => apiClient.patch('/users/me', payload)
