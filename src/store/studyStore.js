import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  getContinuePosition,
  getCurriculum,
  getLearningProgress,
  getLessonPages,
  getSubChapterContent,
  saveLessonProgress,
} from '@/services/studyService.js'

export const useStudyStore = defineStore('study', () => {
  const curriculumItems = ref([])
  const learningItems = ref([])
  const continuePosition = ref(null)
  const currentContent = ref(null)
  const lessonPages = ref([])
  const lessonQuizQuestionIds = ref([])
  const currentPageId = ref(null)
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

  const pageIndex = computed(() => {
    if (!currentPageId.value || !lessonPages.value.length) return 0
    const index = lessonPages.value.findIndex((page) => page.id === currentPageId.value)
    return index >= 0 ? index : 0
  })

  const pageTotal = computed(() => lessonPages.value.length)

  const currentPage = computed(() => lessonPages.value[pageIndex.value] ?? null)

  const isLastPage = computed(() => pageTotal.value > 0 && pageIndex.value >= pageTotal.value - 1)

  const fetchCurriculum = async () => {
    try {
      const { data } = await getCurriculum()
      curriculumItems.value = data.items
    } catch (err) {
      if (err?.code === 'CURRICULUM_NOT_FOUND') {
        curriculumItems.value = []
      }
      throw err
    }
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
    try {
      const { data } = await getSubChapterContent(subChapterId)
      currentContent.value = data
      return data
    } catch (err) {
      currentContent.value = null
      throw err
    }
  }

  /**
   * 메타 + 소단원 강좌 JSON 로드 후 초기 page id 설정
   * @param {number} subChapterId
   * @param {string | null} [preferredPageId] route.query.page (= pages[].id)
   */
  const fetchLessonContent = async (subChapterId, preferredPageId = null) => {
    const meta = await fetchSubChapterContent(subChapterId)
    const { data } = await getLessonPages(meta.contentUrl)
    const pages = (data.pages ?? []).slice().sort((a, b) => a.order - b.order)
    lessonPages.value = pages
    lessonQuizQuestionIds.value = data.subChapterQuiz?.questionIds ?? []

    const fromPreferred =
      preferredPageId && pages.some((page) => page.id === preferredPageId) ? preferredPageId : null
    const fromProgress =
      meta.progress?.lastPageId && pages.some((page) => page.id === meta.progress.lastPageId)
        ? meta.progress.lastPageId
        : null

    currentPageId.value = fromPreferred || fromProgress || pages[0]?.id || null

    return { meta, lesson: data, pages }
  }

  /**
   * @param {string} pageId pages[].id
   * @param {{ persist?: boolean }} [options]
   */
  const setCurrentPage = async (pageId, options = {}) => {
    const { persist = true } = options
    if (!lessonPages.value.some((page) => page.id === pageId)) return
    currentPageId.value = pageId
    if (persist) {
      await saveProgress(pageId)
    }
  }

  /**
   * @param {string} [pageId]
   */
  const saveProgress = async (pageId) => {
    const subChapterId = currentContent.value?.subChapterId
    const lastPageId = pageId ?? currentPageId.value
    if (!subChapterId || !lastPageId) return null

    const { data } = await saveLessonProgress(subChapterId, { lastPageId })
    if (currentContent.value?.progress) {
      currentContent.value.progress.lastPageId = data.lastPageId
      currentContent.value.progress.status = data.status
    }
    return data
  }

  const goNextPage = async () => {
    if (isLastPage.value) return false
    const next = lessonPages.value[pageIndex.value + 1]
    if (!next) return false
    await setCurrentPage(next.id)
    return true
  }

  const goPrevPage = async () => {
    if (pageIndex.value <= 0) return false
    const prev = lessonPages.value[pageIndex.value - 1]
    if (!prev) return false
    await setCurrentPage(prev.id)
    return true
  }

  /** StudyNote용: 커리큘럼 + 소단원 목록 + 이어하기 */
  const fetchStudyNote = async () => {
    if (isLoading.value) return

    isLoading.value = true
    error.value = null

    try {
      await Promise.all([fetchCurriculum(), fetchContinuePosition()])

      const active = activeCurriculumItem.value
      if (!active) {
        learningItems.value = []
        return
      }

      await fetchLearningProgress(active.mainChapterId)
    } catch (err) {
      error.value = err?.message || '학습 현황을 불러오지 못했습니다.'
    } finally {
      isLoading.value = false
    }
  }

  const clearLesson = () => {
    lessonPages.value = []
    lessonQuizQuestionIds.value = []
    currentPageId.value = null
  }

  const clearStudy = () => {
    curriculumItems.value = []
    learningItems.value = []
    continuePosition.value = null
    currentContent.value = null
    clearLesson()
    error.value = null
  }

  return {
    curriculumItems,
    learningItems,
    continuePosition,
    currentContent,
    lessonPages,
    lessonQuizQuestionIds,
    currentPageId,
    isLoading,
    error,
    activeCurriculumItem,
    chapterTitle,
    progressPercent,
    continueRoute,
    totalScore,
    maxTotalScore,
    pageIndex,
    pageTotal,
    currentPage,
    isLastPage,
    fetchCurriculum,
    fetchLearningProgress,
    fetchContinuePosition,
    fetchSubChapterContent,
    fetchLessonContent,
    setCurrentPage,
    saveProgress,
    goNextPage,
    goPrevPage,
    fetchStudyNote,
    clearLesson,
    clearStudy,
  }
})
