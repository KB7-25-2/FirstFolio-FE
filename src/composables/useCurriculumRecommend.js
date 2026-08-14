import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import { useCurriculumStore } from '@/store/curriculumStore.js'

export const useCurriculumRecommend = () => {
  const router = useRouter()
  const route = useRoute()
  const curriculumStore = useCurriculumStore()
  const {
    selectedCourseCount,
    orderedItems,
    availableItems,
    isLoading,
    isSaving,
    isConfirming,
    error,
    confirmed,
    editMode,
  } = storeToRefs(curriculumStore)

  const actionError = ref('')
  const isEditMode = computed(() => route.query.mode === 'edit' || editMode.value)

  /** 연속 조작 시 PUT이 꼬이지 않도록 직렬화 */
  let syncChain = Promise.resolve()

  onMounted(async () => {
    actionError.value = ''
    try {
      if (isEditMode.value) {
        await curriculumStore.fetchForEdit()
        return
      }
      if (confirmed.value && orderedItems.value.length) {
        await curriculumStore.fetchDraft({ keepOrdered: true })
        return
      }
      await curriculumStore.fetchDraft()
    } catch {
      /* store.error */
    }
  })

  /**
   * 조작마다 서버 반영
   * — 초안만: PUT /curriculum/draft { main_chapter_ids }
   * — 확정본 수정: 로컬만 변경, 확정 버튼에서 PUT /curriculum
   */
  const syncAfterEdit = () => {
    if (isEditMode.value || confirmed.value) return Promise.resolve()

    syncChain = syncChain.then(async () => {
      actionError.value = ''
      try {
        await curriculumStore.persistDraft()
      } catch (err) {
        actionError.value = err?.message || '저장에 실패했습니다.'
      }
    })
    return syncChain
  }

  const onToggle = async (mainChapterId) => {
    const changed = curriculumStore.toggleChapter(mainChapterId)
    if (!changed) return
    await syncAfterEdit()
  }

  const onReorder = async (fromIndex, toIndex) => {
    const changed = curriculumStore.reorderOrderedItems(fromIndex, toIndex)
    if (!changed) return
    await syncAfterEdit()
  }

  /**
   * 구성 확정
   * — 최초: POST /curriculum/confirm
   * — 이미 확정·수정 모드: PUT /curriculum
   */
  const onConfirm = async () => {
    actionError.value = ''
    try {
      await syncChain
      if (isEditMode.value || confirmed.value) {
        await curriculumStore.updateConfirmed()
        await router.push({
          name: 'onboarding-curriculum-confirm',
          query: route.query.mode === 'edit' ? { mode: 'edit' } : undefined,
        })
        return
      }
      await curriculumStore.confirm()
      await router.push({ name: 'onboarding-curriculum-confirm' })
    } catch (err) {
      actionError.value = err?.message || '커리큘럼을 확정하지 못했습니다.'
    }
  }

  const goBack = () => {
    if (isEditMode.value) {
      router.push({ name: 'learning' })
      return
    }
    router.push({ name: 'onboarding-result' })
  }

  return {
    selectedCourseCount,
    orderedItems,
    availableItems,
    isLoading,
    isSaving,
    isConfirming,
    isEditMode,
    error,
    actionError,
    onToggle,
    onReorder,
    onConfirm,
    goBack,
  }
}
