import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  DAILY_QUEST_QUESTION_TYPE_LABELS,
  getTodayDailyQuest,
  resetDailyQuestState,
  resolveInitialPhase,
  resolveResumeItemIndex,
  saveDailyQuestAnswer,
} from '@/services/dailyQuestService.js'

export const useDailyQuestStore = defineStore('dailyQuest', () => {
  /** @type {import('vue').Ref<import('@/types/dailyQuest.js').DailyQuest | null>} */
  const quest = ref(null)
  /** @type {import('vue').Ref<import('@/types/dailyQuest.js').DailyQuestPhase>} */
  const phase = ref('INTRO')
  /** 0-based items 인덱스 */
  const currentItemIndex = ref(0)

  const isLoading = ref(false)
  const isSaving = ref(false)
  const error = ref(null)
  const errorCode = ref(null)

  const items = computed(() => quest.value?.items ?? [])
  const status = computed(() => quest.value?.status ?? null)
  const answeredCount = computed(() => quest.value?.answeredCount ?? 0)
  const totalCount = computed(() => quest.value?.totalCount ?? 0)
  const correctCount = computed(() => quest.value?.correctCount ?? 0)
  const score = computed(() => quest.value?.score ?? 0)
  const questDate = computed(() => quest.value?.questDate ?? '')
  const questionTypes = computed(() => quest.value?.questionTypes ?? [])
  const questionTypeSummary = computed(() => quest.value?.questionTypeSummary ?? [])

  const isAssigned = computed(() => status.value === 'ASSIGNED')
  const isInProgress = computed(() => status.value === 'IN_PROGRESS')
  const isCompleted = computed(() => status.value === 'COMPLETED')

  const isIntro = computed(() => phase.value === 'INTRO')
  const isPlay = computed(() => phase.value === 'PLAY')
  const isResult = computed(() => phase.value === 'RESULT')

  const itemTotal = computed(() => items.value.length)
  const currentItem = computed(() => items.value[currentItemIndex.value] ?? null)
  const currentSnapshot = computed(() => currentItem.value?.questionSnapshot ?? null)
  const currentQuestionType = computed(() => currentSnapshot.value?.questionType ?? null)
  const currentQuestionTypeLabel = computed(() =>
    currentQuestionType.value
      ? (DAILY_QUEST_QUESTION_TYPE_LABELS[currentQuestionType.value] ?? currentQuestionType.value)
      : '',
  )
  const isCurrentScenario = computed(() => currentQuestionType.value === 'SCENARIO')
  const isCurrentObjective = computed(
    () =>
      currentQuestionType.value === 'SINGLE_CHOICE' ||
      currentQuestionType.value === 'MULTIPLE_CHOICE' ||
      currentQuestionType.value === 'TRUE_FALSE',
  )

  const questionNumber = computed(() => (currentItem.value ? currentItem.value.displayOrder : 0))
  const isLastItem = computed(
    () => itemTotal.value > 0 && currentItemIndex.value >= itemTotal.value - 1,
  )
  const isFirstItem = computed(() => currentItemIndex.value <= 0)

  const currentSelectedKey = computed(() => currentItem.value?.userAnswer?.selectedKey ?? null)
  const progressLabel = computed(() => `${answeredCount.value}/${totalCount.value || 5}`)

  /**
   * GET /daily-quests/today
   * — ASSIGNED → INTRO(유형 안내)
   * — IN_PROGRESS → PLAY(재개)
   * — COMPLETED → RESULT
   */
  const fetchToday = async () => {
    if (isLoading.value) return quest.value

    isLoading.value = true
    error.value = null
    errorCode.value = null

    try {
      const { data } = await getTodayDailyQuest()
      quest.value = data
      phase.value = resolveInitialPhase(data.status)
      currentItemIndex.value = data.status === 'ASSIGNED' ? 0 : resolveResumeItemIndex(data)
      return data
    } catch (err) {
      quest.value = null
      phase.value = 'INTRO'
      error.value = err?.message || '오늘의 퀘스트를 불러오지 못했습니다.'
      errorCode.value = err?.code ?? null
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /** INTRO에서 배정 유형 확인 후 풀이 시작 */
  const startPlay = () => {
    if (!quest.value || isCompleted.value) return
    phase.value = 'PLAY'
    currentItemIndex.value = resolveResumeItemIndex(quest.value)
  }

  /**
   * @param {string} selectedKey
   */
  const selectChoice = async (selectedKey) => {
    const item = currentItem.value
    if (!item || isCompleted.value || isSaving.value || phase.value !== 'PLAY') return

    isSaving.value = true
    error.value = null
    errorCode.value = null

    try {
      const { data } = await saveDailyQuestAnswer({
        dailyQuestItemId: item.dailyQuestItemId,
        answer: { selectedKey },
      })

      if (quest.value) {
        const target = quest.value.items.find(
          (row) => row.dailyQuestItemId === data.dailyQuestItemId,
        )
        if (target) {
          target.userAnswer = data.userAnswer
          target.answeredAt = new Date().toISOString()
        }
        quest.value.answeredCount = data.answeredCount
        quest.value.status = data.status
      }

      return data
    } catch (err) {
      error.value = err?.message || '답안을 저장하지 못했습니다.'
      errorCode.value = err?.code ?? null
      throw err
    } finally {
      isSaving.value = false
    }
  }

  const goNextItem = () => {
    if (isLastItem.value) return
    currentItemIndex.value += 1
  }

  const goPrevItem = () => {
    if (isFirstItem.value) return
    currentItemIndex.value -= 1
  }

  /**
   * @param {number} index
   */
  const goToItem = (index) => {
    if (index < 0 || index >= itemTotal.value) return
    currentItemIndex.value = index
  }

  const clear = () => {
    quest.value = null
    phase.value = 'INTRO'
    currentItemIndex.value = 0
    error.value = null
    errorCode.value = null
    resetDailyQuestState()
  }

  return {
    quest,
    session: quest,
    phase,
    currentItemIndex,
    currentQuestionIndex: currentItemIndex,
    isLoading,
    isSaving,
    error,
    errorCode,
    items,
    questions: items,
    status,
    answeredCount,
    totalCount,
    correctCount,
    score,
    questDate,
    questionTypes,
    questionTypeSummary,
    formatSummary: questionTypeSummary,
    isAssigned,
    isNotStarted: isAssigned,
    isInProgress,
    isCompleted,
    isIntro,
    isPlay,
    isResult,
    itemTotal,
    questionTotal: itemTotal,
    currentItem,
    currentQuestion: currentItem,
    currentSnapshot,
    currentQuestionType,
    currentQuestionTypeLabel,
    currentFormat: currentQuestionType,
    currentFormatLabel: currentQuestionTypeLabel,
    isCurrentScenario,
    isCurrentObjective,
    isCurrentQuiz: isCurrentObjective,
    questionNumber,
    isLastItem,
    isLastQuestion: isLastItem,
    isFirstItem,
    isFirstQuestion: isFirstItem,
    currentSelectedKey,
    progressLabel,
    fetchToday,
    startPlay,
    selectChoice,
    goNextItem,
    goPrevItem,
    goToItem,
    goNextQuestion: goNextItem,
    goPrevQuestion: goPrevItem,
    goToQuestion: goToItem,
    clear,
  }
})
