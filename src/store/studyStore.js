import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  getContinuePosition,
  getCurriculum,
  getLearningProgress,
  getSubChapterContent,
} from '@/services/studyService.js'

export const useStudyStore = defineStore('study', () => {
  const curriculumItems = ref([])
  const learningItems = ref([])
  const continuePosition = ref(null)
  const currentContent = ref(null)
  const isLoading = ref(false)
  const error = ref(null)

  /** StudyNote에 표시할 활성 대단원 */
  const activeCurriculumItem = computed(
    () => curriculumItems.value.find((item) => item.status === 'ACTIVE') ?? null,
  )

  const chapterTitle = computed(() => activeCurriculumItem.value?.title ?? '')

  const progressPercent = computed(
    () =>
      continuePosition.value?.progressPercent ?? activeCurriculumItem.value?.progressPercent ?? 0,
  )

  /** 「이어서 →」 이동 경로 */
  const continueRoute = computed(() => continuePosition.value?.route ?? null)

  const totalScore = computed(() =>
    learningItems.value.reduce((sum, item) => sum + (item.quizScore ?? 0), 0),
  )

  const maxTotalScore = computed(() => learningItems.value.length * 100)

  const fetchCurriculum = async () => {
    const { data } = await getCurriculum()
    curriculumItems.value = data.items
  }

  const fetchLearningProgress = async (mainChapterId) => {
    const { data } = await getLearningProgress(mainChapterId)
    learningItems.value = data.items
  }

  const fetchContinuePosition = async () => {
    try {
      const { data } = await getContinuePosition()
      continuePosition.value = data
    } catch (err) {
      if (err.code === 'CONTINUE_POSITION_NOT_FOUND') {
        continuePosition.value = null
        return
      }
      throw err
    }
  }

  /**
   * 소단원 강좌 진입 시 콘텐츠 URL·진행 정보 로드
   * @param {number} subChapterId
   */
  const fetchSubChapterContent = async (subChapterId) => {
    const { data } = await getSubChapterContent(subChapterId)
    currentContent.value = data
    return data
  }

  /** StudyNote용: 커리큘럼 + 소단원 목록 + 이어하기 */
  const fetchStudyNote = async () => {
    isLoading.value = true
    error.value = null

    try {
      await fetchCurriculum()
      await fetchContinuePosition()

      const active = activeCurriculumItem.value
      if (!active) {
        learningItems.value = []
        return
      }

      await fetchLearningProgress(active.mainChapterId)
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const clearStudy = () => {
    curriculumItems.value = []
    learningItems.value = []
    continuePosition.value = null
    currentContent.value = null
    error.value = null
  }

  return {
    curriculumItems,
    learningItems,
    continuePosition,
    currentContent,
    isLoading,
    error,
    activeCurriculumItem,
    chapterTitle,
    progressPercent,
    continueRoute,
    totalScore,
    maxTotalScore,
    fetchCurriculum,
    fetchLearningProgress,
    fetchContinuePosition,
    fetchSubChapterContent,
    fetchStudyNote,
    clearStudy,
  }
})
