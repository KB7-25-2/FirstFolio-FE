import { computed, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import { useStudyStore } from '@/store/studyStore.js'
import { SCORE_PER_QUESTION } from '@/constants/quizPolicy.js'

const OPTION_TONES = ['green', 'blue', 'pink', 'yellow']

export const useMainChapterScenarioQuiz = () => {
  const route = useRoute()
  const router = useRouter()
  const studyStore = useStudyStore()

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
  } = storeToRefs(studyStore)

  const isLoading = ref(false)
  const error = ref(null)
  const isCompleting = ref(false)

  const mainChapterId = computed(() => Number(route.params.mainChapterId))

  const opening = computed(() => scenarioDetail.value?.content?.opening ?? null)
  const conditions = computed(() => scenarioDetail.value?.content?.conditions ?? null)
  const scenarioTitle = computed(() => scenarioDetail.value?.title ?? '시나리오 퀴즈')
  const rewardStar = computed(() => scenarioDetail.value?.rewardStar ?? 0)

  const statusBadge = computed(() => {
    if (scenarioPhase.value === 'RESULT') {
      return { label: '완료', class: 'border-[#3d7a4a] text-[#3d7a4a]' }
    }
    if (scenarioPhase.value === 'INTRO') {
      return { label: '브리핑', class: 'border-[rgba(193,127,36,0.9)] text-[#c17f24]' }
    }
    const map = {
      IN_PROGRESS: { label: '상담 중', class: 'border-[rgba(193,127,36,0.9)] text-[#c17f24]' },
      SELECTED: { label: '답 선택', class: 'border-[#c17f24] text-[#c17f24]' },
      CORRECT: { label: '정답!', class: 'border-[rgba(193,127,36,0.9)] text-[#c17f24]' },
      WRONG: { label: '오답', class: 'border-[rgba(209,46,41,0.9)] text-[#d12e29]' },
    }
    return map[scenarioUiStatus.value]
  })

  const optionsWithTone = computed(() => {
    const options = scenarioCurrentStep.value?.options ?? []
    return options.map((opt, i) => ({
      ...opt,
      tone: OPTION_TONES[i % OPTION_TONES.length],
    }))
  })

  const primaryLabel = computed(() => {
    if (scenarioUiStatus.value === 'WRONG') return '다시 풀기'
    if (scenarioIsGraded.value) return scenarioIsLastStep.value ? '결과 보기' : '다음 문항 →'
    return '선택 제출'
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

  const goToMainChapter = () => {
    studyStore.clearScenarioSession()
    router.push({
      name: 'learning-main-chapter',
      params: { mainChapterId: mainChapterId.value },
    })
  }

  const giveUp = () => {
    goToMainChapter()
  }

  return {
    mainChapterId,
    isLoading,
    error,
    scenarioTitle,
    rewardStar,
    opening,
    conditions,
    statusBadge,
    scenarioPhase,
    scenarioCurrentStep,
    scenarioStepTotal,
    scenarioStepNumber,
    scenarioIsGraded,
    scenarioUiStatus,
    scenarioCorrectCount,
    scenarioAttemptResult,
    optionsWithTone,
    scorePerQuestion: SCORE_PER_QUESTION,
    primaryLabel,
    primaryEnabled,
    optionVariant,
    startGame,
    selectOption,
    onPrimaryAction,
    giveUp,
    goToMainChapter,
  }
}
