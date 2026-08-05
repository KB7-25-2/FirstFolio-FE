import { onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useCurriculumStore } from '@/store/curriculumStore.js'

export const useCurriculumRecommend = () => {
  const router = useRouter()
  const curriculumStore = useCurriculumStore()
  const { selectedCourseCount, orderedItems, availableItems, isLoading, isConfirming, error } =
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

  const onConfirm = async () => {
    actionError.value = ''
    try {
      await curriculumStore.confirm()
      await router.push({ name: 'home' })
    } catch (err) {
      actionError.value = err?.message || '확정에 실패했습니다.'
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
    isConfirming,
    error,
    actionError,
    onToggle,
    onReorder,
    onConfirm,
    goResult,
  }
}
