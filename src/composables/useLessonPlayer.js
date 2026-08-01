import { computed, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import { useStudyStore } from '@/store/studyStore.js'

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

  const syncPageQuery = (pageId) => {
    if (!pageId || route.query.page === pageId) return
    router.replace({
      name: 'learning-lesson',
      params: { subChapterId: subChapterId.value },
      query: { page: pageId },
    })
  }

  const loadContent = async () => {
    isLoading.value = true
    error.value = null
    try {
      const preferred = typeof route.query.page === 'string' ? route.query.page : null
      await studyStore.fetchLessonContent(subChapterId.value, preferred)
      syncPageQuery(studyStore.currentPageId)
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

  watch(currentPageId, (pageId) => {
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
    const endX = event.changedTouches[0]?.clientX ?? 0
    const delta = endX - touchStartX
    if (Math.abs(delta) < 48) return
    if (delta > 0) await studyStore.goPrevPage()
    else await studyStore.goNextPage()
  }

  const onPrimaryAction = async () => {
    if (isLastPage.value) {
      router.push({
        name: 'learning-quiz',
        params: { subChapterId: subChapterId.value },
      })
      return
    }
    await studyStore.goNextPage()
  }

  const stopLearning = () => {
    const mainChapterId = currentContent.value?.mainChapterId
    if (mainChapterId) {
      router.push({
        name: 'learning-main-chapter',
        params: { mainChapterId },
      })
      return
    }
    router.back()
  }

  return {
    currentPage,
    pageTotal,
    isLastPage,
    isLoading,
    error,
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
    stopLearning,
  }
}
