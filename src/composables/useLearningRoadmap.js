import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStudyStore } from '@/store/studyStore.js'
import { getMainChapterDisplay } from '@/constants/mainChapterDisplay.js'

/**
 * 대단원 × 소단원 목차(체크리스트) 로드맵
 */
export const useLearningRoadmap = () => {
  const studyStore = useStudyStore()
  const router = useRouter()
  const route = useRoute()

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

  const withDisplay = (stage) => ({
    ...stage,
    ...getMainChapterDisplay(stage.mainChapterId),
  })

  const loadStages = async () => {
    isLoading.value = true
    error.value = null
    actionError.value = null
    try {
      const { stages: nextStages } = await studyStore.fetchRoadmap()
      stages.value = (nextStages ?? []).map(withDisplay)
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
    loadStages()
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
    const id = focusMainChapterId.value
    if (!id || !stages.value.length) {
      const activeIdx = stages.value.findIndex((stage) => stage.status === 'ACTIVE')
      activeStageIndex.value = activeIdx >= 0 ? activeIdx : 0
      return
    }
    const index = stages.value.findIndex((stage) => stage.mainChapterId === id)
    activeStageIndex.value = index >= 0 ? index : 0
  }

  const selectStage = (index) => {
    if (index < 0 || index >= stages.value.length) return
    activeStageIndex.value = index
    const stage = stages.value[index]
    if (!stage) return
    router.replace({
      name: 'learning',
      query: { mainChapterId: String(stage.mainChapterId) },
    })
  }

  watch([stages, focusMainChapterId, isLoading], async ([, , loading]) => {
    if (loading) return
    if (!stages.value.length) return
    syncActiveFromQuery()
    await nextTick()
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
