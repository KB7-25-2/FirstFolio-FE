import { computed, nextTick, onActivated, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useStudyStore } from '@/store/studyStore.js'
import { getLearningProgress } from '@/services/studyService.js'
import { getMainChapterDisplay } from '@/constants/mainChapterDisplay.js'
import { withScheduleStatus } from '@/utils/scheduleStatus.js'
import { getPersistedMainChapterId, persistRoadmapFocus } from '@/utils/learningRoadmapFocus.js'

/**
 * 대단원 × 소단원 목차(체크리스트) 로드맵
 */
export const useLearningRoadmap = () => {
  const studyStore = useStudyStore()
  const router = useRouter()
  const route = useRoute()
  const { curriculumItems } = storeToRefs(studyStore)

  /** 학습 로드맵 화면이 활성일 때만 라우트 쿼리와 동기화 (다른 탭에서도 route watch가 돌음) */
  const isRoadmapRouteActive = computed(
    () => route.name === 'learning' || route.path === '/learning',
  )

  const isLoading = ref(false)
  const error = ref(null)
  const actionError = ref(null)
  const activeStageIndex = ref(0)

  /**
   * @typedef {object} RoadmapStage
   * @property {number} mainChapterId
   * @property {number} curriculumItemId
   * @property {string} title
   * @property {string} status
   * @property {number} progressPercent
   * @property {string} [description]
   * @property {string} [accent]
   * @property {string} [icon]
   * @property {string} chapterType
   * @property {number} displayOrder
   * @property {Array} periods
   * @property {boolean} scenarioReady
   * @property {string} scenarioTitle
   * @property {string} scenarioSubtitle
   */

  /** @type {import('vue').Ref<RoadmapStage[]>} */
  const stages = ref([])

  const withDisplay = (item) => ({
    ...item,
    ...getMainChapterDisplay(item.mainChapterId),
  })

  const orderedChapters = computed(() => {
    const items = curriculumItems.value.slice().sort((a, b) => a.displayOrder - b.displayOrder)
    return items.map(withDisplay)
  })

  const buildStageFromItems = (chapter, items) => {
    const withStatus = withScheduleStatus(items)
    let periods = withStatus.filter((row) => row.entryType !== 'SCENARIO_QUIZ')
    const scenarioItem = withStatus.find((row) => row.entryType === 'SCENARIO_QUIZ') ?? null

    if (chapter.status === 'LOCKED') {
      periods = periods.map((row) => ({ ...row, scheduleStatus: 'LOCKED' }))
    }

    const lessonsDone =
      chapter.status !== 'LOCKED' &&
      periods.length > 0 &&
      periods.every((row) => row.status === 'COMPLETED')
    const scenarioReady =
      lessonsDone && Boolean(scenarioItem) && scenarioItem.status !== 'COMPLETED'

    return {
      mainChapterId: chapter.mainChapterId,
      curriculumItemId: chapter.curriculumItemId,
      title: chapter.title,
      status: chapter.status,
      progressPercent: chapter.progressPercent ?? 0,
      description: chapter.description ?? '',
      accent: chapter.accent,
      icon: chapter.icon,
      chapterType: chapter.chapterType,
      displayOrder: chapter.displayOrder,
      periods,
      scenarioReady,
      scenarioTitle: scenarioItem?.title ?? '대단원 실전 퀴즈',
      scenarioSubtitle: scenarioItem?.periodSubtitle ?? '배운 내용을 실전 상황에서 점검해요',
    }
  }

  const loadStages = async () => {
    isLoading.value = true
    error.value = null
    actionError.value = null
    try {
      await studyStore.fetchCurriculum()
      const chapters = orderedChapters.value
      /** @type {RoadmapStage[]} */
      const nextStages = []

      for (const chapter of chapters) {
        try {
          const { data } = await getLearningProgress(chapter.mainChapterId)
          nextStages.push(buildStageFromItems(chapter, data.items ?? []))
        } catch {
          nextStages.push(buildStageFromItems(chapter, []))
        }
      }

      stages.value = nextStages
    } catch (err) {
      if (err?.code === 'CURRICULUM_NOT_FOUND') {
        error.value = '확정된 커리큘럼이 없습니다.'
      } else {
        error.value = err?.message || '학습 로드맵을 불러오지 못했습니다.'
      }
      stages.value = []
    } finally {
      isLoading.value = false
    }
  }

  onMounted(() => {
    // KeepAlive 재활성화 시 재요청하지 않음 (포커스·스크롤 유지)
    if (!stages.value.length) loadStages()
  })

  const statusLabel = (status) => {
    if (status === 'COMPLETED') return '완료'
    if (status === 'ACTIVE') return '진행 중'
    if (status === 'LOCKED') return '잠김'
    return status
  }

  const periodStatusLabel = (scheduleStatus) => {
    if (scheduleStatus === 'COMPLETED') return '완료'
    if (scheduleStatus === 'IN_PROGRESS') return '진행 중'
    if (scheduleStatus === 'NEXT') return '다음'
    if (scheduleStatus === 'LOCKED') return '잠김'
    return scheduleStatus
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

  const openPeriod = async (period) => {
    actionError.value = null
    if (period.scheduleStatus === 'LOCKED') return
    if (!period.subChapterId) return

    try {
      await studyStore.fetchSubChapterContent(period.subChapterId)
      const page = studyStore.currentContent?.progress?.lastPageId
      router.push({
        name: 'learning-lesson',
        params: { subChapterId: period.subChapterId },
        query: page ? { page } : undefined,
      })
    } catch (err) {
      if (err?.code === 'PREREQUISITE_REQUIRED') {
        actionError.value = '선행 학습을 먼저 완료해 주세요.'
      } else if (err?.code === 'SUB_CHAPTER_NOT_FOUND') {
        actionError.value = '공개된 소단원을 찾을 수 없습니다.'
      } else {
        actionError.value = err?.message || '학습 콘텐츠를 불러오지 못했습니다.'
      }
    }
  }

  const startScenarioQuiz = (stage) => {
    if (!stage || stage.status === 'LOCKED' || !stage.scenarioReady) return
    router.push({
      name: 'learning-scenario-quiz',
      params: { mainChapterId: stage.mainChapterId },
    })
  }

  const focusMainChapterId = computed(() => {
    const raw = route.query.mainChapterId
    if (raw == null || raw === '') return null
    const id = Number(Array.isArray(raw) ? raw[0] : raw)
    return Number.isFinite(id) ? id : null
  })

  const activeStage = computed(() => stages.value[activeStageIndex.value] ?? null)

  const syncActiveFromQuery = () => {
    if (!isRoadmapRouteActive.value) return
    if (!stages.value.length) return

    // 스크롤/탭으로 갱신된 persist가 우선 (쿼리는 이전 select 값이 남아 있을 수 있음)
    const id = getPersistedMainChapterId() ?? focusMainChapterId.value
    if (!id) {
      const activeIdx = stages.value.findIndex((stage) => stage.status === 'ACTIVE')
      activeStageIndex.value = activeIdx >= 0 ? activeIdx : 0
      const fallback = stages.value[activeStageIndex.value]
      if (fallback) persistRoadmapFocus(activeStageIndex.value, fallback.mainChapterId)
      return
    }
    const index = stages.value.findIndex((stage) => stage.mainChapterId === id)
    activeStageIndex.value = index >= 0 ? index : 0
    const stage = stages.value[activeStageIndex.value]
    if (stage) persistRoadmapFocus(activeStageIndex.value, stage.mainChapterId)
  }

  const selectStage = (index) => {
    if (index < 0 || index >= stages.value.length) return
    activeStageIndex.value = index
    const stage = stages.value[index]
    if (!stage) return
    persistRoadmapFocus(index, stage.mainChapterId)
    if (isRoadmapRouteActive.value) {
      router.replace({
        name: 'learning',
        query: { mainChapterId: String(stage.mainChapterId) },
      })
    }
  }

  watch(
    [stages, focusMainChapterId, isLoading, isRoadmapRouteActive],
    async ([, , loading, active]) => {
      if (!active || loading) return
      if (!stages.value.length) return
      syncActiveFromQuery()
      await nextTick()
    },
  )

  onActivated(() => {
    if (!isRoadmapRouteActive.value) return
    const persisted = getPersistedMainChapterId()
    // 탭 복귀 시 URL 쿼리가 비었거나 스크롤 persist와 어긋나면 persist 기준으로 맞춤
    if (persisted != null && focusMainChapterId.value !== persisted) {
      router.replace({
        name: 'learning',
        query: { mainChapterId: String(persisted) },
      })
      return
    }
    syncActiveFromQuery()
  })

  const hasRoadmap = computed(() => stages.value.length > 0)

  return {
    isLoading,
    error,
    actionError,
    stages,
    activeStage,
    activeStageIndex,
    hasRoadmap,
    statusLabel,
    periodStatusLabel,
    accentClass,
    openPeriod,
    startScenarioQuiz,
    selectStage,
    focusMainChapterId,
    loadStages,
  }
}
