import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  getChapterGame,
  getContinuePosition,
  getCurriculum,
  getLearningRoadmap,
  getLessonPages,
  getQuizQuestions,
  getScenario,
  getSubChapterContent,
  gradeQuizAttemptAnswer,
  pickStageLearningItems,
  saveLessonProgress,
  startSubChapterQuizAttempt,
  submitQuizAttempt,
  submitScenarioAttempt,
} from '@/services/studyService.js'
import { StudyApiError } from '@/services/study/studyApiError.js'
import { shouldFallbackStudyMock } from '@/services/study/studyResponseUtils.js'
import { useUserStore } from '@/store/userStore.js'
import { shouldShowFoundationGuide, isFoundationCompleted } from '@/utils/foundationGuide.js'

export const useStudyStore = defineStore('study', () => {
  const curriculumItems = ref([])
  const learningItems = ref([])
  /** @type {import('vue').Ref<Array<{ mainChapterId: number, status: string, periods: import('@/types/study.js').LearningProgressItem[] }>>} */
  const roadmapStages = ref([])
  const continuePosition = ref(null)
  const currentContent = ref(null)
  const lessonPages = ref([])
  const lessonQuizQuestionIds = ref([])
  const currentPageId = ref(null)
  const isLoading = ref(false)
  const error = ref(null)

  /** 소단원 퀴즈 세션 */
  const quizSubChapterId = ref(null)
  const quizAttemptId = ref(null)
  const quizQuestions = ref([])
  const quizIndex = ref(0)
  const quizSelectedKey = ref(null)
  /** @type {import('vue').Ref<'IN_PROGRESS' | 'SELECTED' | 'CORRECT' | 'WRONG'>} */
  const quizUiStatus = ref('IN_PROGRESS')
  /** @type {import('vue').Ref<Record<number, string>>} questionId → selectedKey */
  const quizAnswers = ref({})
  /** @type {import('vue').Ref<Record<number, object>>} questionId → grading */
  const quizGradeByQuestionId = ref({})
  const quizFinished = ref(false)
  const quizAttemptResult = ref(null)

  /** 대단원 시나리오 퀴즈 세션 (소단원 퀴즈와 분리) */
  const scenarioMainChapterId = ref(null)
  const scenarioChapterGame = ref(null)
  const scenarioDetail = ref(null)
  /** @type {import('vue').Ref<'INTRO' | 'PLAY' | 'RESULT'>} */
  const scenarioPhase = ref('INTRO')
  const scenarioStepIndex = ref(0)
  const scenarioSelectedKey = ref(null)
  /** @type {import('vue').Ref<'IN_PROGRESS' | 'SELECTED' | 'CORRECT' | 'WRONG'>} */
  const scenarioUiStatus = ref('IN_PROGRESS')
  /** @type {import('vue').Ref<Record<number, string>>} stepId → selectedKey */
  const scenarioAnswers = ref({})
  const scenarioAttemptResult = ref(null)

  /** 기초 수료 직후 모의투자금 지급 세리머니 표시 */
  const pendingFoundationUnlock = ref(false)

  /** StudyNote에 표시할 활성 대단원 */
  const activeCurriculumItem = computed(
    () => curriculumItems.value.find((item) => item.status === 'ACTIVE') ?? null,
  )

  /** 필수 선행 포트폴리오 기초 과정 */
  const foundationItem = computed(
    () => curriculumItems.value.find((item) => item.chapterType === 'FOUNDATION') ?? null,
  )

  /** 홈 기초 과정 가이드 노출 (미시작 FOUNDATION만) */
  const needsFoundationGuide = computed(() => shouldShowFoundationGuide(curriculumItems.value))

  /** 기초 수료 여부 — 미수료 시 포트폴리오 탭 잠금 */
  const isFoundationCompletedFlag = computed(() => isFoundationCompleted(curriculumItems.value))

  /** 포트폴리오 기능 잠금 (기초 미수료) */
  const isPortfolioLocked = computed(() => !isFoundationCompletedFlag.value)

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

  /** LESSON 항목만 (시나리오 제외) */
  const lessonItems = computed(() =>
    learningItems.value.filter((item) => item.entryType !== 'SCENARIO_QUIZ'),
  )

  const allLessonsCompleted = computed(
    () =>
      lessonItems.value.length > 0 &&
      lessonItems.value.every((item) => item.status === 'COMPLETED'),
  )

  const scenarioQuizItem = computed(
    () => learningItems.value.find((item) => item.entryType === 'SCENARIO_QUIZ') ?? null,
  )

  /** 전체 LESSON 수료 + 시나리오 미완료 → 실전 퀴즈 진입 가능 */
  const scenarioQuizReady = computed(
    () =>
      allLessonsCompleted.value &&
      Boolean(scenarioQuizItem.value) &&
      scenarioQuizItem.value.status !== 'COMPLETED',
  )

  const pageIndex = computed(() => {
    if (!currentPageId.value || !lessonPages.value.length) return 0
    const index = lessonPages.value.findIndex((page) => page.id === currentPageId.value)
    return index >= 0 ? index : 0
  })

  const pageTotal = computed(() => lessonPages.value.length)

  const currentPage = computed(() => lessonPages.value[pageIndex.value] ?? null)

  const isLastPage = computed(() => pageTotal.value > 0 && pageIndex.value >= pageTotal.value - 1)

  const quizQuestionTotal = computed(() => quizQuestions.value.length)
  const quizCurrentQuestion = computed(() => quizQuestions.value[quizIndex.value] ?? null)
  const quizQuestionNumber = computed(() => quizIndex.value + 1)
  const quizIsLastQuestion = computed(
    () => quizQuestionTotal.value > 0 && quizIndex.value >= quizQuestionTotal.value - 1,
  )
  const quizIsGraded = computed(
    () => quizUiStatus.value === 'CORRECT' || quizUiStatus.value === 'WRONG',
  )
  const quizCorrectCount = computed(() => {
    let count = 0
    for (const q of quizQuestions.value) {
      if (quizAnswers.value[q.questionId] === q.correctAnswerJson?.key) count += 1
    }
    return count
  })

  const scenarioSteps = computed(() => scenarioDetail.value?.content?.steps ?? [])
  const scenarioStepTotal = computed(() => scenarioSteps.value.length)
  const scenarioCurrentStep = computed(() => scenarioSteps.value[scenarioStepIndex.value] ?? null)
  const scenarioStepNumber = computed(() => scenarioStepIndex.value + 1)
  const scenarioIsLastStep = computed(
    () => scenarioStepTotal.value > 0 && scenarioStepIndex.value >= scenarioStepTotal.value - 1,
  )
  const scenarioIsGraded = computed(
    () => scenarioUiStatus.value === 'CORRECT' || scenarioUiStatus.value === 'WRONG',
  )
  const scenarioCorrectCount = computed(() => {
    let count = 0
    for (const step of scenarioSteps.value) {
      if (scenarioAnswers.value[step.stepId] === step.correctKey) count += 1
    }
    return count
  })

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

  const fetchRoadmap = async () => {
    try {
      const { data } = await getLearningRoadmap()
      curriculumItems.value = data.curriculumItems
      roadmapStages.value = data.stages
      return data
    } catch (err) {
      if (err?.code === 'CURRICULUM_NOT_FOUND') {
        curriculumItems.value = []
        roadmapStages.value = []
      }
      throw err
    }
  }

  const applyLearningItemsFromStage = (mainChapterId = null) => {
    learningItems.value = pickStageLearningItems(roadmapStages.value, mainChapterId)
  }

  /**
   * 로드맵 기반 소단원 진행 갱신 (legacy getLearningProgress 대체)
   * @param {number} [mainChapterId]
   */
  const refreshLearningItems = async (mainChapterId) => {
    await fetchRoadmap()
    const targetId =
      mainChapterId ??
      activeCurriculumItem.value?.mainChapterId ??
      roadmapStages.value.find((stage) => stage.status === 'ACTIVE')?.mainChapterId ??
      null
    applyLearningItemsFromStage(targetId)
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
    const { data } = await getLessonPages(meta.contentUrl, meta.lesson)
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
   * @param {{ status?: import('@/types/study.js').LearningProgressStatus }} [options]
   */
  const saveProgress = async (pageId, options = {}) => {
    const subChapterId = currentContent.value?.subChapterId
    const lastPageId = pageId ?? currentPageId.value
    if (!subChapterId || !lastPageId) return null

    const { data } = await saveLessonProgress(subChapterId, {
      lastPageId,
      contentVersionId: currentContent.value?.contentVersionId,
      status: options.status ?? 'IN_PROGRESS',
    })
    if (currentContent.value?.progress) {
      currentContent.value.progress.lastPageId = data.lastPageId
      currentContent.value.progress.status = data.status
      if (data.completedAt) {
        currentContent.value.progress.completedAt = data.completedAt
      }
    }
    await fetchContinuePosition()
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

  const resetQuizQuestionUi = () => {
    quizSelectedKey.value = null
    quizUiStatus.value = 'IN_PROGRESS'
  }

  /**
   * 소단원 퀴즈 세션 시작 — questionIds 없으면 강좌 JSON 재조회
   * @param {number} subChapterId
   */
  const startSubChapterQuiz = async (subChapterId) => {
    clearQuizSession()
    quizSubChapterId.value = subChapterId

    /** @type {{ data?: { attemptId?: number, questions?: unknown[] } } | null} */
    let attempt = null
    try {
      attempt = await startSubChapterQuizAttempt(subChapterId)
    } catch (error) {
      const mapped =
        error instanceof StudyApiError
          ? error
          : new StudyApiError(
              error?.code ?? 'QUIZ_START_FAILED',
              error?.message ?? '퀴즈를 시작하지 못했습니다.',
              error?.status ?? 500,
            )
      if (!shouldFallbackStudyMock(mapped)) throw mapped
      console.warn('[studyStore] quiz start 실패 — mock 문항으로 대체합니다.', mapped)
    }

    if (attempt?.data?.questions?.length) {
      quizAttemptId.value = attempt.data.attemptId
      quizQuestions.value = attempt.data.questions
      quizIndex.value = 0
      resetQuizQuestionUi()
      return
    }

    if (
      !lessonQuizQuestionIds.value.length ||
      currentContent.value?.subChapterId !== subChapterId
    ) {
      await fetchLessonContent(subChapterId)
    }

    const ids = lessonQuizQuestionIds.value
    if (!ids.length) {
      throw Object.assign(new Error('퀴즈 문항이 없습니다.'), { code: 'QUESTIONS_NOT_FOUND' })
    }

    const { data } = await getQuizQuestions(ids)
    quizQuestions.value = data.items
    quizIndex.value = 0
    resetQuizQuestionUi()
  }

  const selectQuizOption = (key) => {
    if (quizFinished.value || quizIsGraded.value) return
    quizSelectedKey.value = key
    quizUiStatus.value = 'SELECTED'
  }

  const submitCurrentQuizQuestion = async () => {
    const question = quizCurrentQuestion.value
    if (!question || quizUiStatus.value !== 'SELECTED' || !quizSelectedKey.value) return false

    quizAnswers.value = {
      ...quizAnswers.value,
      [question.questionId]: quizSelectedKey.value,
    }

    if (quizAttemptId.value != null) {
      const { data: graded } = await gradeQuizAttemptAnswer(
        quizAttemptId.value,
        question.questionId,
        quizSelectedKey.value,
      )
      quizGradeByQuestionId.value = {
        ...quizGradeByQuestionId.value,
        [question.questionId]: graded,
      }
      question.correctAnswerJson = graded.correctAnswer
      question.explanation = graded.explanation
      quizUiStatus.value = graded.isCorrect ? 'CORRECT' : 'WRONG'
      return true
    }

    const correctKey = question.correctAnswerJson?.key
    quizUiStatus.value = quizSelectedKey.value === correctKey ? 'CORRECT' : 'WRONG'
    return true
  }

  const goNextQuizQuestion = () => {
    if (quizIsLastQuestion.value) {
      quizFinished.value = true
      return true
    }
    quizIndex.value += 1
    resetQuizQuestionUi()
    return false
  }

  /**
   * 전체 답안 제출·채점 (결과 화면 진입 시)
   * @returns {Promise<import('@/types/study.js').QuizAttemptResult | null>}
   */
  const completeQuizAttempt = async () => {
    const subChapterId = quizSubChapterId.value
    if (!subChapterId || !quizQuestions.value.length) return null

    if (quizAttemptId.value != null && Object.keys(quizGradeByQuestionId.value).length) {
      const grades = quizQuestions.value.map((q) => quizGradeByQuestionId.value[q.questionId])
      const correctCount = grades.filter((g) => g?.isCorrect).length
      const totalCount = quizQuestions.value.length
      const last = grades[grades.length - 1]
      const pointsGranted = last?.reward?.points ?? 0
      const data = {
        subChapterId,
        totalCount,
        correctCount,
        quizScore:
          last?.attempt?.score ?? (totalCount ? Math.round((correctCount / totalCount) * 100) : 0),
        pointsGranted,
        wrongAnswers: grades
          .filter((g) => g && !g.isCorrect)
          .map((g) => ({
            questionId: g.questionId,
            selectedKey: g.selectedKey,
            correctKey: g.correctAnswer?.key,
          })),
        gradedAnswers: grades.filter(Boolean).map((g) => ({
          questionId: g.questionId,
          selectedKey: g.selectedKey,
          isCorrect: g.isCorrect,
        })),
      }
      quizAttemptResult.value = data
      if (data.pointsGranted > 0) {
        const userStore = useUserStore()
        await userStore.addPoints(data.pointsGranted)
      }
    } else {
      const answers = quizQuestions.value.map((q) => ({
        questionId: q.questionId,
        selectedKey: quizAnswers.value[q.questionId] ?? '',
      }))

      const { data } = await submitQuizAttempt({ subChapterId, answers })
      quizAttemptResult.value = data

      if (data.pointsGranted > 0) {
        const userStore = useUserStore()
        await userStore.addPoints(data.pointsGranted)
      }
    }

    const data = quizAttemptResult.value

    const completionPageId =
      currentContent.value?.progress?.lastPageId ??
      lessonPages.value[lessonPages.value.length - 1]?.id ??
      currentPageId.value

    if (completionPageId) {
      const { data: progressData } = await saveLessonProgress(subChapterId, {
        lastPageId: completionPageId,
        contentVersionId: currentContent.value?.contentVersionId,
        status: 'COMPLETED',
      })

      if (currentContent.value?.subChapterId === subChapterId && currentContent.value.progress) {
        currentContent.value.progress.status = progressData.status
        currentContent.value.progress.lastPageId = progressData.lastPageId
        currentContent.value.progress.completedAt =
          progressData.completedAt ??
          currentContent.value.progress.completedAt ??
          new Date().toISOString()
      }

      const item = learningItems.value.find((row) => row.subChapterId === subChapterId)
      if (item) {
        item.status = progressData.status
        item.lastPageId = progressData.lastPageId
        item.completedAt = progressData.completedAt ?? item.completedAt ?? new Date().toISOString()
        if (data) item.quizScore = data.quizScore
      }
    } else if (
      currentContent.value?.subChapterId === subChapterId &&
      currentContent.value.progress
    ) {
      currentContent.value.progress.status = 'COMPLETED'
      currentContent.value.progress.completedAt =
        currentContent.value.progress.completedAt ?? new Date().toISOString()

      const item = learningItems.value.find((row) => row.subChapterId === subChapterId)
      if (item && data) {
        item.status = 'COMPLETED'
        item.quizScore = data.quizScore
        item.completedAt = item.completedAt ?? new Date().toISOString()
      }
    }

    const mainChapterId =
      currentContent.value?.mainChapterId ??
      learningItems.value.find((row) => row.subChapterId === subChapterId)?.mainChapterId
    await fetchContinuePosition()
    if (mainChapterId) {
      await refreshLearningItems(mainChapterId)
    }

    return data
  }

  const clearQuizSession = () => {
    quizSubChapterId.value = null
    quizAttemptId.value = null
    quizQuestions.value = []
    quizIndex.value = 0
    quizSelectedKey.value = null
    quizUiStatus.value = 'IN_PROGRESS'
    quizAnswers.value = {}
    quizGradeByQuestionId.value = {}
    quizFinished.value = false
    quizAttemptResult.value = null
  }

  const resetScenarioStepUi = () => {
    scenarioSelectedKey.value = null
    scenarioUiStatus.value = 'IN_PROGRESS'
  }

  const clearScenarioSession = () => {
    scenarioMainChapterId.value = null
    scenarioChapterGame.value = null
    scenarioDetail.value = null
    scenarioPhase.value = 'INTRO'
    scenarioStepIndex.value = 0
    scenarioSelectedKey.value = null
    scenarioUiStatus.value = 'IN_PROGRESS'
    scenarioAnswers.value = {}
    scenarioAttemptResult.value = null
  }

  /**
   * 대단원 시나리오 퀴즈 세션 시작 — chapter game → 미완료 scenario 로드
   * @param {number} mainChapterId
   */
  const startMainChapterScenarioQuiz = async (mainChapterId) => {
    clearScenarioSession()
    scenarioMainChapterId.value = mainChapterId

    const { data: game } = await getChapterGame(mainChapterId)
    scenarioChapterGame.value = game

    const target = game.scenarios.find((s) => !s.completed) ?? game.scenarios[0] ?? null
    if (!target) {
      throw Object.assign(new Error('시나리오가 없습니다.'), { code: 'SCENARIO_NOT_FOUND' })
    }

    const { data: detail } = await getScenario(target.scenarioId)
    if (!detail.content?.steps?.length) {
      throw Object.assign(new Error('시나리오 문항이 없습니다.'), { code: 'STEPS_NOT_FOUND' })
    }

    scenarioDetail.value = detail
    scenarioPhase.value = 'INTRO'
    scenarioStepIndex.value = 0
    resetScenarioStepUi()
  }

  const beginScenarioPlay = () => {
    if (!scenarioDetail.value) return
    scenarioPhase.value = 'PLAY'
    scenarioStepIndex.value = 0
    scenarioAnswers.value = {}
    scenarioAttemptResult.value = null
    resetScenarioStepUi()
  }

  const selectScenarioOption = (key) => {
    if (scenarioPhase.value !== 'PLAY' || scenarioIsGraded.value) return
    scenarioSelectedKey.value = key
    scenarioUiStatus.value = 'SELECTED'
  }

  const submitCurrentScenarioStep = () => {
    const step = scenarioCurrentStep.value
    if (!step || scenarioUiStatus.value !== 'SELECTED' || !scenarioSelectedKey.value) return false

    scenarioAnswers.value = {
      ...scenarioAnswers.value,
      [step.stepId]: scenarioSelectedKey.value,
    }
    scenarioUiStatus.value = scenarioSelectedKey.value === step.correctKey ? 'CORRECT' : 'WRONG'
    return true
  }

  const retryCurrentScenarioStep = () => {
    const step = scenarioCurrentStep.value
    if (!step) return
    const next = { ...scenarioAnswers.value }
    delete next[step.stepId]
    scenarioAnswers.value = next
    resetScenarioStepUi()
  }

  /**
   * @returns {boolean} true면 마지막 문항 → RESULT 진입 대기
   */
  const goNextScenarioStep = () => {
    if (scenarioIsLastStep.value) {
      scenarioPhase.value = 'RESULT'
      return true
    }
    scenarioStepIndex.value += 1
    resetScenarioStepUi()
    return false
  }

  /**
   * 시나리오 전체 제출·채점·포인트
   * @returns {Promise<import('@/types/study.js').ScenarioAttemptResult | null>}
   */
  const completeScenarioAttempt = async () => {
    const mainChapterId = scenarioMainChapterId.value
    const scenarioId = scenarioDetail.value?.scenarioId
    if (!mainChapterId || !scenarioId || !scenarioSteps.value.length) return null

    const wasFoundationChapter =
      curriculumItems.value.find((item) => item.mainChapterId === mainChapterId)?.chapterType ===
      'FOUNDATION'

    const answers = scenarioSteps.value.map((step) => ({
      stepId: step.stepId,
      selectedKey: scenarioAnswers.value[step.stepId] ?? '',
    }))

    const { data } = await submitScenarioAttempt({ scenarioId, mainChapterId, answers })
    scenarioAttemptResult.value = data
    scenarioPhase.value = 'RESULT'

    if (data.pointsGranted > 0) {
      const userStore = useUserStore()
      await userStore.addPoints(data.pointsGranted)
    }

    if (scenarioChapterGame.value) {
      const summary = scenarioChapterGame.value.scenarios.find((s) => s.scenarioId === scenarioId)
      if (summary) summary.completed = true
    }

    const item = learningItems.value.find(
      (row) => row.mainChapterId === mainChapterId && row.entryType === 'SCENARIO_QUIZ',
    )
    if (item) {
      item.status = 'COMPLETED'
      item.quizScore = data.quizScore
      item.completedAt = item.completedAt ?? new Date().toISOString()
    }

    await Promise.all([fetchRoadmap(), fetchContinuePosition()])
    applyLearningItemsFromStage(mainChapterId)

    if (wasFoundationChapter && isFoundationCompletedFlag.value) {
      pendingFoundationUnlock.value = true
    }

    return data
  }

  const clearFoundationUnlock = () => {
    pendingFoundationUnlock.value = false
  }

  /** StudyNote용: 로드맵 + 이어하기 (소단원 N+1 호출 없음) */
  const fetchStudyNote = async (options = {}) => {
    if (isLoading.value) return

    isLoading.value = true
    error.value = null

    try {
      await Promise.all([fetchRoadmap(), fetchContinuePosition()])

      const mainChapterId =
        options.mainChapterId ??
        activeCurriculumItem.value?.mainChapterId ??
        roadmapStages.value.find((stage) => stage.status === 'ACTIVE')?.mainChapterId ??
        null

      if (mainChapterId == null) {
        learningItems.value = []
        return
      }

      applyLearningItemsFromStage(mainChapterId)
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
    roadmapStages.value = []
    continuePosition.value = null
    currentContent.value = null
    pendingFoundationUnlock.value = false
    clearLesson()
    clearQuizSession()
    clearScenarioSession()
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
    quizSubChapterId,
    quizAttemptId,
    quizQuestions,
    quizIndex,
    quizSelectedKey,
    quizUiStatus,
    quizAnswers,
    quizFinished,
    quizAttemptResult,
    scenarioMainChapterId,
    scenarioChapterGame,
    scenarioDetail,
    scenarioPhase,
    scenarioStepIndex,
    scenarioSelectedKey,
    scenarioUiStatus,
    scenarioAnswers,
    scenarioAttemptResult,
    activeCurriculumItem,
    foundationItem,
    needsFoundationGuide,
    isFoundationCompleted: isFoundationCompletedFlag,
    isPortfolioLocked,
    chapterTitle,
    progressPercent,
    continueRoute,
    totalScore,
    maxTotalScore,
    allLessonsCompleted,
    scenarioQuizReady,
    scenarioQuizItem,
    pageIndex,
    pageTotal,
    currentPage,
    isLastPage,
    quizQuestionTotal,
    quizCurrentQuestion,
    quizQuestionNumber,
    quizIsLastQuestion,
    quizIsGraded,
    quizCorrectCount,
    scenarioSteps,
    scenarioStepTotal,
    scenarioCurrentStep,
    scenarioStepNumber,
    scenarioIsLastStep,
    scenarioIsGraded,
    scenarioCorrectCount,
    fetchCurriculum,
    fetchRoadmap,
    refreshLearningItems,
    applyLearningItemsFromStage,
    fetchContinuePosition,
    fetchSubChapterContent,
    fetchLessonContent,
    setCurrentPage,
    saveProgress,
    goNextPage,
    goPrevPage,
    fetchStudyNote,
    startSubChapterQuiz,
    selectQuizOption,
    submitCurrentQuizQuestion,
    goNextQuizQuestion,
    completeQuizAttempt,
    clearQuizSession,
    startMainChapterScenarioQuiz,
    beginScenarioPlay,
    selectScenarioOption,
    submitCurrentScenarioStep,
    retryCurrentScenarioStep,
    goNextScenarioStep,
    completeScenarioAttempt,
    clearScenarioSession,
    pendingFoundationUnlock,
    clearFoundationUnlock,
    clearLesson,
    clearStudy,
  }
})
