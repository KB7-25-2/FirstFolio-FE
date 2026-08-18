import { computed, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import { useStudyStore } from '@/store/studyStore.js'
import { usePortfolioStore } from '@/store/portfolioStore.js'

export const useMainChapterScenarioQuiz = () => {
  const route = useRoute()
  const router = useRouter()
  const studyStore = useStudyStore()
  const portfolioStore = usePortfolioStore()

  const {
    scenarioDetail,
    scenarioPhase,
    scenarioUiStatus,
    scenarioSelectedKey,
    scenarioCurrentStep,
    scenarioStepTotal,
    scenarioStepNumber,
    scenarioIsLastStep,
    scenarioIsGraded,
    scenarioCorrectCount,
    scenarioAttemptResult,
    pendingFoundationUnlock,
  } = storeToRefs(studyStore)

  const isLoading = ref(false)
  const error = ref(null)
  const isCompleting = ref(false)
  const showUnlockCeremony = ref(false)
  const isGranting = ref(false)

  const mainChapterId = computed(() => Number(route.params.mainChapterId))

  const opening = computed(() => scenarioDetail.value?.content?.opening ?? null)
  const conditions = computed(() => scenarioDetail.value?.content?.conditions ?? null)
  const scenarioTitle = computed(() => scenarioDetail.value?.title ?? '시나리오 퀴즈')
  const rewardStar = computed(() => scenarioDetail.value?.rewardStar ?? 0)

  const chapterTitle = computed(
    () => scenarioDetail.value?.content?.chapterTitle || scenarioTitle.value,
  )
  const chapterSubtitle = computed(
    () => scenarioDetail.value?.content?.chapterSubtitle || '금융 상담 실전',
  )

  const stampLabel = computed(() => {
    if (scenarioPhase.value === 'INTRO') return '상담실'
    if (scenarioPhase.value === 'RESULT') {
      return `${scenarioStepTotal.value}/${scenarioStepTotal.value}`
    }
    return `${scenarioStepNumber.value}/${scenarioStepTotal.value}`
  })

  const progressRatio = computed(() => {
    if (scenarioPhase.value === 'INTRO') return '33%'
    if (scenarioPhase.value === 'RESULT' || !scenarioStepTotal.value) return '100%'
    return `${Math.round((scenarioStepNumber.value / scenarioStepTotal.value) * 100)}%`
  })

  const showClientScene = computed(
    () => scenarioPhase.value === 'PLAY' || scenarioPhase.value === 'RESULT',
  )

  const scenarioOptions = computed(() => scenarioCurrentStep.value?.options ?? [])

  const stepCorrectOption = computed(() => {
    const step = scenarioCurrentStep.value
    if (!step) return null
    return step.options?.find((opt) => opt.key === step.correctKey) ?? null
  })

  const stepSelectedOption = computed(() => {
    const step = scenarioCurrentStep.value
    const key = scenarioSelectedKey.value
    if (!step || !key) return null
    return step.options?.find((opt) => opt.key === key) ?? null
  })

  const correctOption = computed(() => {
    const steps = scenarioDetail.value?.content?.steps ?? []
    const lastCorrect = [...steps].reverse().find((step) => step.correctKey)
    const step = lastCorrect || scenarioCurrentStep.value
    return step?.options?.find((opt) => opt.key === step.correctKey) ?? null
  })

  const evaluationScore = computed(() => {
    if (scenarioAttemptResult.value?.quizScore != null) {
      return scenarioAttemptResult.value.quizScore
    }
    if (scenarioUiStatus.value === 'CORRECT') return 92
    if (scenarioUiStatus.value === 'WRONG') return 28
    return 0
  })

  const evaluationTone = computed(() => (scenarioUiStatus.value === 'WRONG' ? 'fail' : 'pass'))

  const evaluationStamp = computed(() => (scenarioUiStatus.value === 'WRONG' ? '부적합' : '최적'))

  const primaryLabel = computed(() => {
    if (scenarioUiStatus.value === 'WRONG') return '다시 풀기'
    if (scenarioIsGraded.value) return scenarioIsLastStep.value ? '결과 확인' : '다음 문항'
    return '결과 확인'
  })

  const primaryEnabled = computed(() => {
    if (isCompleting.value) return false
    if (scenarioUiStatus.value === 'WRONG') return true
    if (scenarioIsGraded.value) return true
    return scenarioUiStatus.value === 'SELECTED'
  })

  const optionVariant = (key) => {
    if (scenarioUiStatus.value === 'IN_PROGRESS') return 'default'
    if (scenarioUiStatus.value === 'SELECTED') {
      return scenarioSelectedKey.value === key ? 'selected' : 'default'
    }
    if (key === scenarioCurrentStep.value?.correctKey) return 'correct'
    if (scenarioUiStatus.value === 'WRONG' && key === scenarioSelectedKey.value) return 'wrong'
    return 'default'
  }

  const loadScenario = async () => {
    isLoading.value = true
    error.value = null
    try {
      await studyStore.startMainChapterScenarioQuiz(mainChapterId.value)
    } catch (err) {
      studyStore.clearScenarioSession()
      if (err?.code === 'CHAPTER_GAME_NOT_FOUND' || err?.code === 'CHAPTER_GAME_LOCKED') {
        error.value = '시나리오 게임에 진입할 수 없습니다.'
      } else if (err?.code === 'SCENARIO_NOT_FOUND' || err?.code === 'STEPS_NOT_FOUND') {
        error.value = '시나리오 문항을 찾을 수 없습니다.'
      } else {
        error.value = err?.message || '시나리오를 불러오지 못했습니다.'
      }
    } finally {
      isLoading.value = false
    }
  }

  onMounted(loadScenario)

  watch(mainChapterId, () => {
    loadScenario()
  })

  const startGame = () => {
    studyStore.beginScenarioPlay()
  }

  const selectOption = (key) => {
    studyStore.selectScenarioOption(key)
  }

  const onPrimaryAction = async () => {
    if (scenarioUiStatus.value === 'WRONG') {
      studyStore.retryCurrentScenarioStep()
      return
    }

    if (scenarioIsGraded.value) {
      const finished = studyStore.goNextScenarioStep()
      if (finished) {
        isCompleting.value = true
        try {
          await studyStore.completeScenarioAttempt()
        } catch (err) {
          error.value = err?.message || '채점 결과를 저장하지 못했습니다.'
          studyStore.scenarioPhase = 'PLAY'
        } finally {
          isCompleting.value = false
        }
      }
      return
    }

    studyStore.submitCurrentScenarioStep()
  }

  const retryScenario = async () => {
    await loadScenario()
  }

  const goToMainChapter = () => {
    studyStore.clearScenarioSession()
    router.push({
      name: 'learning',
      query: { mainChapterId: String(mainChapterId.value) },
    })
  }

  /** 수료 후 로드맵으로 — 커리큘럼 ACTIVE/COMPLETED 반영 확인 */
  const goToRoadmap = () => {
    if (pendingFoundationUnlock.value) {
      showUnlockCeremony.value = true
      return
    }
    studyStore.clearScenarioSession()
    router.push({ name: 'learning' })
  }

  const dismissUnlockCeremony = () => {
    showUnlockCeremony.value = false
    studyStore.clearFoundationUnlock()
    studyStore.clearScenarioSession()
    router.push({ name: 'home' })
  }

  const confirmUnlockCeremony = async () => {
    if (isGranting.value) return
    isGranting.value = true
    try {
      await portfolioStore.grantFoundationCash()
      studyStore.clearFoundationUnlock()
      studyStore.clearScenarioSession()
      showUnlockCeremony.value = false
      await router.push({ name: 'portfolio-purchase' })
    } catch (err) {
      error.value = err?.message || '모의투자금 지급에 실패했습니다.'
    } finally {
      isGranting.value = false
    }
  }

  watch(pendingFoundationUnlock, (pending) => {
    if (pending && scenarioPhase.value === 'RESULT') {
      showUnlockCeremony.value = true
    }
  })

  return {
    mainChapterId,
    isLoading,
    error,
    scenarioTitle,
    rewardStar,
    opening,
    conditions,
    chapterTitle,
    chapterSubtitle,
    stampLabel,
    progressRatio,
    showClientScene,
    scenarioPhase,
    scenarioCurrentStep,
    scenarioStepTotal,
    scenarioStepNumber,
    scenarioIsGraded,
    scenarioUiStatus,
    scenarioCorrectCount,
    scenarioAttemptResult,
    scenarioOptions,
    stepCorrectOption,
    stepSelectedOption,
    correctOption,
    evaluationScore,
    evaluationTone,
    evaluationStamp,
    primaryLabel,
    primaryEnabled,
    optionVariant,
    startGame,
    selectOption,
    onPrimaryAction,
    retryScenario,
    goToMainChapter,
    goToRoadmap,
    showUnlockCeremony,
    isGranting,
    confirmUnlockCeremony,
    dismissUnlockCeremony,
    pendingFoundationUnlock,
  }
}
