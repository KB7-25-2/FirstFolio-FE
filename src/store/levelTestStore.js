import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  getLevelTestStatus,
  startLevelTest,
  completeLevelTest,
  resetLevelTestState,
  LevelTestApiError,
} from '@/services/levelTestService.js'

export const useLevelTestStore = defineStore('levelTest', () => {
  /** @type {import('vue').Ref<boolean | null>} null = 아직 조회 전 */
  const completed = ref(null)
  const attempt = ref(null)
  const isLoading = ref(false)
  const error = ref(null)

  const isCompleted = computed(() => completed.value === true)
  const isStatusLoaded = computed(() => completed.value !== null)

  const fetchStatus = async () => {
    isLoading.value = true
    error.value = null
    try {
      const { data } = await getLevelTestStatus()
      completed.value = data.completed
      return data.completed
    } catch (err) {
      error.value = err?.message || '레벨 테스트 상태를 불러오지 못했습니다.'
      completed.value = false
      return false
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 상태가 없으면 조회 후 반환
   * @returns {Promise<boolean>}
   */
  const ensureStatus = async () => {
    if (completed.value !== null) return completed.value
    return fetchStatus()
  }

  const start = async () => {
    isLoading.value = true
    error.value = null
    try {
      const { data } = await startLevelTest()
      attempt.value = data
      completed.value = false
      return data
    } catch (err) {
      if (err instanceof LevelTestApiError && err.code === 'LEVEL_TEST_ALREADY_COMPLETED') {
        completed.value = true
        attempt.value = null
      }
      error.value = err?.message || '레벨 테스트를 시작할 수 없습니다.'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const markCompleted = async () => {
    const { data } = await completeLevelTest()
    completed.value = data.completed
    if (attempt.value) {
      attempt.value = { ...attempt.value, status: 'COMPLETED' }
    }
  }

  const clearSession = () => {
    completed.value = null
    attempt.value = null
    error.value = null
  }

  const clear = () => {
    resetLevelTestState()
    clearSession()
  }

  return {
    completed,
    attempt,
    isLoading,
    error,
    isCompleted,
    isStatusLoaded,
    fetchStatus,
    ensureStatus,
    start,
    markCompleted,
    clearSession,
    clear,
  }
})
