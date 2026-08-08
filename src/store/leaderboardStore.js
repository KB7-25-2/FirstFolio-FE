import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { getLeaderboard } from '@/services/leaderboardService.js'

export const useLeaderboardStore = defineStore('leaderboard', () => {
  const snapshot = ref(null)
  const isLoading = ref(false)
  const error = ref(null)
  const errorCode = ref(null)

  const items = computed(() => snapshot.value?.items ?? [])
  const myRank = computed(() => snapshot.value?.myRank ?? null)
  const snapshotDate = computed(() => snapshot.value?.snapshotDate ?? '')
  const weekStartDate = computed(() => snapshot.value?.weekStartDate ?? '')
  const nextCursor = computed(() => snapshot.value?.nextCursor ?? null)
  const isSnapshotMissing = computed(() => errorCode.value === 'LEADERBOARD_SNAPSHOT_NOT_FOUND')

  /**
   * @param {{ cursor?: string, size?: number }} [params]
   */
  const fetchLeaderboard = async (params = {}) => {
    if (isLoading.value) return

    isLoading.value = true
    error.value = null
    errorCode.value = null

    try {
      const { data } = await getLeaderboard({
        cursor: params.cursor,
        size: params.size ?? 40,
      })
      snapshot.value = data
    } catch (err) {
      snapshot.value = null
      error.value = err?.message || '리더보드를 불러오지 못했습니다.'
      errorCode.value = err?.code ?? null
    } finally {
      isLoading.value = false
    }
  }

  const clear = () => {
    snapshot.value = null
    error.value = null
    errorCode.value = null
  }

  return {
    snapshot,
    isLoading,
    error,
    errorCode,
    items,
    myRank,
    snapshotDate,
    weekStartDate,
    nextCursor,
    isSnapshotMissing,
    fetchLeaderboard,
    clear,
  }
})
