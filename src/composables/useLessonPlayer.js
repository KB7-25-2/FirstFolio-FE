import { computed, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import { useStudyStore } from '@/store/studyStore.js'
import { needsQuizAttempt } from '@/services/study/mappers/subChapterMapper.js'

export const useLessonPlayer = () => {
  const route = useRoute()
  const router = useRouter()
  const studyStore = useStudyStore()
  const { currentContent, currentPage, pageIndex, pageTotal, isLastPage, currentPageId } =
    storeToRefs(studyStore)

  const isLoading = ref(false)
  const error = ref(null)
  const learnMoreOpen = ref(false)
  const learnMorePayload = ref(null)
  /** 강좌 COMPLETED 후 퀴즈 미응시 */
  const needsQuiz = ref(false)

  const subChapterId = computed(() => Number(route.params.subChapterId))
  const pageCurrent = computed(() => pageIndex.value + 1)

  const chapterLabel = computed(() => {
    const mainId = currentContent.value?.mainChapterId
    if (mainId) return `CHAPTER ${String(mainId).padStart(2, '0')}`
    const id = currentContent.value?.subChapterId ?? subChapterId.value
    if (!id) return 'CHAPTER'
    return `CHAPTER ${String(id % 100).padStart(2, '0')}`
  })

  const chapterTitle = computed(
    () => currentContent.value?.title || `소단원 #${subChapterId.value}`,
  )

  const quizProgressLabel = computed(() => {
    const quiz = currentContent.value?.progress?.quiz
    if (!quiz?.totalCount) return null
    return `${quiz.answeredCount}/${quiz.totalCount} 문항`
  })

  const syncPageQuery = (pageId) => {
    if (!pageId || route.query.page === pageId) return
    router.replace({
      name: 'learning-lesson',
      params: { subChapterId: subChapterId.value },
      query: { page: pageId },
    })
  }

  const goToQuiz = () => {
    router.push({
      name: 'learning-quiz',
      params: { subChapterId: subChapterId.value },
    })
  }

  const loadContent = async () => {
    isLoading.value = true
    error.value = null
    needsQuiz.value = false
    try {
      const preferred = typeof route.query.page === 'string' ? route.query.page : null
      const result = await studyStore.fetchLessonContent(subChapterId.value, preferred)
      needsQuiz.value = Boolean(result?.needsQuiz)
      if (!needsQuiz.value) {
        syncPageQuery(studyStore.currentPageId)
      }
    } catch (err) {
      studyStore.clearLesson()
      if (err?.code === 'PREREQUISITE_REQUIRED') {
        error.value = '선행 학습이 필요합니다.'
      } else if (err?.code === 'SUB_CHAPTER_NOT_FOUND') {
        error.value = '공개 소단원을 찾을 수 없습니다.'
      } else if (err?.code === 'CONTENT_NOT_FOUND') {
        error.value = '학습 페이지를 찾을 수 없습니다.'
      } else {
        error.value = err?.message || '학습 콘텐츠를 불러오지 못했습니다.'
      }
    } finally {
      isLoading.value = false
    }
  }

  onMounted(loadContent)

  watch(subChapterId, () => {
    loadContent()
  })

  watch(
    () => currentContent.value?.progress,
    (progress) => {
      if (needsQuizAttempt(progress)) {
        needsQuiz.value = true
      }
    },
    { deep: true },
  )

  watch(currentPageId, (pageId) => {
    if (needsQuiz.value) return
    if (pageId) syncPageQuery(pageId)
  })

  const openLearnMore = (block) => {
    learnMorePayload.value = block?.modal ?? null
    learnMoreOpen.value = true
  }

  const closeLearnMore = () => {
    learnMoreOpen.value = false
  }

  let touchStartX = 0
  const onTouchStart = (event) => {
    touchStartX = event.changedTouches[0]?.clientX ?? 0
  }
  const onTouchEnd = async (event) => {
    if (needsQuiz.value) return
    const endX = event.changedTouches[0]?.clientX ?? 0
    const delta = endX - touchStartX
    if (Math.abs(delta) < 48) return
    if (delta > 0) await studyStore.goPrevPage()
    else await studyStore.goNextPage()
  }

  const onPrimaryAction = async () => {
    if (isLastPage.value) {
      const lastPage = studyStore.lessonPages[studyStore.lessonPages.length - 1]
      try {
        if (lastPage?.id) {
          await studyStore.saveProgress(lastPage.id, { status: 'COMPLETED' })
        }
      } catch {
        // 진도 저장 실패여도 퀴즈 CTA는 보여 준다
      }
      needsQuiz.value = true
      return
    }
    await studyStore.goNextPage()
  }

  const isFirstPage = computed(() => pageIndex.value <= 0)

  const goPrevCut = async () => {
    if (isFirstPage.value) return
    await studyStore.goPrevPage()
  }

  const stopLearning = () => {
    const mainChapterId = currentContent.value?.mainChapterId
    if (mainChapterId) {
      router.push({
        name: 'learning',
        query: { mainChapterId: String(mainChapterId) },
      })
      return
    }
    router.back()
  }

  return {
    currentPage,
    pageTotal,
    isLastPage,
    isFirstPage,
    isLoading,
    error,
    needsQuiz,
    quizProgressLabel,
    learnMoreOpen,
    learnMorePayload,
    pageCurrent,
    chapterLabel,
    chapterTitle,
    openLearnMore,
    closeLearnMore,
    onTouchStart,
    onTouchEnd,
    onPrimaryAction,
    goPrevCut,
    goToQuiz,
    stopLearning,
  }
}
