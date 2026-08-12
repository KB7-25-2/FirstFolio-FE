import apiClient from '@/api/index.js'

export const startLevelTestAttempt = () => apiClient.post('/level-tests/attempts')

export const saveLevelTestAttemptAnswers = (attemptId, body) =>
  apiClient.put(`/level-tests/attempts/${attemptId}/answers`, body)

export const submitLevelTestAttempt = (attemptId) =>
  apiClient.post(`/level-tests/attempts/${attemptId}/submit`)
