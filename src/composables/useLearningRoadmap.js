import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useStudyStore } from '@/store/studyStore.js'
import { getMainChapterDisplay } from '@/constants/mainChapterDisplay.js'

export const useLearningRoadmap = () => {
  const studyStore = useStudyStore()
  const router = useRouter()
  const { curriculumItems } = storeToRefs(studyStore)

  const isLoading = ref(false)
  const error = ref(null)

  onMounted(async () => {
    isLoading.value = true
    error.value = null
    try {
      await studyStore.fetchCurriculum()
    } catch (err) {
      if (err?.code === 'CURRICULUM_NOT_FOUND') {
        error.value = '확정된 커리큘럼이 없습니다.'
      } else {
        error.value = err?.message || '학습 로드맵을 불러오지 못했습니다.'
      }
    } finally {
      isLoading.value = false
    }
  })

  const foundationItem = computed(() =>
    curriculumItems.value.find((item) => item.chapterType === 'FOUNDATION'),
  )

  const coreItems = computed(() =>
    curriculumItems.value
      .filter((item) => item.chapterType === 'CORE')
      .slice()
      .sort((a, b) => a.displayOrder - b.displayOrder),
  )

  /** API CurriculumItem + FE 표시 메타 */
  const withDisplay = (item) => ({
    ...item,
    ...getMainChapterDisplay(item.mainChapterId),
  })

  const foundationCard = computed(() =>
    foundationItem.value ? withDisplay(foundationItem.value) : null,
  )

  const coreCards = computed(() => coreItems.value.map(withDisplay))

  const statusLabel = (status) => {
    if (status === 'COMPLETED') return '완료'
    if (status === 'ACTIVE') return '진행 중'
    if (status === 'LOCKED') return '잠김'
    return status
  }

  const accentClass = (accent) => {
    const map = {
      yellow: 'bg-[#f6e7a8]',
      blue: 'bg-[#cfe4f5]',
      mint: 'bg-[#d4f0e4]',
      purple: 'bg-[#e4d7f5]',
      cream: 'bg-[#f5edd9]',
    }
    return map[accent] ?? map.cream
  }

  const openMainChapter = (item) => {
    if (item.status === 'LOCKED') return
    router.push({
      name: 'learning-main-chapter',
      params: { mainChapterId: item.mainChapterId },
    })
  }

  return {
    isLoading,
    error,
    foundationCard,
    coreCards,
    statusLabel,
    accentClass,
    openMainChapter,
  }
}
