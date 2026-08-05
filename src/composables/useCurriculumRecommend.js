import { onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useCurriculumStore } from '@/store/curriculumStore.js'

export const useCurriculumRecommend = () => {
  const router = useRouter()
  const curriculumStore = useCurriculumStore()
  const { selectedCourseCount, orderedItems, availableItems, isLoading, isSaving, error } =
    storeToRefs(curriculumStore)

  const actionError = ref('')

  onMounted(async () => {
    try {
      await curriculumStore.fetchDraft()
    } catch {
      /* store.error */
    }
  })

  const onToggle = (mainChapterId) => {
    curriculumStore.toggleChapter(mainChapterId)
  }

  const onReorder = (fromIndex, toIndex) => {
    curriculumStore.reorderOrderedItems(fromIndex, toIndex)
  }

  /** 초안 저장 후 확정(시간표) 화면으로 */
  const onConfirm = async () => {
    actionError.value = ''
    try {
      await curriculumStore.persistDraft()
      await router.push({ name: 'onboarding-curriculum-confirm' })
    } catch (err) {
      actionError.value = err?.message || '커리큘럼을 저장하지 못했습니다.'
    }
  }

  const goResult = () => {
    router.push({ name: 'onboarding-result' })
  }

  return {
    selectedCourseCount,
    orderedItems,
    availableItems,
    isLoading,
    isSaving,
    error,
    actionError,
    onToggle,
    onReorder,
    onConfirm,
    goResult,
  }
}
