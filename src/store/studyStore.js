import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  getContinuePosition,
  getCurriculum,
  getLearningRoadmap,
  getLessonPages,
  getSubChapterContent,
  gradeQuizAttemptAnswer,
  mergeLearningItemsWithProgress,
  pickStageLearningItems,
  saveLessonProgress,
  startMainChapterQuizAttempt,
  startSubChapterQuizAttempt,
} from '@/services/studyService.js'
import {
  needsQuizAttempt,
  isSubChapterFullyCompletedFromItem,
} from '@/services/study/mappers/subChapterMapper.js'
import { useDashboardStore } from '@/store/dashboardStore.js'
import { useUserStore } from '@/store/userStore.js'
import { shouldShowFoundationGuide, isFoundationCompleted } from '@/utils/foundationGuide.js'
import { findFocusedMainChapterId } from '@/utils/studyFocus.js'

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
  const scenarioAttemptId = ref(null)
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
  /** 마지막 문항 제출 시 서버가 확정한 대단원 수료 결과 */
  const scenarioFinalGrading = ref(null)

  /** 기초 수료 직후 모의투자금 지급 세리머니 표시 */
  const pendingFoundationUnlock = ref(false)

  /** StudyNote에 표시할 활성 대단원 */
  const activeCurriculumItem = computed(
    () => curriculumItems.value.find((item) => item.status === 'ACTIVE') ?? null,
  )

  /** 소단원·시나리오의 실제 진행 상태에 맞춘 홈 학습 노트 대단원 */
  const focusedMainChapterId = computed(() =>
    findFocusedMainChapterId({
      continuePosition: continuePosition.value,
      stages: roadmapStages.value,
      curriculumItems: curriculumItems.value,
    }),
  )

  const focusedCurriculumItem = computed(
    () =>
      curriculumItems.value.find((item) => item.mainChapterId === focusedMainChapterId.value) ??
      activeCurriculumItem.value,
  )

  const isFocusedMainChapterCompleted = computed(
    () => focusedCurriculumItem.value?.status === 'COMPLETED',
  )

  /** 필수 선행 포트폴리오 기초 과정 */
  const foundationItem = computed(
    () => curriculumItems.value.find((item) => item.chapterType === 'FOUNDATION') ?? null,
  )

  /** 홈 기초 과정 가이드 노출 (미시작 FOUNDATION만) */
  const needsFoundationGuide = computed(() => shouldShowFoundationGuide(curriculumItems.value))

  /** 기초 수료 여부 — 미수료 시 포트폴리오 탭 잠금 */
  const isFoundationCompletedFlag = computed(() => isFoundationCompleted(curriculumItems.value))

  /** 확정 커리큘럼의 모든 대단원이 COMPLETED인지 */
  const isCurriculumFullyCompleted = computed(() => {
    const items = curriculumItems.value.filter((item) => item.status !== 'REMOVED')
    if (!items.length) {
      const stages = roadmapStages.value
      return stages.length > 0 && stages.every((stage) => stage.status === 'COMPLETED')
    }
    return items.every((item) => item.status === 'COMPLETED')
  })

  /** 포트폴리오 기능 잠금 (기초 미수료) */
  const isPortfolioLocked = computed(() => !isFoundationCompletedFlag.value)

  const chapterTitle = computed(() => focusedCurriculumItem.value?.title ?? '')

  const progressPercent = computed(
    () =>
      continuePosition.value?.progressPercent ?? activeCurriculumItem.value?.progressPercent ?? 0,
  )

  /** 로드맵 API 캐시 여부 — 있으면 재조회 생략 */
  const hasRoadmap = computed(() => roadmapStages.value.length > 0)

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
      lessonItems.value.length > 0 && lessonItems.value.every(isSubChapterFullyCompletedFromItem),
  )

  const scenarioQuizItem = computed(
    () => learningItems.value.find((item) => item.entryType === 'SCENARIO_QUIZ') ?? null,
  )

  /** roadmap API의 main_chapter_quiz.available 기반 대단원 퀴즈 진입 가능 여부 */
  const scenarioQuizReady = computed(() => {
    const mainChapterId =
      scenarioQuizItem.value?.mainChapterId ??
      lessonItems.value[0]?.mainChapterId ??
      activeCurriculumItem.value?.mainChapterId ??
      null
    if (!mainChapterId) return false
    const stage = roadmapStages.value.find((s) => s.mainChapterId === mainChapterId)
    return Boolean(stage?.scenarioReady)
  })

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

  const fetchRoadmap = async (options = {}) => {
    const { force = false } = options
    if (!force && roadmapStages.value.length) {
      return {
        curriculumItems: curriculumItems.value,
        stages: roadmapStages.value,
      }
    }

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

  /** store에 로드맵이 없을 때만 API 호출 (기본 진입 경로) */
  const ensureRoadmap = async (options = {}) => fetchRoadmap({ force: false, ...options })

  /** 커리큘럼 수정 후 캐시를 비워 다음 진입에서 서버 순서를 다시 받는다 */
  const invalidateRoadmap = () => {
    curriculumItems.value = []
    roadmapStages.value = []
    learningItems.value = []
  }

  /**
   * 서버 재조회 없이 store 로드맵의 소단원 진행만 반영
   * @param {number} subChapterId
   * @param {Record<string, unknown>} patch
   */
  const patchRoadmapPeriod = (subChapterId, patch) => {
    for (const stage of roadmapStages.value) {
      const period = stage.periods?.find((row) => row.subChapterId === subChapterId)
      if (!period) continue
      Object.assign(period, patch)
      return stage.mainChapterId
    }
    return null
  }

  const applyLearningItemsFromStage = (mainChapterId = null) => {
    learningItems.value = pickStageLearningItems(roadmapStages.value, mainChapterId)
  }

  /**
   * store 로드맵에서 learningItems 재구성
   * @param {number} [mainChapterId]
   * @param {{ syncFromServer?: boolean, syncProgress?: boolean }} [options]
   */
  const refreshLearningItems = async (mainChapterId, options = {}) => {
    const { syncFromServer = false, syncProgress = false } = options
    if (syncFromServer) {
      await fetchRoadmap({ force: true })
    }
    const targetId =
      mainChapterId ??
      focusedMainChapterId.value ??
      activeCurriculumItem.value?.mainChapterId ??
      roadmapStages.value.find((stage) => stage.status === 'ACTIVE')?.mainChapterId ??
      null
    applyLearningItemsFromStage(targetId)
    if (syncProgress) {
      learningItems.value = await mergeLearningItemsWithProgress(learningItems.value)
    }
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

    await ensureLessonCompletedIfFullyRead(pages)

    return {
      meta: currentContent.value,
      lesson: data,
      pages,
      needsQuiz: needsQuizAttempt(currentContent.value?.progress),
    }
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
    useDashboardStore().invalidate()
    if (currentContent.value?.progress) {
      currentContent.value.progress.lastPageId = data.lastPageId
      currentContent.value.progress.status = data.status
      if (data.completedAt) {
        currentContent.value.progress.completedAt = data.completedAt
      }
    }
    patchRoadmapPeriod(subChapterId, {
      status: data.status,
      lastPageId: data.lastPageId,
      ...(data.completedAt ? { completedAt: data.completedAt } : {}),
    })
    await fetchContinuePosition()
    return data
  }

  const goNextPage = async () => {
    if (isLastPage.value) return false
    const next = lessonPages.value[pageIndex.value + 1]
    if (!next) return false
    await setCurrentPage(next.id)
    if (isLastPage.value) {
      await ensureLessonCompletedIfFullyRead(lessonPages.value)
    }
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

  /** 퀴즈 시작 API가 반환한 문항·기존 응답으로 세션 복원 */
  const applyQuizAttemptSession = (attemptData) => {
    const questions = attemptData?.questions ?? []
    if (!questions.length) return false

    quizAttemptId.value = attemptData.attemptId ?? null
    quizQuestions.value = questions

    const nextAnswers = {}
    const nextGrades = {}
    for (const question of questions) {
      if (!question.answered || !question.selectedKey) continue
      nextAnswers[question.questionId] = question.selectedKey
      if (question.isCorrect != null) {
        nextGrades[question.questionId] = {
          questionId: question.questionId,
          selectedKey: question.selectedKey,
          isCorrect: question.isCorrect,
          correctAnswer: question.correctAnswerJson,
          explanation: question.explanation,
        }
      }
    }
    quizAnswers.value = nextAnswers
    quizGradeByQuestionId.value = nextGrades

    const nextIndex = questions.findIndex((row) => !row.answered)
    quizIndex.value = nextIndex >= 0 ? nextIndex : Math.max(questions.length - 1, 0)

    const current = questions[quizIndex.value]
    if (current?.answered && current.selectedKey) {
      quizSelectedKey.value = current.selectedKey
      quizUiStatus.value = current.isCorrect ? 'CORRECT' : 'WRONG'
    } else {
      resetQuizQuestionUi()
    }
    return true
  }

  /** 마지막 페이지까지 읽었으면 강좌 COMPLETED PUT */
  const ensureLessonCompletedIfFullyRead = async (pages) => {
    const meta = currentContent.value
    if (!meta?.subChapterId || !pages.length) return
    if (meta.progress?.status === 'COMPLETED') return

    const lastPage = pages[pages.length - 1]
    const lastPageId = meta.progress?.lastPageId ?? currentPageId.value
    if (!lastPage?.id || lastPageId !== lastPage.id) return

    await saveProgress(lastPage.id, { status: 'COMPLETED' })
  }

  /**
   * 소단원 퀴즈 세션 시작 — questionIds 없으면 강좌 JSON 재조회
   * @param {number} subChapterId
   */
  const startSubChapterQuiz = async (subChapterId) => {
    clearQuizSession()
    quizSubChapterId.value = subChapterId

    const attempt = await startSubChapterQuizAttempt(subChapterId)
    if (!attempt?.data?.questions?.length) {
      throw Object.assign(new Error('퀴즈 문항이 없습니다.'), { code: 'QUESTIONS_NOT_FOUND' })
    }
    applyQuizAttemptSession(attempt.data)
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

    if (quizAttemptId.value == null || !Object.keys(quizGradeByQuestionId.value).length) {
      throw Object.assign(new Error('퀴즈 응시 정보가 없습니다.'), { code: 'INVALID_ATTEMPT' })
    }

    const grades = quizQuestions.value.map((q) => quizGradeByQuestionId.value[q.questionId])
    const correctCount = grades.filter((g) => g?.isCorrect).length
    const totalCount = quizQuestions.value.length
    const last = grades[grades.length - 1]
    // 보상은 보통 응시 완료 채점(대개 마지막 문항)에만 실림 — 없으면 전체에서 합산
    const pointsGranted =
      Number(last?.reward?.points) ||
      grades.reduce((sum, g) => sum + (Number(g?.reward?.points) || 0), 0)
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
    useDashboardStore().invalidate()
    // 포인트는 서버 채점 시 이미 적립됨 — 로컬 가산 대신 GET /users/me 동기화
    await useUserStore().syncPointBalance()

    const alreadyCompleted =
      currentContent.value?.subChapterId === subChapterId &&
      currentContent.value?.progress?.status === 'COMPLETED'

    if (!alreadyCompleted) {
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
          item.completedAt =
            progressData.completedAt ?? item.completedAt ?? new Date().toISOString()
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
    } else {
      const item = learningItems.value.find((row) => row.subChapterId === subChapterId)
      if (item && data) item.quizScore = data.quizScore
    }

    const mainChapterId =
      currentContent.value?.mainChapterId ??
      learningItems.value.find((row) => row.subChapterId === subChapterId)?.mainChapterId
    await Promise.all([
      refreshLearningItems(mainChapterId, { syncFromServer: true, syncProgress: true }),
      fetchContinuePosition(),
    ])

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

  const buildScenarioStepsFromQuestions = (questions) =>
    questions.map((q) => {
      const sj = q.scenarioJson ?? null
      return {
        stepId: q.questionId,
        order: q.displayOrder ?? q.questionId,
        paperTitle: sj?.paper_title ?? '대단원 퀴즈',
        prompt: q.prompt,
        options: (q.optionsJson ?? []).map((opt) => ({
          key: opt.key,
          label: opt.label,
          description: opt.description ?? null,
        })),
        correctKey: q.correctAnswerJson?.key ?? null,
        explanation: q.explanation ?? null,
        scenarioJson: sj,
      }
    })

  /** 퀴즈 시작 API가 반환한 문항·기존 응답으로 시나리오 세션 복원 (소단원 applyQuizAttemptSession과 동일 패턴) */
  const applyScenarioAttemptSession = (questions) => {
    if (!questions?.length) return false

    const steps = scenarioDetail.value?.content?.steps ?? []
    if (!steps.length) return false

    const nextAnswers = {}
    for (const question of questions) {
      if (!question.answered || !question.selectedKey) continue
      nextAnswers[question.questionId] = question.selectedKey
      const step = steps.find((row) => row.stepId === question.questionId)
      if (!step) continue
      if (question.correctAnswerJson?.key != null) {
        step.correctKey = question.correctAnswerJson.key
      }
      if (question.explanation != null) {
        step.explanation = question.explanation
      }
    }
    scenarioAnswers.value = nextAnswers

    const nextIndex = questions.findIndex((row) => !row.answered)
    const hasProgress = questions.some((row) => row.answered)

    scenarioStepIndex.value = nextIndex >= 0 ? nextIndex : Math.max(questions.length - 1, 0)
    // 한 문항이라도 채점됐으면 INTRO를 건너뛰고 PLAY부터 이어한다.
    scenarioPhase.value = hasProgress ? 'PLAY' : 'INTRO'

    const current = questions[scenarioStepIndex.value]
    if (current?.answered && current.selectedKey) {
      scenarioSelectedKey.value = current.selectedKey
      scenarioUiStatus.value = current.isCorrect ? 'CORRECT' : 'WRONG'
    } else {
      resetScenarioStepUi()
    }
    return true
  }

  const clearScenarioSession = () => {
    scenarioMainChapterId.value = null
    scenarioAttemptId.value = null
    scenarioChapterGame.value = null
    scenarioDetail.value = null
    scenarioPhase.value = 'INTRO'
    scenarioStepIndex.value = 0
    scenarioSelectedKey.value = null
    scenarioUiStatus.value = 'IN_PROGRESS'
    scenarioAnswers.value = {}
    scenarioAttemptResult.value = null
    scenarioFinalGrading.value = null
  }

  /**
   * 대단원 퀴즈 세션 시작 — API quiz-attempt 기반
   * @param {number} mainChapterId
   */
  const startMainChapterScenarioQuiz = async (mainChapterId) => {
    clearScenarioSession()
    scenarioMainChapterId.value = mainChapterId

    const { data: attempt } = await startMainChapterQuizAttempt(mainChapterId)
    if (!attempt?.questions?.length) {
      throw Object.assign(new Error('대단원 퀴즈 문항이 없습니다.'), { code: 'STEPS_NOT_FOUND' })
    }

    scenarioAttemptId.value = attempt.attemptId

    const questions = attempt.questions
    const steps = buildScenarioStepsFromQuestions(questions)

    // 첫 번째 SCENARIO 타입 문항의 scenario_json → conditions (페르소나·시황)
    const firstScenario = questions.find((q) => q.questionType === 'SCENARIO' && q.scenarioJson)
    const sj = firstScenario?.scenarioJson ?? null
    const conditions = sj
      ? {
          persona: {
            name: sj.persona?.name ?? '',
            age: sj.persona?.age ?? '',
            job: sj.persona?.job ?? '',
            monthlyIncome: sj.persona?.monthly_income ?? sj.persona?.monthlyIncome ?? null,
            monthlySaving: sj.persona?.monthly_saving ?? sj.persona?.monthlySaving ?? null,
          },
          requirements: {
            assets: sj.requirements?.assets ?? '',
            risk: sj.requirements?.risk ?? '',
            goal: sj.requirements?.goal ?? '',
          },
          marketTitle: sj.market?.title ?? '',
          marketDate: sj.market?.reference_at ?? '',
          marketBullets: sj.market?.bullets ?? [],
          constraints: sj.constraints ?? [],
        }
      : null

    const curriculumItem = curriculumItems.value.find(
      (item) => item.mainChapterId === mainChapterId,
    )
    const title = curriculumItem?.title ?? '대단원 퀴즈'

    scenarioDetail.value = {
      scenarioId: attempt.attemptId,
      title,
      rewardStar: 0,
      content: {
        scenarioKey: `main-chapter-${mainChapterId}`,
        chapterTitle: title,
        chapterSubtitle: '배운 내용을 실전 상황에서 점검해요',
        opening: {
          documentTitle: '평 가 지',
          docNo: `제 ${mainChapterId}-최종-001 호`,
          docDate: new Date().toLocaleDateString('ko-KR'),
          orgName: '퍼스트폴리오 학습원',
          title: `${title} 최종 평가`,
          mission:
            sj?.narrative ?? '지금까지 배운 내용을 바탕으로 각 문항에 가장 알맞은 답을 선택하세요.',
          issuerLabel: '발행처',
          issuerName: '퍼스트폴리오 학습원장',
          startLabel: '퀴즈 시작',
        },
        conditions,
        steps,
      },
    }

    applyScenarioAttemptSession(questions)
  }

  const beginScenarioPlay = () => {
    if (!scenarioDetail.value) return
    scenarioPhase.value = 'PLAY'
    // INTRO에서 새로 시작할 때만 0번 문항부터 — 재진입(applyScenarioAttemptSession)은 index를 유지
    if (!Object.keys(scenarioAnswers.value).length) {
      scenarioStepIndex.value = 0
      scenarioAttemptResult.value = null
      resetScenarioStepUi()
    }
  }

  const selectScenarioOption = (key) => {
    if (scenarioPhase.value !== 'PLAY' || scenarioIsGraded.value) return
    scenarioSelectedKey.value = key
    scenarioUiStatus.value = 'SELECTED'
  }

  const submitCurrentScenarioStep = async () => {
    const step = scenarioCurrentStep.value
    if (!step || scenarioUiStatus.value !== 'SELECTED' || !scenarioSelectedKey.value) return false

    // 재진입 복원 등으로 서버에 이미 제출된 문항은 PUT을 다시 보내지 않는다 (409 방지).
    if (
      step.correctKey != null &&
      scenarioAnswers.value[step.stepId] === scenarioSelectedKey.value
    ) {
      scenarioUiStatus.value = scenarioSelectedKey.value === step.correctKey ? 'CORRECT' : 'WRONG'
      return true
    }

    scenarioAnswers.value = {
      ...scenarioAnswers.value,
      [step.stepId]: scenarioSelectedKey.value,
    }

    if (scenarioAttemptId.value != null) {
      const { data: graded } = await gradeQuizAttemptAnswer(
        scenarioAttemptId.value,
        step.stepId,
        scenarioSelectedKey.value,
      )
      step.correctKey = graded.correctAnswer?.key ?? step.correctKey
      step.explanation = graded.explanation ?? step.explanation
      scenarioUiStatus.value = graded.isCorrect ? 'CORRECT' : 'WRONG'
      if (graded.attempt?.status === 'GRADED') {
        scenarioFinalGrading.value = graded
      }
    } else {
      scenarioUiStatus.value = scenarioSelectedKey.value === step.correctKey ? 'CORRECT' : 'WRONG'
    }
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
    if (!mainChapterId || !scenarioSteps.value.length) return null

    const chapterBeforeCompletion = curriculumItems.value.find(
      (item) => item.mainChapterId === mainChapterId,
    )
    const wasFoundationChapter = chapterBeforeCompletion?.chapterType === 'FOUNDATION'
    // 재응시 성공은 수료 전환이 아니므로 초기 자본 지급 세리머니를 다시 띄우지 않는다.
    const wasFoundationAlreadyCompleted = chapterBeforeCompletion?.status === 'COMPLETED'

    const steps = scenarioSteps.value
    const totalCount = steps.length
    const correctCount = steps.filter(
      (step) => scenarioAnswers.value[step.stepId] === step.correctKey,
    ).length
    const quizScore = totalCount ? Math.round((correctCount / totalCount) * 100) : 0

    const pointsGranted = Number(scenarioFinalGrading.value?.reward?.points) || 0
    const data = {
      mainChapterId,
      totalCount,
      correctCount,
      quizScore,
      rewardStar: scenarioDetail.value?.rewardStar ?? 0,
      pointsGranted,
      wrongAnswers: steps
        .filter((step) => scenarioAnswers.value[step.stepId] !== step.correctKey)
        .map((step) => ({
          stepId: step.stepId,
          selectedKey: scenarioAnswers.value[step.stepId] ?? '',
          correctKey: step.correctKey,
        })),
      gradedAnswers: steps.map((step) => ({
        stepId: step.stepId,
        selectedKey: scenarioAnswers.value[step.stepId] ?? '',
        isCorrect: scenarioAnswers.value[step.stepId] === step.correctKey,
      })),
      mainChapterCompleted: scenarioFinalGrading.value?.mainChapterCompleted === true,
      nextAction: scenarioFinalGrading.value?.nextAction ?? null,
    }

    scenarioAttemptResult.value = data
    scenarioPhase.value = 'RESULT'
    await useUserStore().syncPointBalance()

    const item = learningItems.value.find(
      (row) => row.mainChapterId === mainChapterId && row.entryType === 'SCENARIO_QUIZ',
    )
    if (item && data.mainChapterCompleted) {
      item.status = 'COMPLETED'
      item.quizScore = data.quizScore
      item.completedAt = item.completedAt ?? new Date().toISOString()
    }

    await Promise.all([fetchRoadmap({ force: true }), fetchContinuePosition()])
    applyLearningItemsFromStage(mainChapterId)

    if (
      data.mainChapterCompleted &&
      wasFoundationChapter &&
      !wasFoundationAlreadyCompleted &&
      isFoundationCompletedFlag.value
    ) {
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
      await Promise.all([ensureRoadmap(), fetchContinuePosition()])

      const mainChapterId =
        options.mainChapterId ??
        focusedMainChapterId.value ??
        activeCurriculumItem.value?.mainChapterId ??
        roadmapStages.value.find((stage) => stage.status === 'ACTIVE')?.mainChapterId ??
        null

      if (mainChapterId == null) {
        learningItems.value = []
        return
      }

      applyLearningItemsFromStage(mainChapterId)
      learningItems.value = await mergeLearningItemsWithProgress(learningItems.value)
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
    isLoading.value = false
    error.value = null
  }

  return {
    curriculumItems,
    learningItems,
    roadmapStages,
    hasRoadmap,
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
    scenarioFinalGrading,
    activeCurriculumItem,
    focusedMainChapterId,
    isFocusedMainChapterCompleted,
    isCurriculumFullyCompleted,
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
    ensureRoadmap,
    invalidateRoadmap,
    patchRoadmapPeriod,
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
