import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  DAILY_QUEST_QUESTION_TYPE_LABELS,
  getTodayDailyQuest,
  resetDailyQuestState,
  resolveInitialPhase,
  resolveResumeItemIndex,
  saveDailyQuestAnswer,
  submitDailyQuest,
} from '@/services/dailyQuestService.js'
import { useUserStore } from '@/store/userStore.js'

export const useDailyQuestStore = defineStore('dailyQuest', () => {
  /** @type {import('vue').Ref<import('@/types/dailyQuest.js').DailyQuest | null>} */
  const quest = ref(null)
  /** @type {import('vue').Ref<import('@/types/dailyQuest.js').DailyQuestPhase>} */
  const phase = ref('INTRO')
  /** @type {import('vue').Ref<import('@/types/dailyQuest.js').DailyQuestSubmitResult | null>} */
  const submitResult = ref(null)
  /** 0-based items 인덱스 */
  const currentItemIndex = ref(0)

  const isLoading = ref(false)
  const isSaving = ref(false)
  const isSubmitting = ref(false)
  const error = ref(null)
  const errorCode = ref(null)

  const items = computed(() => quest.value?.items ?? [])
  const status = computed(() => quest.value?.status ?? null)
  const answeredCount = computed(() => quest.value?.answeredCount ?? 0)
  const totalCount = computed(() => quest.value?.totalCount ?? 0)
  const correctCount = computed(
    () => submitResult.value?.correctCount ?? quest.value?.correctCount ?? 0,
  )
  const score = computed(() => submitResult.value?.score ?? quest.value?.score ?? 0)
  const questDate = computed(() => quest.value?.questDate ?? '')
  const questionTypes = computed(() => quest.value?.questionTypes ?? [])
  const questionTypeSummary = computed(() => quest.value?.questionTypeSummary ?? [])

  const isAssigned = computed(() => status.value === 'ASSIGNED')
  const isInProgress = computed(() => status.value === 'IN_PROGRESS')
  const isCompleted = computed(() => status.value === 'COMPLETED')
  const allAnswered = computed(
    () =>
      itemTotal.value > 0 &&
      answeredCount.value >= totalCount.value &&
      items.value.every((item) => item.userAnswer != null),
  )
  const canSubmit = computed(() => allAnswered.value && !isCompleted.value)

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

  const rewardPoints = computed(() => submitResult.value?.reward?.points ?? 0)
  const resultRows = computed(() => submitResult.value?.results ?? [])

  const fetchToday = async () => {
    if (isLoading.value) return quest.value

    isLoading.value = true
    error.value = null
    errorCode.value = null

    try {
      const { data } = await getTodayDailyQuest()
      quest.value = data
      phase.value = resolveInitialPhase(data.status)
      currentItemIndex.value = 0

      if (data.status === 'COMPLETED') {
        // 재진입 시 제출 결과 복원
        const { data: submitted } = await submitDailyQuest()
        submitResult.value = submitted
        phase.value = 'RESULT'
      } else {
        submitResult.value = null
      }

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

  /** 허브에서 문항 선택 → 풀이 */
  const openItem = (index) => {
    if (!quest.value || isCompleted.value) return
    if (index < 0 || index >= itemTotal.value) return
    currentItemIndex.value = index
    phase.value = 'PLAY'
  }

  const backToHub = () => {
    if (isCompleted.value) {
      phase.value = 'RESULT'
      return
    }
    phase.value = 'INTRO'
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

  /** 선택 저장 후 허브로 */
  const saveAndReturnToHub = async (selectedKey) => {
    await selectChoice(selectedKey)
    phase.value = 'INTRO'
  }

  const submitToday = async () => {
    if (isSubmitting.value) return null

    // 이미 완료된 경우 — 결과 화면으로 (멱등 재조회)
    if (isCompleted.value) {
      if (submitResult.value) {
        phase.value = 'RESULT'
        return submitResult.value
      }
    } else if (!canSubmit.value) {
      return null
    }

    isSubmitting.value = true
    error.value = null
    errorCode.value = null

    try {
      const { data } = await submitDailyQuest()
      submitResult.value = data

      if (quest.value) {
        quest.value.status = 'COMPLETED'
        quest.value.correctCount = data.correctCount
        quest.value.score = data.score
        quest.value.answeredCount = data.totalCount
        quest.value.completedAt = new Date().toISOString()

        for (const row of data.results) {
          const item = quest.value.items.find((i) => i.dailyQuestItemId === row.dailyQuestItemId)
          if (item) {
            item.isCorrect = row.isCorrect
            if (item.questionSnapshot) {
              item.questionSnapshot.explanation = row.explanation
            }
          }
        }
      }

      phase.value = 'RESULT'

      // 보상 반영된 포인트 잔액 갱신 (GET /users/me)
      await useUserStore().syncPointBalance()

      return data
    } catch (err) {
      error.value = err?.message || '제출에 실패했습니다.'
      errorCode.value = err?.code ?? null
      throw err
    } finally {
      isSubmitting.value = false
    }
  }

  const clear = () => {
    quest.value = null
    submitResult.value = null
    phase.value = 'INTRO'
    currentItemIndex.value = 0
    error.value = null
    errorCode.value = null
    isLoading.value = false
    isSaving.value = false
    isSubmitting.value = false
    resetDailyQuestState()
  }

  return {
    quest,
    session: quest,
    phase,
    submitResult,
    currentItemIndex,
    isLoading,
    isSaving,
    isSubmitting,
    error,
    errorCode,
    items,
    status,
    answeredCount,
    totalCount,
    correctCount,
    score,
    questDate,
    questionTypes,
    questionTypeSummary,
    isAssigned,
    isInProgress,
    isCompleted,
    allAnswered,
    canSubmit,
    isIntro,
    isPlay,
    isResult,
    itemTotal,
    currentItem,
    currentSnapshot,
    currentQuestionType,
    currentQuestionTypeLabel,
    isCurrentScenario,
    isCurrentObjective,
    questionNumber,
    isLastItem,
    isFirstItem,
    currentSelectedKey,
    progressLabel,
    rewardPoints,
    resultRows,
    fetchToday,
    openItem,
    backToHub,
    selectChoice,
    saveAndReturnToHub,
    submitToday,
    clear,
    // 호환 별칭
    startPlay: () => openItem(resolveResumeItemIndex(quest.value)),
    goToQuestion: openItem,
  }
})
