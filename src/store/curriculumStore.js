import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  getCurriculumDraft,
  saveCurriculumDraft,
  confirmCurriculum,
  resetCurriculumState,
  chapterTitle,
} from '@/services/curriculumService.js'

export const useCurriculumStore = defineStore('curriculum', () => {
  /** @type {import('vue').Ref<import('@/types/curriculum.js').CurriculumDraft | null>} */
  const draft = ref(null)
  /**
   * 선택·순서 목록 (FOUNDATION 포함, 서버 조합과 동일)
   * @type {import('vue').Ref<import('@/types/curriculum.js').CurriculumConfirmItem[]>}
   */
  const orderedItems = ref([])

  const isLoading = ref(false)
  const isSaving = ref(false)
  const isConfirming = ref(false)
  const error = ref(null)
  const confirmed = ref(false)

  const items = computed(() => draft.value?.items ?? [])
  const cartCandidates = computed(() => draft.value?.cartCandidates ?? [])
  const recommendationPool = computed(() => draft.value?.recommendationCandidates ?? [])
  const requiredItem = computed(
    () => orderedItems.value.find((i) => i.sourceType === 'REQUIRED') ?? null,
  )

  /** 장바구니에 담기지 않은 후보 (추천·정답 풀) */
  const availableItems = computed(() => {
    const selected = new Set(orderedItems.value.map((i) => i.mainChapterId))
    const seen = new Set()
    const pool = [
      ...recommendationPool.value.map((item) => ({
        ...item,
        sourceType: 'LEVEL_TEST_WRONG',
      })),
      ...cartCandidates.value.map((item) => ({
        ...item,
        sourceType: 'CART',
      })),
    ]
    return pool.filter((item) => {
      if (selected.has(item.mainChapterId) || seen.has(item.mainChapterId)) return false
      seen.add(item.mainChapterId)
      return true
    })
  })

  const selectedCourseCount = computed(() => orderedItems.value.length)

  const selectedAssetIds = computed(() =>
    orderedItems.value.filter((i) => i.sourceType !== 'REQUIRED').map((i) => i.mainChapterId),
  )

  const isSelected = (mainChapterId) =>
    orderedItems.value.some((i) => i.mainChapterId === mainChapterId)

  const sourceTypeFor = (mainChapterId) => {
    if (recommendationPool.value.some((i) => i.mainChapterId === mainChapterId)) {
      return 'LEVEL_TEST_WRONG'
    }
    return 'CART'
  }

  const ensureFoundation = (list) => {
    const required =
      list.find((item) => item.sourceType === 'REQUIRED') ??
      orderedItems.value.find((item) => item.sourceType === 'REQUIRED') ??
      draft.value?.items.find((item) => item.sourceType === 'REQUIRED')
    const optional = list.filter((item) => item.sourceType !== 'REQUIRED')
    const normalized = required ? [required, ...optional] : optional
    return normalized.map((item, index) => ({ ...item, displayOrder: index + 1 }))
  }

  const setOrderedFromDraftItems = (draftItems) => {
    orderedItems.value = ensureFoundation(
      draftItems.map((item) => ({
        mainChapterId: item.mainChapterId,
        title: item.title,
        sourceType: item.sourceType,
        displayOrder: item.displayOrder,
      })),
    )
  }

  const toggleChapter = (mainChapterId) => {
    if (
      orderedItems.value.some(
        (item) => item.mainChapterId === mainChapterId && item.sourceType === 'REQUIRED',
      )
    ) {
      return
    }
    if (isSelected(mainChapterId)) {
      orderedItems.value = ensureFoundation(
        orderedItems.value.filter((i) => i.mainChapterId !== mainChapterId),
      )
      return
    }
    const candidate = [...recommendationPool.value, ...cartCandidates.value].find(
      (item) => item.mainChapterId === mainChapterId,
    )
    orderedItems.value = ensureFoundation([
      ...orderedItems.value,
      {
        mainChapterId,
        title: candidate?.title ?? chapterTitle(mainChapterId),
        sourceType: sourceTypeFor(mainChapterId),
        displayOrder: orderedItems.value.length + 1,
      },
    ])
  }

  const moveOrderedItem = (index, direction) => {
    reorderOrderedItems(index, index + direction)
  }

  /**
   * 장바구니 순서 변경 (FOUNDATION index 0 고정)
   * @param {number} fromIndex
   * @param {number} toIndex
   */
  const reorderOrderedItems = (fromIndex, toIndex) => {
    if (fromIndex === toIndex) return
    if (fromIndex <= 0 || toIndex <= 0) return
    const len = orderedItems.value.length
    if (fromIndex >= len || toIndex >= len) return
    if (orderedItems.value[fromIndex]?.sourceType === 'REQUIRED') return

    const next = [...orderedItems.value]
    const [row] = next.splice(fromIndex, 1)
    next.splice(toIndex, 0, row)
    orderedItems.value = ensureFoundation(next)
  }

  const fetchDraft = async () => {
    isLoading.value = true
    error.value = null
    try {
      const { data } = await getCurriculumDraft()
      draft.value = data
      setOrderedFromDraftItems(data.items)
      confirmed.value = false
      return data
    } catch (err) {
      draft.value = null
      orderedItems.value = []
      if (err?.code === 'LEVEL_TEST_REQUIRED') {
        error.value = '레벨 테스트를 먼저 완료해 주세요.'
      } else {
        error.value = err?.message || '커리큘럼 초안을 불러오지 못했습니다.'
      }
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const persistDraft = async () => {
    isSaving.value = true
    error.value = null
    try {
      const { data } = await saveCurriculumDraft({
        main_chapter_ids: selectedAssetIds.value,
      })
      // 응답 items에 title 없을 수 있어 로컬 ordered 유지 + sourceType 동기화
      const byId = new Map(data.items.map((i) => [i.mainChapterId, i]))
      orderedItems.value = ensureFoundation(
        orderedItems.value.map((item) => {
          const mapped = byId.get(item.mainChapterId)
          return mapped
            ? { ...item, sourceType: mapped.sourceType, displayOrder: mapped.displayOrder }
            : item
        }),
      )
      return data
    } catch (err) {
      error.value = err?.message || '커리큘럼을 저장하지 못했습니다.'
      throw err
    } finally {
      isSaving.value = false
    }
  }

  const confirm = async () => {
    isConfirming.value = true
    error.value = null
    try {
      await persistDraft()
      const { data } = await confirmCurriculum({
        main_chapter_ids: selectedAssetIds.value,
      })
      confirmed.value = true
      return data
    } catch (err) {
      error.value = err?.message || '커리큘럼을 확정하지 못했습니다.'
      throw err
    } finally {
      isConfirming.value = false
    }
  }

  const clear = () => {
    resetCurriculumState()
    draft.value = null
    orderedItems.value = []
    confirmed.value = false
    error.value = null
  }

  return {
    draft,
    isLoading,
    isSaving,
    isConfirming,
    error,
    confirmed,
    items,
    cartCandidates,
    recommendationPool,
    requiredItem,
    availableItems,
    selectedCourseCount,
    selectedAssetIds,
    orderedItems,
    isSelected,
    toggleChapter,
    moveOrderedItem,
    reorderOrderedItems,
    fetchDraft,
    persistDraft,
    confirm,
    clear,
  }
})
