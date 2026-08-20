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
  const questDate = computed(() => snapshot.value?.questDate ?? '')
  const calculatedAt = computed(() => snapshot.value?.calculatedAt ?? '')
  const nextCursor = computed(() => snapshot.value?.nextCursor ?? null)

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
      snapshot.value = params.append ? { ...data, items: [...items.value, ...data.items] } : data
    } catch (err) {
      snapshot.value = null
      error.value = err?.message || '리더보드를 불러오지 못했습니다.'
      errorCode.value = err?.code ?? null
    } finally {
      isLoading.value = false
    }
  }

  const loadMore = async (size = 40) => {
    if (!nextCursor.value || isLoading.value) return
    await fetchLeaderboard({ cursor: nextCursor.value, size, append: true })
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
    questDate,
    calculatedAt,
    nextCursor,
    fetchLeaderboard,
    loadMore,
    clear,
  }
})
