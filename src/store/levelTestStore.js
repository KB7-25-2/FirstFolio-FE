import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  getLevelTestStatus,
  getStoredLevelTestSession,
  startLevelTest,
  saveLevelTestAnswers,
  submitLevelTest,
  resetLevelTestState,
  LevelTestApiError,
} from '@/services/levelTestService.js'
export const useLevelTestStore = defineStore('levelTest', () => {
  const storedSession = getStoredLevelTestSession()
  /** @type {import('vue').Ref<boolean | null>} null = 아직 조회 전 */
  const completed = ref(storedSession.completed ? true : null)
  /** @type {import('vue').Ref<import('@/types/levelTest.js').LevelTestAttempt | null>} */
  const attempt = ref(storedSession.attempt)
  /**
   * 서버(PUT) 확정 답안 — questionId → selectedChoiceIds
   * @type {import('vue').Ref<Record<number, string[]>>}
   */
  const answers = ref(storedSession.answers)
  /**
   * 아직 PUT 전인 화면 선택 — questionId → choiceKey
   * DB와 동기화된 answers와 분리해 부정합을 막는다.
   * @type {import('vue').Ref<Record<number, string>>}
   */
  const draftChoices = ref({})
  /** @type {import('vue').Ref<import('@/types/levelTest.js').LevelTestSubmitResult | null>} */
  const submitResult = ref(storedSession.submitResult)
  /** 0-based 현재 문항 인덱스 */
  const currentQuestionIndex = ref(0)

  const isLoading = ref(false)
  const isSaving = ref(false)
  const isSubmitting = ref(false)
  const error = ref(null)

  const isCompleted = computed(() => completed.value === true)
  const isStatusLoaded = computed(() => completed.value !== null)

  const questions = computed(() => attempt.value?.questions ?? [])
  const questionTotal = computed(() => questions.value.length)
  const currentQuestion = computed(() => questions.value[currentQuestionIndex.value] ?? null)
  const questionNumber = computed(() =>
    currentQuestion.value ? currentQuestionIndex.value + 1 : 0,
  )
  const isLastQuestion = computed(
    () => questionTotal.value > 0 && currentQuestionIndex.value >= questionTotal.value - 1,
  )
  const isFirstQuestion = computed(() => currentQuestionIndex.value <= 0)

  const currentSelectedKey = computed(() => {
    const qid = currentQuestion.value?.questionId
    if (qid == null) return null
    return draftChoices.value[qid] ?? answers.value[qid]?.[0] ?? null
  })

  const answeredCount = computed(
    () => Object.values(answers.value).filter((ids) => ids?.length).length,
  )

  /** 확정 답안 + 현재 문항 드래프트까지 포함해 제출 가능 여부 */
  const allAnswersReady = computed(() => {
    if (questionTotal.value <= 0) return false
    return questions.value.every((question) => {
      const qid = question.questionId
      if (qid === currentQuestion.value?.questionId) {
        return Boolean(currentSelectedKey.value)
      }
      return Boolean(answers.value[qid]?.length)
    })
  })

  const recommendations = computed(() => submitResult.value?.recommendations ?? [])
  const cartCandidates = computed(() => submitResult.value?.cartCandidates ?? [])
  /** 문항별 채점 결과 리스트 */
  const questionResults = computed(() => submitResult.value?.results ?? [])

  /**
   * 결과 화면용 대단원 집계 행
   * — 전부 정답: 탄탄 + 장바구니 / 일부 정답: 보통 + 자동 포함 / 전부 오답: 보완 + 자동 포함
   */
  const chapterResultRows = computed(() => {
    /** @type {Map<number, { assetType: string, correct: number, total: number, order: number }>} */
    const byChapter = new Map()

    for (const q of questions.value) {
      const prev = byChapter.get(q.mainChapterId) ?? {
        assetType: q.assetType,
        correct: 0,
        total: 0,
        order: q.displayOrder,
      }
      if (q.displayOrder < prev.order) prev.order = q.displayOrder
      byChapter.set(q.mainChapterId, prev)
    }

    for (const r of questionResults.value) {
      const prev = byChapter.get(r.mainChapterId) ?? {
        assetType: r.assetType,
        correct: 0,
        total: 0,
        order: r.mainChapterId,
      }
      prev.total += 1
      if (r.isCorrect) prev.correct += 1
      byChapter.set(r.mainChapterId, prev)
    }

    return Array.from(byChapter.entries())
      .map(([mainChapterId, stats]) => {
        const allCorrect = stats.total > 0 && stats.correct === stats.total
        const noneCorrect = stats.correct === 0
        /** @type {'탄탄' | '보통' | '보완'} */
        let resultLabel = '보통'
        if (allCorrect) resultLabel = '탄탄'
        else if (noneCorrect) resultLabel = '보완'

        return {
          mainChapterId,
          assetType: stats.assetType,
          resultLabel,
          actionLabel: allCorrect ? '장바구니' : '자동 포함',
          isAutoInclude: !allCorrect,
          correctCount: stats.correct,
          totalCount: stats.total,
          order: stats.order,
        }
      })
      .sort((a, b) => a.order - b.order)
  })

  const fetchStatus = async () => {
    isLoading.value = true
    error.value = null
    try {
      const { data } = await getLevelTestStatus()
      completed.value = data.completed
      const session = getStoredLevelTestSession()
      if (session.attempt) attempt.value = session.attempt
      answers.value = session.answers
      draftChoices.value = {}
      if (session.submitResult) submitResult.value = session.submitResult
      return data.completed
    } catch (err) {
      error.value = err?.message || '레벨 테스트 상태를 불러오지 못했습니다.'
      completed.value = false
      return false
    } finally {
      isLoading.value = false
    }
  }

  /**
   * @returns {Promise<boolean>}
   */
  const ensureStatus = async () => {
    if (completed.value !== null) return completed.value
    return fetchStatus()
  }

  const start = async () => {
    isLoading.value = true
    error.value = null
    try {
      const { data } = await startLevelTest()
      attempt.value = data
      completed.value = false
      submitResult.value = null
      answers.value = Object.fromEntries(
        (data.savedAnswers ?? [])
          .filter((item) => item.selectedChoiceIds?.length)
          .map((item) => [item.questionId, item.selectedChoiceIds]),
      )
      draftChoices.value = {}
      const firstUnansweredIndex = data.questions.findIndex(
        (question) => !answers.value[question.questionId]?.length,
      )
      currentQuestionIndex.value = firstUnansweredIndex >= 0 ? firstUnansweredIndex : 0
      return data
    } catch (err) {
      if (err?.code === 'LEVEL_TEST_ALREADY_COMPLETED') {
        completed.value = true
        attempt.value = null
      }
      error.value = err?.message || '레벨 테스트를 시작할 수 없습니다.'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  /**
   * 현재 문항 선택 (SINGLE_CHOICE) — PUT 전 드래프트만 갱신
   * @param {string} choiceKey optionsJson.key / API answer.key
   */
  const selectChoice = (choiceKey) => {
    const qid = currentQuestion.value?.questionId
    if (qid == null || !choiceKey) return
    if (attempt.value?.status === 'GRADED' || submitResult.value) return
    draftChoices.value = {
      ...draftChoices.value,
      [qid]: choiceKey,
    }
  }

  const clearDraftForQuestion = (questionId) => {
    if (questionId == null || draftChoices.value[questionId] == null) return
    const next = { ...draftChoices.value }
    delete next[questionId]
    draftChoices.value = next
  }

  /**
   * 답안 저장 (채점 없음) — 성공 시 응답(또는 요청) 확정값을 answers에 반영
   * @param {import('@/types/levelTest.js').LevelTestAnswerItem[]} [answerItems]
   */
  const saveAnswers = async (answerItems) => {
    if (!attempt.value?.attemptId) {
      throw new LevelTestApiError('ATTEMPT_NOT_FOUND', '응시를 찾을 수 없다.', 404)
    }

    const payloadAnswers =
      answerItems ??
      Object.entries(answers.value).map(([questionId, selectedChoiceIds]) => ({
        questionId: Number(questionId),
        selectedChoiceIds,
      }))

    if (!payloadAnswers.length) {
      throw new LevelTestApiError('VALIDATION_ERROR', '저장할 답안이 없다.', 400)
    }

    isSaving.value = true
    error.value = null
    try {
      const { data } = await saveLevelTestAnswers(attempt.value.attemptId, {
        answers: payloadAnswers,
      })

      const confirmed = data.savedAnswers?.length ? data.savedAnswers : payloadAnswers
      const nextAnswers = { ...answers.value }
      const nextDrafts = { ...draftChoices.value }
      for (const item of confirmed) {
        const qid = Number(item.questionId)
        if (!item.selectedChoiceIds?.length) continue
        nextAnswers[qid] = [...item.selectedChoiceIds]
        delete nextDrafts[qid]
      }
      answers.value = nextAnswers
      draftChoices.value = nextDrafts

      if (attempt.value) {
        attempt.value = {
          ...attempt.value,
          updatedAt: data.updatedAt,
          status: data.status,
          savedAnswers: Object.entries(nextAnswers).map(([questionId, selectedChoiceIds]) => ({
            questionId: Number(questionId),
            selectedChoiceIds,
          })),
        }
      }
      return data
    } catch (err) {
      error.value = err?.message || '답안을 저장하지 못했습니다.'
      throw err
    } finally {
      isSaving.value = false
    }
  }

  /**
   * 현재까지 작성한 답안을 저장한 뒤 제출·채점
   * @returns {Promise<import('@/types/levelTest.js').LevelTestSubmitResult>}
   */
  const submit = async () => {
    if (!attempt.value?.attemptId) {
      throw new LevelTestApiError('ATTEMPT_NOT_FOUND', '응시를 찾을 수 없다.', 404)
    }

    isSubmitting.value = true
    error.value = null
    try {
      const { data } = await submitLevelTest(attempt.value.attemptId)
      submitResult.value = data
      completed.value = true
      if (attempt.value) {
        attempt.value = { ...attempt.value, status: 'GRADED' }
      }
      return data
    } catch (err) {
      error.value = err?.message || '레벨 테스트를 제출하지 못했습니다.'
      throw err
    } finally {
      isSubmitting.value = false
    }
  }

  const goNextQuestion = () => {
    if (isLastQuestion.value) return
    // 저장하지 않고 이동하면 드래프트 폐기 → DB 확정값(answers)만 유지
    clearDraftForQuestion(currentQuestion.value?.questionId)
    currentQuestionIndex.value += 1
  }

  const goPrevQuestion = () => {
    if (isFirstQuestion.value) return
    clearDraftForQuestion(currentQuestion.value?.questionId)
    currentQuestionIndex.value -= 1
  }

  /**
   * @param {number} index 0-based
   */
  const goToQuestion = (index) => {
    if (index < 0 || index >= questionTotal.value) return
    clearDraftForQuestion(currentQuestion.value?.questionId)
    currentQuestionIndex.value = index
  }

  const clearSession = () => {
    completed.value = null
    attempt.value = null
    answers.value = {}
    draftChoices.value = {}
    submitResult.value = null
    currentQuestionIndex.value = 0
    isLoading.value = false
    isSaving.value = false
    isSubmitting.value = false
    error.value = null
  }

  const clear = () => {
    resetLevelTestState()
    clearSession()
  }

  return {
    completed,
    attempt,
    answers,
    draftChoices,
    submitResult,
    currentQuestionIndex,
    isLoading,
    isSaving,
    isSubmitting,
    error,
    isCompleted,
    isStatusLoaded,
    questions,
    questionTotal,
    currentQuestion,
    questionNumber,
    isLastQuestion,
    isFirstQuestion,
    currentSelectedKey,
    answeredCount,
    allAnswersReady,
    recommendations,
    cartCandidates,
    questionResults,
    chapterResultRows,
    fetchStatus,
    ensureStatus,
    start,
    selectChoice,
    saveAnswers,
    submit,
    goNextQuestion,
    goPrevQuestion,
    goToQuestion,
    clearSession,
    clear,
  }
})
