import { onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useCurriculumStore } from '@/store/curriculumStore.js'

export const useCurriculumRecommend = () => {
  const router = useRouter()
  const curriculumStore = useCurriculumStore()
  const {
    requiredItem,
    recommendationPool,
    cartCandidates,
    selectedCourseCount,
    orderedItems,
    isLoading,
    isConfirming,
    error,
  } = storeToRefs(curriculumStore)

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

  const onMoveUp = (index) => {
    curriculumStore.moveOrderedItem(index, -1)
  }

  const onMoveDown = (index) => {
    curriculumStore.moveOrderedItem(index, 1)
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
    requiredItem,
    recommendationPool,
    cartCandidates,
    selectedCourseCount,
    orderedItems,
    isLoading,
    isConfirming,
    error,
    actionError,
    isSelected: curriculumStore.isSelected,
    onToggle,
    onMoveUp,
    onMoveDown,
    onConfirm,
    goResult,
  }
}
