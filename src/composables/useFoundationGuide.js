import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useStudyStore } from '@/store/studyStore.js'

/**
 * 홈 포트폴리오 기초 과정 가이드 (마운트 단위 dismiss)
 */
export const useFoundationGuide = () => {
  const router = useRouter()
  const studyStore = useStudyStore()
  const { needsFoundationGuide, foundationItem, isLoading } = storeToRefs(studyStore)

  /** 이번 홈 마운트에서 사용자가 닫았는지 */
  const dismissed = ref(false)

  const isOpen = computed(() => needsFoundationGuide.value && !dismissed.value && !isLoading.value)

  watch(needsFoundationGuide, (needs) => {
    if (!needs) dismissed.value = false
  })

  const dismiss = () => {
    dismissed.value = true
  }

  const startFoundation = async () => {
    const mainChapterId = foundationItem.value?.mainChapterId ?? 1
    dismissed.value = true
    await router.push({
      name: 'learning',
      query: { mainChapterId: String(mainChapterId) },
    })
  }

  return {
    isOpen,
    needsFoundationGuide,
    foundationItem,
    dismiss,
    startFoundation,
  }
}
