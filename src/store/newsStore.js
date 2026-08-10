import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { getFinancialNews } from '@/services/newsService.js'

export const useNewsStore = defineStore('news', () => {
  const items = ref([])
  const selectedId = ref(null)
  const isLoading = ref(false)
  const error = ref(null)

  /** 배너에 표시할 대표 뉴스 (최신 1건) */
  const featuredNews = computed(() => items.value[0] ?? null)

  /** 모달에 표시할 선택된 뉴스 */
  const selectedNews = computed(
    () => items.value.find((item) => item.financial_news_id === selectedId.value) ?? null,
  )

  /**
   * 금융 뉴스 요약 목록 조회
   * @param {{ limit?: number }} [params]
   */
  const fetchNews = async (params = { limit: 3 }) => {
    if (isLoading.value) return

    isLoading.value = true
    error.value = null

    try {
      const { data } = await getFinancialNews(params)
      items.value = data.items
    } catch (err) {
      error.value = err?.message || '뉴스를 불러오지 못했습니다.'
      items.value = []
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 모달용 뉴스 선택
   * @param {number | null} id
   */
  const selectNews = (id) => {
    selectedId.value = id
  }

  const clearSelection = () => {
    selectedId.value = null
  }

  const clearNews = () => {
    items.value = []
    selectedId.value = null
    error.value = null
  }

  return {
    items,
    selectedId,
    isLoading,
    error,
    featuredNews,
    selectedNews,
    fetchNews,
    selectNews,
    clearSelection,
    clearNews,
  }
})
