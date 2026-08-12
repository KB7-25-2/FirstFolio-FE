import { ALLOW_DUPLICATE_POINT_GRANT, POINTS_PER_CORRECT } from '@/constants/quizPolicy.js'
import { ApiError } from '@/api/user/errorHandler.js'
import {
  getChapterGame as getChapterGameApi,
  getContinuePosition as getContinuePositionApi,
  getCurriculum as getCurriculumApi,
  getLearningProgress as getLearningProgressApi,
  getScenario as getScenarioApi,
  getSubChapterLesson as getSubChapterLessonApi,
  saveLessonProgress as saveLessonProgressApi,
  submitScenarioAttempt as submitScenarioAttemptApi,
} from '@/api/user/studyApi.js'
import {
  getQuizQuestions as getQuizQuestionsApi,
  gradeQuizAnswer as gradeQuizAnswerApi,
  submitQuizAttempt as submitQuizAttemptApi,
} from '@/api/user/quizApi.js'
import { pickField, unwrapData } from '@/utils/apiMapper.js'

/**
 * @typedef {import('@/types/study.js').CurriculumItem} CurriculumItem
 * @typedef {import('@/types/study.js').LearningProgressItem} LearningProgressItem
 * @typedef {import('@/types/study.js').SubChapterContent} SubChapterContent
 * @typedef {import('@/types/study.js').ContinuePosition} ContinuePosition
 * @typedef {import('@/types/study.js').LessonPage} LessonPage
 * @typedef {import('@/types/study.js').SubChapterLessonJson} SubChapterLessonJson
 * @typedef {import('@/types/study.js').LearningProgressStatus} LearningProgressStatus
 * @typedef {import('@/types/study.js').QuizQuestion} QuizQuestion
 * @typedef {import('@/types/study.js').QuizAnswerItem} QuizAnswerItem
 * @typedef {import('@/types/study.js').QuizAttemptResult} QuizAttemptResult
 * @typedef {import('@/types/study.js').QuizWrongAnswer} QuizWrongAnswer
 * @typedef {import('@/types/study.js').ChapterGame} ChapterGame
 * @typedef {import('@/types/study.js').ScenarioDetail} ScenarioDetail
 * @typedef {import('@/types/study.js').ScenarioAnswerItem} ScenarioAnswerItem
 * @typedef {import('@/types/study.js').ScenarioAttemptResult} ScenarioAttemptResult
 * @typedef {import('@/types/quiz.js').QuizGradeResult} QuizGradeResult
 */

const delay = (ms = 150) => new Promise((resolve) => setTimeout(resolve, ms))
export class StudyApiError extends Error {
  /**
   * @param {string} code
   * @param {string} message
   * @param {number} [status=400]
   */
  constructor(code, message, status = 400) {
    super(message)
    this.name = 'StudyApiError'
    this.code = code
    this.status = status
    this.requestId = `req-mock-${Date.now()}`
  }
}

/** @type {Record<string, string>} */
const STUDY_ERROR_MESSAGES = {
  UNAUTHORIZED: '인증이 필요합니다. 다시 로그인해 주세요.',
  CURRICULUM_NOT_FOUND: '확정된 커리큘럼이 없다.',
  SUB_CHAPTER_NOT_FOUND: '공개 소단원을 찾을 수 없다.',
  CONTENT_NOT_FOUND: '학습 페이지를 찾을 수 없다.',
  PREREQUISITE_REQUIRED: '선행 학습이 필요하다.',
  QUESTIONS_NOT_FOUND: '퀴즈 문항을 찾을 수 없다.',
  CONTINUE_POSITION_NOT_FOUND: '이어갈 미완료 학습이 없다.',
  CHAPTER_GAME_NOT_FOUND: '챕터 게임을 찾을 수 없다.',
  CHAPTER_GAME_LOCKED: '아직 잠긴 챕터 게임이다.',
  SCENARIO_NOT_FOUND: '시나리오를 찾을 수 없다.',
  INVALID_ATTEMPT: '제출 데이터가 올바르지 않다.',
}

/** DEV에서도 mock으로 가리지 않는 비즈니스 오류 (NOT_FOUND 는 시드 전이라 DEV 폴백 허용) */
const BUSINESS_ERROR_CODES = new Set([
  'UNAUTHORIZED',
  'PREREQUISITE_REQUIRED',
  'CHAPTER_GAME_LOCKED',
  'INVALID_ATTEMPT',
  'INVALID_ANSWER',
  'VALIDATION_ERROR',
])

/**
 * @param {unknown} error
 * @param {string} fallbackCode
 * @param {string} fallbackMessage
 * @returns {StudyApiError}
 */
const mapStudyError = (error, fallbackCode, fallbackMessage) => {
  if (error instanceof StudyApiError) return error

  if (error instanceof ApiError) {
    const code = error.code || fallbackCode
    const message = STUDY_ERROR_MESSAGES[error.code] ?? error.message ?? fallbackMessage
    const mapped = new StudyApiError(code, message, error.status)
    mapped.unmapped = !error.code
    return mapped
  }

  if (error && typeof error === 'object' && 'code' in error && 'message' in error) {
    const err = /** @type {{ code: string, message: string, status?: number }} */ (error)
    return new StudyApiError(
      err.code,
      STUDY_ERROR_MESSAGES[err.code] ?? err.message,
      err.status ?? 400,
    )
  }

  const mapped = new StudyApiError(fallbackCode, fallbackMessage, 500)
  mapped.unmapped = true
  return mapped
}

/**
 * @param {StudyApiError} error
 * @returns {boolean}
 */
const shouldFallbackToMock = (error) => {
  if (BUSINESS_ERROR_CODES.has(error.code)) return false
  if (import.meta.env.DEV) return true
  return Boolean(error.unmapped) && (error.status === 404 || error.status === 0)
}

/** @type {Map<string, SubChapterLessonJson>} */
const LESSON_JSON_CACHE = new Map()

const lessonCacheKey = (subChapterId) => `api:sub-chapter:${subChapterId}`

/**
 * @param {object | null | undefined} lesson
 * @returns {SubChapterLessonJson}
 */
const mapLessonJson = (lesson) => {
  if (!lesson || typeof lesson !== 'object') {
    return { schemaVersion: '1.0', pages: [], subChapterQuiz: { questionIds: [] } }
  }
  const quiz = lesson.subChapterQuiz ?? lesson.sub_chapter_quiz ?? {}
  return {
    schemaVersion: String(pickField(lesson, 'schemaVersion', 'schema_version') ?? '1.0'),
    pages: Array.isArray(lesson.pages) ? lesson.pages : [],
    subChapterQuiz: {
      questionIds: quiz.questionIds ?? quiz.question_ids ?? [],
    },
  }
}

/**
 * @param {object} raw LessonContentResponse
 * @param {SubChapterLessonJson} lessonJson
 * @returns {SubChapterContent}
 */
const mapLessonContentResponse = (raw, lessonJson) => {
  const subChapterId = Number(pickField(raw, 'subChapterId', 'sub_chapter_id'))
  const progress = raw.progress ?? {}
  return {
    subChapterId,
    mainChapterId: Number(pickField(raw, 'mainChapterId', 'main_chapter_id') ?? 0),
    title: raw.title ?? '',
    contentVersionId: Number(pickField(raw, 'contentVersionId', 'content_version_id') ?? 0),
    schemaVersion: String(
      pickField(raw, 'schemaVersion', 'schema_version') ?? lessonJson.schemaVersion,
    ),
    contentUrl: pickField(raw, 'contentUrl', 'content_url') ?? lessonCacheKey(subChapterId),
    expiresAt:
      pickField(raw, 'expiresAt', 'expires_at') ??
      new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    progress: {
      status: progress.status ?? 'NOT_STARTED',
      lastPageId: pickField(progress, 'lastPageId', 'last_page_id') ?? null,
      completedAt: pickField(progress, 'completedAt', 'completed_at') ?? null,
    },
  }
}

/**
 * @param {object} raw
 * @returns {LearningProgressItem}
 */
const mapLearningProgressItem = (raw) => ({
  progressId: Number(pickField(raw, 'progressId', 'progress_id') ?? 0),
  userId: Number(pickField(raw, 'userId', 'user_id') ?? 0),
  mainChapterId: Number(pickField(raw, 'mainChapterId', 'main_chapter_id')),
  subChapterId: pickField(raw, 'subChapterId', 'sub_chapter_id') ?? null,
  contentVersionId: pickField(raw, 'contentVersionId', 'content_version_id') ?? null,
  lastPageId: pickField(raw, 'lastPageId', 'last_page_id') ?? null,
  status: raw.status ?? 'NOT_STARTED',
  startedAt: pickField(raw, 'startedAt', 'started_at') ?? null,
  completedAt: pickField(raw, 'completedAt', 'completed_at') ?? null,
  updatedAt: pickField(raw, 'updatedAt', 'updated_at') ?? new Date().toISOString(),
  order: Number(pickField(raw, 'order', 'displayOrder', 'display_order') ?? 0),
  title: raw.title ?? '',
  shortLabel: pickField(raw, 'shortLabel', 'short_label') ?? '',
  periodSubtitle: pickField(raw, 'periodSubtitle', 'period_subtitle'),
  entryType: pickField(raw, 'entryType', 'entry_type') ?? 'LESSON',
  quizScore: pickField(raw, 'quizScore', 'quiz_score') ?? null,
})

/**
 * @param {object} raw
 * @returns {QuizQuestion}
 */
const mapQuizQuestion = (raw) => ({
  questionId: Number(pickField(raw, 'questionId', 'question_id')),
  questionKey: pickField(raw, 'questionKey', 'question_key') ?? '',
  versionNo: Number(pickField(raw, 'versionNo', 'version_no') ?? 1),
  usageType: pickField(raw, 'usageType', 'usage_type') ?? 'SUB_CHAPTER',
  mainChapterId: pickField(raw, 'mainChapterId', 'main_chapter_id') ?? null,
  subChapterId: pickField(raw, 'subChapterId', 'sub_chapter_id') ?? null,
  displayOrder: pickField(raw, 'displayOrder', 'display_order') ?? null,
  questionType: pickField(raw, 'questionType', 'question_type'),
  difficulty: raw.difficulty ?? null,
  prompt: raw.prompt ?? '',
  scenarioJson: pickField(raw, 'scenarioJson', 'scenario_json', 'scenario') ?? null,
  optionsJson: pickField(raw, 'optionsJson', 'options_json', 'options') ?? [],
  correctAnswerJson:
    pickField(raw, 'correctAnswerJson', 'correct_answer_json', 'correctAnswer') ?? null,
  explanation: raw.explanation ?? '',
  generationType: pickField(raw, 'generationType', 'generation_type') ?? 'HUMAN',
  sourceRefsJson: pickField(raw, 'sourceRefsJson', 'source_refs_json') ?? null,
  status: raw.status ?? 'PUBLISHED',
})

/**
 * @param {object} raw
 * @returns {QuizGradeResult}
 */
const mapQuizGradeResult = (raw) => ({
  quizAnswerId: Number(pickField(raw, 'quizAnswerId', 'quiz_answer_id') ?? 0),
  questionId: Number(pickField(raw, 'questionId', 'question_id')),
  generationType: pickField(raw, 'generationType', 'generation_type') ?? 'HUMAN',
  selectedKey: pickField(raw, 'selectedKey', 'selected_key') ?? '',
  isCorrect: Boolean(pickField(raw, 'isCorrect', 'is_correct')),
  correctAnswer: pickField(raw, 'correctAnswer', 'correct_answer', 'correctAnswerJson') ?? {
    key: '',
  },
  explanation: raw.explanation ?? '',
  answeredCount: Number(pickField(raw, 'answeredCount', 'answered_count') ?? 0),
  totalCount: Number(pickField(raw, 'totalCount', 'total_count') ?? 0),
  attemptCompleted: Boolean(pickField(raw, 'attemptCompleted', 'attempt_completed')),
  result: pickField(raw, 'result') ?? undefined,
})

/**
 * @param {object} raw
 * @returns {QuizAttemptResult}
 */
const mapQuizAttemptResult = (raw) => ({
  subChapterId: pickField(raw, 'subChapterId', 'sub_chapter_id'),
  totalCount: Number(pickField(raw, 'totalCount', 'total_count') ?? 0),
  correctCount: Number(pickField(raw, 'correctCount', 'correct_count') ?? 0),
  quizScore: Number(pickField(raw, 'quizScore', 'quiz_score', 'score') ?? 0),
  pointsGranted: Number(pickField(raw, 'pointsGranted', 'points_granted') ?? 0),
  wrongAnswers: (pickField(raw, 'wrongAnswers', 'wrong_answers') ?? []).map((item) => ({
    questionId: Number(pickField(item, 'questionId', 'question_id')),
    selectedKey: pickField(item, 'selectedKey', 'selected_key') ?? '',
    correctKey: pickField(item, 'correctKey', 'correct_key') ?? '',
  })),
  gradedAnswers: (pickField(raw, 'gradedAnswers', 'graded_answers') ?? []).map((item) => ({
    questionId: Number(pickField(item, 'questionId', 'question_id')),
    selectedKey: pickField(item, 'selectedKey', 'selected_key') ?? '',
    isCorrect: Boolean(pickField(item, 'isCorrect', 'is_correct')),
  })),
})

/** 개인 커리큘럼 조회 API 목업 — 기초 수료 후 예·적금 진행 중 유저 */
const MOCK_CURRICULUM_RESPONSE = {
  data: {
    items: [
      {
        curriculum_item_id: 501,
        main_chapter_id: 1,
        title: '포트폴리오 기초',
        chapter_type: 'FOUNDATION',
        display_order: 1,
        status: 'COMPLETED',
        completed_at: '2026-06-20T12:00:00',
        progress_percent: 100,
      },
      {
        curriculum_item_id: 502,
        main_chapter_id: 2,
        title: '예·적금',
        chapter_type: 'CORE',
        display_order: 2,
        status: 'ACTIVE',
        completed_at: null,
        progress_percent: 50,
      },
      {
        curriculum_item_id: 503,
        main_chapter_id: 3,
        title: '채권',
        chapter_type: 'CORE',
        display_order: 3,
        status: 'LOCKED',
        completed_at: null,
        progress_percent: 0,
      },
      {
        curriculum_item_id: 504,
        main_chapter_id: 4,
        title: '주식',
        chapter_type: 'CORE',
        display_order: 4,
        status: 'LOCKED',
        completed_at: null,
        progress_percent: 0,
      },
      {
        curriculum_item_id: 505,
        main_chapter_id: 5,
        title: '펀드',
        chapter_type: 'CORE',
        display_order: 5,
        status: 'LOCKED',
        completed_at: null,
        progress_percent: 0,
      },
    ],
  },
}

/**
 * 시드: 예·적금(2) — 1~2교시 수료, 3교시(103) 진행 중, 시나리오 잠금
 * 그 외 대단원도 로드맵 표시용 소단원 mock 포함
 * @type {LearningProgressItem[]}
 */
const MOCK_LEARNING_PROGRESS = [
  // —— 포트폴리오 기초(1) COMPLETED ——
  {
    progressId: 111,
    userId: 1,
    mainChapterId: 1,
    subChapterId: 11,
    contentVersionId: 211,
    lastPageId: 'page-final',
    status: 'COMPLETED',
    startedAt: '2026-06-10T10:00:00',
    completedAt: '2026-06-11T12:00:00',
    updatedAt: '2026-06-11T12:00:00',
    order: 1,
    title: '포트폴리오란?',
    shortLabel: '기초개념',
    periodSubtitle: '1교시 · 자산 바구니 소개',
    entryType: 'LESSON',
    quizScore: 100,
  },
  {
    progressId: 112,
    userId: 1,
    mainChapterId: 1,
    subChapterId: 12,
    contentVersionId: 212,
    lastPageId: 'page-final',
    status: 'COMPLETED',
    startedAt: '2026-06-12T10:00:00',
    completedAt: '2026-06-13T11:00:00',
    updatedAt: '2026-06-13T11:00:00',
    order: 2,
    title: '위험과 수익',
    shortLabel: '위험수익',
    periodSubtitle: '2교시 · 트레이드오프 이해하기',
    entryType: 'LESSON',
    quizScore: 90,
  },
  {
    progressId: 113,
    userId: 1,
    mainChapterId: 1,
    subChapterId: 13,
    contentVersionId: 213,
    lastPageId: 'page-final',
    status: 'COMPLETED',
    startedAt: '2026-06-14T09:00:00',
    completedAt: '2026-06-15T10:00:00',
    updatedAt: '2026-06-15T10:00:00',
    order: 3,
    title: '분산 투자의 힘',
    shortLabel: '분산투자',
    periodSubtitle: '3교시 · 달걀을 한 바구니에?',
    entryType: 'LESSON',
    quizScore: 100,
  },
  {
    progressId: 114,
    userId: 1,
    mainChapterId: 1,
    subChapterId: 14,
    contentVersionId: 214,
    lastPageId: 'page-final',
    status: 'COMPLETED',
    startedAt: '2026-06-16T09:00:00',
    completedAt: '2026-06-17T10:00:00',
    updatedAt: '2026-06-17T10:00:00',
    order: 4,
    title: '나만의 목표 설정',
    shortLabel: '목표설정',
    periodSubtitle: '4교시 · 투자 성향 점검',
    entryType: 'LESSON',
    quizScore: 100,
  },
  {
    progressId: 115,
    userId: 1,
    mainChapterId: 1,
    subChapterId: null,
    contentVersionId: null,
    lastPageId: null,
    status: 'COMPLETED',
    startedAt: '2026-06-18T09:00:00',
    completedAt: '2026-06-18T10:00:00',
    updatedAt: '2026-06-18T10:00:00',
    order: 5,
    title: '기초 실전 퀴즈',
    shortLabel: '실전퀴즈',
    periodSubtitle: '5교시 · 기초 점검',
    entryType: 'SCENARIO_QUIZ',
    quizScore: 100,
  },
  // —— 예·적금(2) ACTIVE ——
  {
    progressId: 201,
    userId: 1,
    mainChapterId: 2,
    subChapterId: 101,
    contentVersionId: 301,
    lastPageId: 'page-final',
    status: 'COMPLETED',
    startedAt: '2026-07-01T10:00:00',
    completedAt: '2026-07-02T14:30:00',
    updatedAt: '2026-07-02T14:30:00',
    order: 1,
    title: '예금이란?',
    shortLabel: '예금 기초',
    periodSubtitle: '1교시 · 예금의 기본 개념',
    entryType: 'LESSON',
    quizScore: 100,
  },
  {
    progressId: 202,
    userId: 1,
    mainChapterId: 2,
    subChapterId: 102,
    contentVersionId: 302,
    lastPageId: 'page-final',
    status: 'COMPLETED',
    startedAt: '2026-07-03T09:00:00',
    completedAt: '2026-07-04T11:00:00',
    updatedAt: '2026-07-04T11:00:00',
    order: 2,
    title: '예금의 종류',
    shortLabel: '예금 종류',
    periodSubtitle: '2교시 · 보통·정기·적금',
    entryType: 'LESSON',
    quizScore: 100,
  },
  {
    progressId: 203,
    userId: 1,
    mainChapterId: 2,
    subChapterId: 103,
    contentVersionId: 303,
    lastPageId: 'page-2',
    status: 'IN_PROGRESS',
    startedAt: '2026-07-05T16:00:00',
    completedAt: null,
    updatedAt: '2026-07-05T16:45:00',
    order: 3,
    title: '금리의 이해',
    shortLabel: '금리',
    periodSubtitle: '3교시 · 단리와 복리',
    entryType: 'LESSON',
    quizScore: null,
  },
  {
    progressId: 204,
    userId: 1,
    mainChapterId: 2,
    subChapterId: 104,
    contentVersionId: 304,
    lastPageId: null,
    status: 'NOT_STARTED',
    startedAt: null,
    completedAt: null,
    updatedAt: '2026-07-01T00:00:00',
    order: 4,
    title: '예금자 보호 제도',
    shortLabel: '예금자보호',
    periodSubtitle: '4교시 · 5천만원 보호한도',
    entryType: 'LESSON',
    quizScore: null,
  },
  {
    progressId: 205,
    userId: 1,
    mainChapterId: 2,
    subChapterId: 105,
    contentVersionId: 305,
    lastPageId: null,
    status: 'NOT_STARTED',
    startedAt: null,
    completedAt: null,
    updatedAt: '2026-07-01T00:00:00',
    order: 5,
    title: '저축 목표 세우기',
    shortLabel: '저축목표',
    periodSubtitle: '5교시 · 나만의 저축 계획',
    entryType: 'LESSON',
    quizScore: null,
  },
  {
    progressId: 206,
    userId: 1,
    mainChapterId: 2,
    subChapterId: null,
    contentVersionId: null,
    lastPageId: null,
    status: 'NOT_STARTED',
    startedAt: null,
    completedAt: null,
    updatedAt: '2026-07-01T00:00:00',
    order: 6,
    title: '예금 실전 퀴즈',
    shortLabel: '실전퀴즈',
    periodSubtitle: '6교시 · 배운 내용 점검',
    entryType: 'SCENARIO_QUIZ',
    quizScore: null,
  },
  // —— 채권(3) LOCKED ——
  {
    progressId: 301,
    userId: 1,
    mainChapterId: 3,
    subChapterId: 201,
    contentVersionId: 401,
    lastPageId: null,
    status: 'NOT_STARTED',
    startedAt: null,
    completedAt: null,
    updatedAt: '2026-07-01T00:00:00',
    order: 1,
    title: '채권이란?',
    shortLabel: '채권기초',
    periodSubtitle: '1교시 · 빌려주는 투자의 개념',
    entryType: 'LESSON',
    quizScore: null,
  },
  {
    progressId: 302,
    userId: 1,
    mainChapterId: 3,
    subChapterId: 202,
    contentVersionId: 402,
    lastPageId: null,
    status: 'NOT_STARTED',
    startedAt: null,
    completedAt: null,
    updatedAt: '2026-07-01T00:00:00',
    order: 2,
    title: '금리와 채권 가격',
    shortLabel: '가격관계',
    periodSubtitle: '2교시 · 금리가 오르면?',
    entryType: 'LESSON',
    quizScore: null,
  },
  {
    progressId: 303,
    userId: 1,
    mainChapterId: 3,
    subChapterId: 203,
    contentVersionId: 403,
    lastPageId: null,
    status: 'NOT_STARTED',
    startedAt: null,
    completedAt: null,
    updatedAt: '2026-07-01T00:00:00',
    order: 3,
    title: '국채와 회사채',
    shortLabel: '채권종류',
    periodSubtitle: '3교시 · 누가 발행할까',
    entryType: 'LESSON',
    quizScore: null,
  },
  {
    progressId: 304,
    userId: 1,
    mainChapterId: 3,
    subChapterId: 204,
    contentVersionId: 404,
    lastPageId: null,
    status: 'NOT_STARTED',
    startedAt: null,
    completedAt: null,
    updatedAt: '2026-07-01T00:00:00',
    order: 4,
    title: '신용등급 읽기',
    shortLabel: '신용등급',
    periodSubtitle: '4교시 · 리스크 한눈에',
    entryType: 'LESSON',
    quizScore: null,
  },
  {
    progressId: 305,
    userId: 1,
    mainChapterId: 3,
    subChapterId: null,
    contentVersionId: null,
    lastPageId: null,
    status: 'NOT_STARTED',
    startedAt: null,
    completedAt: null,
    updatedAt: '2026-07-01T00:00:00',
    order: 5,
    title: '채권 실전 퀴즈',
    shortLabel: '실전퀴즈',
    periodSubtitle: '5교시 · 배운 내용 점검',
    entryType: 'SCENARIO_QUIZ',
    quizScore: null,
  },
  // —— 주식(4) LOCKED ——
  {
    progressId: 401,
    userId: 1,
    mainChapterId: 4,
    subChapterId: 301,
    contentVersionId: 501,
    lastPageId: null,
    status: 'NOT_STARTED',
    startedAt: null,
    completedAt: null,
    updatedAt: '2026-07-01T00:00:00',
    order: 1,
    title: '주식이란?',
    shortLabel: '주식기초',
    periodSubtitle: '1교시 · 회사의 조각 소유하기',
    entryType: 'LESSON',
    quizScore: null,
  },
  {
    progressId: 402,
    userId: 1,
    mainChapterId: 4,
    subChapterId: 302,
    contentVersionId: 502,
    lastPageId: null,
    status: 'NOT_STARTED',
    startedAt: null,
    completedAt: null,
    updatedAt: '2026-07-01T00:00:00',
    order: 2,
    title: '시가총액과 주가',
    shortLabel: '시가총액',
    periodSubtitle: '2교시 · 숫자가 말하는 것',
    entryType: 'LESSON',
    quizScore: null,
  },
  {
    progressId: 403,
    userId: 1,
    mainChapterId: 4,
    subChapterId: 303,
    contentVersionId: 503,
    lastPageId: null,
    status: 'NOT_STARTED',
    startedAt: null,
    completedAt: null,
    updatedAt: '2026-07-01T00:00:00',
    order: 3,
    title: '차트 기초',
    shortLabel: '차트',
    periodSubtitle: '3교시 · 봉차트 읽기',
    entryType: 'LESSON',
    quizScore: null,
  },
  {
    progressId: 404,
    userId: 1,
    mainChapterId: 4,
    subChapterId: 304,
    contentVersionId: 504,
    lastPageId: null,
    status: 'NOT_STARTED',
    startedAt: null,
    completedAt: null,
    updatedAt: '2026-07-01T00:00:00',
    order: 4,
    title: '배당과 권리',
    shortLabel: '배당',
    periodSubtitle: '4교시 · 주주의 몫',
    entryType: 'LESSON',
    quizScore: null,
  },
  {
    progressId: 405,
    userId: 1,
    mainChapterId: 4,
    subChapterId: null,
    contentVersionId: null,
    lastPageId: null,
    status: 'NOT_STARTED',
    startedAt: null,
    completedAt: null,
    updatedAt: '2026-07-01T00:00:00',
    order: 5,
    title: '주식 실전 퀴즈',
    shortLabel: '실전퀴즈',
    periodSubtitle: '5교시 · 배운 내용 점검',
    entryType: 'SCENARIO_QUIZ',
    quizScore: null,
  },
  // —— 펀드(5) LOCKED ——
  {
    progressId: 501,
    userId: 1,
    mainChapterId: 5,
    subChapterId: 401,
    contentVersionId: 601,
    lastPageId: null,
    status: 'NOT_STARTED',
    startedAt: null,
    completedAt: null,
    updatedAt: '2026-07-01T00:00:00',
    order: 1,
    title: '펀드란?',
    shortLabel: '펀드기초',
    periodSubtitle: '1교시 · 모아서 투자하기',
    entryType: 'LESSON',
    quizScore: null,
  },
  {
    progressId: 502,
    userId: 1,
    mainChapterId: 5,
    subChapterId: 402,
    contentVersionId: 602,
    lastPageId: null,
    status: 'NOT_STARTED',
    startedAt: null,
    completedAt: null,
    updatedAt: '2026-07-01T00:00:00',
    order: 2,
    title: 'ETF와 뮤추얼펀드',
    shortLabel: '펀드종류',
    periodSubtitle: '2교시 · 어떤 그릇에 담을까',
    entryType: 'LESSON',
    quizScore: null,
  },
  {
    progressId: 503,
    userId: 1,
    mainChapterId: 5,
    subChapterId: 403,
    contentVersionId: 603,
    lastPageId: null,
    status: 'NOT_STARTED',
    startedAt: null,
    completedAt: null,
    updatedAt: '2026-07-01T00:00:00',
    order: 3,
    title: '보수와 비용',
    shortLabel: '비용',
    periodSubtitle: '3교시 · 수수료가 먹는 수익',
    entryType: 'LESSON',
    quizScore: null,
  },
  {
    progressId: 504,
    userId: 1,
    mainChapterId: 5,
    subChapterId: 404,
    contentVersionId: 604,
    lastPageId: null,
    status: 'NOT_STARTED',
    startedAt: null,
    completedAt: null,
    updatedAt: '2026-07-01T00:00:00',
    order: 4,
    title: '적립식 투자',
    shortLabel: '적립식',
    periodSubtitle: '4교시 · 시간을 나누는 전략',
    entryType: 'LESSON',
    quizScore: null,
  },
  {
    progressId: 505,
    userId: 1,
    mainChapterId: 5,
    subChapterId: null,
    contentVersionId: null,
    lastPageId: null,
    status: 'NOT_STARTED',
    startedAt: null,
    completedAt: null,
    updatedAt: '2026-07-01T00:00:00',
    order: 5,
    title: '펀드 실전 퀴즈',
    shortLabel: '실전퀴즈',
    periodSubtitle: '5교시 · 배운 내용 점검',
    entryType: 'SCENARIO_QUIZ',
    quizScore: null,
  },
]

/** 소단원 콘텐츠 접근 정보 목업 (snake_case) — sub_chapter_id 키 */
const MOCK_SUB_CHAPTER_CONTENT = {
  101: {
    sub_chapter_id: 101,
    main_chapter_id: 2,
    title: '예금의 기초',
    content_version_id: 301,
    schema_version: '1.0',
    content_url: 'https://cdn.example.com/signed/sub-101.json',
    expires_at: '2026-07-29T03:00:00Z',
    progress: {
      status: 'COMPLETED',
      last_page_id: 'page-final',
      completed_at: '2026-07-02T14:30:00',
    },
  },
  102: {
    sub_chapter_id: 102,
    main_chapter_id: 2,
    title: '예금의 종류',
    content_version_id: 302,
    schema_version: '1.0',
    content_url: 'https://cdn.example.com/signed/sub-102.json',
    expires_at: '2026-07-29T03:00:00Z',
    progress: {
      status: 'COMPLETED',
      last_page_id: 'page-final',
      completed_at: '2026-07-04T11:00:00',
    },
  },
  103: {
    sub_chapter_id: 103,
    main_chapter_id: 2,
    title: '금리의 이해',
    content_version_id: 303,
    schema_version: '1.0',
    content_url: 'https://cdn.example.com/signed/sub-103.json',
    expires_at: '2026-07-29T03:00:00Z',
    progress: {
      status: 'IN_PROGRESS',
      last_page_id: 'page-2',
      completed_at: null,
    },
  },
  104: {
    sub_chapter_id: 104,
    main_chapter_id: 2,
    title: '예금자 보호 제도',
    content_version_id: 304,
    schema_version: '1.0',
    content_url: 'https://cdn.example.com/signed/sub-104.json',
    expires_at: '2026-07-29T03:00:00Z',
    progress: {
      status: 'NOT_STARTED',
      last_page_id: null,
      completed_at: null,
    },
  },
  105: {
    sub_chapter_id: 105,
    main_chapter_id: 2,
    title: '저축 목표 세우기',
    content_version_id: 305,
    schema_version: '1.0',
    content_url: 'https://cdn.example.com/signed/sub-105.json',
    expires_at: '2026-07-29T03:00:00Z',
    progress: {
      status: 'NOT_STARTED',
      last_page_id: null,
      completed_at: null,
    },
  },
}

/** 금리의 이해(103) — Figma TextbookPage 다페이지 mock (명세 스키마 + FE 확장 블록) */
const MOCK_PAGES_INTEREST = [
  {
    id: 'page-1',
    order: 1,
    title: '실질 금리란?',
    blocks: [
      {
        type: 'text',
        content:
          '만화 속에서 토끼는 5%로 5만 원을 벌었지만,\n물가 3% 때문에 진짜 이득은 2만 원(2%)뿐이었어요.',
      },
      {
        type: 'conclusion',
        formula: '실질 금리 = 명목 금리 − 물가 상승률',
        note: '5% − 3% = 2%',
      },
      {
        type: 'definition',
        term: '명목 금리',
        body: '은행이 알려주는 겉보기 이자율.\n만화 속 5%가 바로 이것!',
      },
      {
        type: 'definition',
        term: '물가 상승률',
        body: '물건 값이 오른 비율.\n태블릿이 100만 → 103만이 된 이유.',
      },
      {
        type: 'definition',
        term: '실질 금리',
        body: '물가를 뺀 뒤, 내 주머니에\n진짜로 남는 이익.',
      },
    ],
  },
  {
    id: 'page-2',
    order: 2,
    title: '예금과 적금',
    blocks: [
      {
        type: 'text',
        content: '같은 금리라도 예금과 적금의 이자 결과가\n달라질 수 있어요.',
      },
      {
        type: 'conclusion',
        formula: '예금 = 목돈 한 번에 · 적금 = 나눠 넣기',
        note: '이자는 예치 기간만큼',
      },
      {
        type: 'definition',
        term: '정기 예금',
        body: '목돈을 한 번에 맡기는 방식',
      },
      {
        type: 'definition',
        term: '정기 적금',
        body: '매월 나눠 넣는 방식',
      },
      {
        type: 'definition',
        term: 'TIP',
        body: '왜 이자가 다른지 더 알아보세요',
      },
      {
        type: 'learn_more',
        chipLabel: '더 알아보기',
        chipSubtitle: '예금 vs 적금 이자',
        modal: {
          title: '💡 정기 예금 vs 정기 적금 이자, 왜 차이가 날까?',
          example: '예시) 1,200만 원, 금리 10%',
          body: '• 정기 예금: 1,200만 원 전체가 1년 내내 은행에 머무름 → 이자 120만 원\n\n• 정기 적금: 첫 달 100만 원은 12개월, 마지막 달 100만 원은 1개월만 머무름 → 실제 평균 금리는 절반 수준 (이자 65만 원)\n\n→ 적금 이자는 통장에 남아있는 기간만큼만 계산되기 때문입니다.',
          footer: '예금 · 적금 이자 비교',
        },
      },
    ],
  },
  {
    id: 'page-3',
    order: 3,
    title: '단리와 복리',
    blocks: [
      {
        type: 'text',
        content: '이자가 원금에만 붙는지, 이자에도 이자가\n붙는지에 따라 결과가 달라져요.',
      },
      {
        type: 'conclusion',
        formula: '복리 = 이자에 이자가 붙는 방식',
        note: '시간이 길수록 격차 ↑',
      },
      {
        type: 'definition',
        term: '단리',
        body: '원금에만 이자가 붙는 계산',
      },
      {
        type: 'definition',
        term: '복리',
        body: '원금+이자에 다시 이자가 붙는 계산',
      },
    ],
  },
  {
    id: 'page-final',
    order: 4,
    title: '오늘 배운 것',
    blocks: [
      {
        type: 'text',
        content: '실질 금리와 예·적금, 단리·복리의\n차이를 기억해 두세요.',
      },
      {
        type: 'conclusion',
        formula: '금리의 의미를 이해하고 비교할 수 있다',
        note: '퀴즈로 확인해요',
      },
    ],
  },
]

/**
 * 명세 §1.2 형태 소단원 JSON 생성
 * @param {number} subChapterId
 * @param {LessonPage[]} pages
 * @param {number[]} questionIds
 * @returns {SubChapterLessonJson}
 */
const buildLessonJson = (subChapterId, pages, questionIds) => ({
  schemaVersion: '1.0',
  subChapterId,
  pages: pages.slice().sort((a, b) => a.order - b.order),
  subChapterQuiz: {
    questionIds: questionIds.slice(),
  },
})

/**
 * 짧은 기본 강좌 페이지 (완료/미시작 소단원용)
 * @param {string} title
 * @param {string} [secondTitle]
 * @returns {LessonPage[]}
 */
const buildDefaultPages = (title, secondTitle = '금융상품을 볼 때 확인할 항목') => [
  {
    id: 'page-1',
    order: 1,
    title,
    blocks: [{ type: 'text', content: `${title}의 핵심을 알아봅니다.` }],
  },
  {
    id: 'page-2',
    order: 2,
    title: secondTitle,
    blocks: [
      {
        type: 'text',
        content: '금리, 만기, 지급 주기와 위험도를 확인합니다.',
      },
    ],
  },
]

/** content_url → 소단원 강좌 JSON (클라이언트가 URL 경로를 조합하지 않음) */
const MOCK_LESSON_JSON_BY_URL = {
  'https://cdn.example.com/signed/sub-101.json': buildLessonJson(
    101,
    [
      {
        id: 'page-1',
        order: 1,
        title: '예금과 적금의 차이',
        blocks: [{ type: 'text', content: '예금과 적금의 차이를 알아봅니다.' }],
      },
      {
        id: 'page-2',
        order: 2,
        title: '금융상품을 볼 때 확인할 항목',
        blocks: [
          {
            type: 'text',
            content: '금리, 만기, 지급 주기와 위험도를 확인합니다.',
          },
        ],
      },
    ],
    [1001, 1002, 1003],
  ),
  'https://cdn.example.com/signed/sub-102.json': buildLessonJson(
    102,
    buildDefaultPages('예금의 종류'),
    [1011, 1012, 1013],
  ),
  'https://cdn.example.com/signed/sub-103.json': buildLessonJson(
    103,
    MOCK_PAGES_INTEREST,
    [1021, 1022, 1023],
  ),
  'https://cdn.example.com/signed/sub-104.json': buildLessonJson(
    104,
    buildDefaultPages('예금자 보호 제도'),
    [1031, 1032, 1033],
  ),
  'https://cdn.example.com/signed/sub-105.json': buildLessonJson(
    105,
    buildDefaultPages('저축 목표 세우기'),
    [1041, 1042, 1043],
  ),
}

/** 이어하기 목업 — ACTIVE 대단원(예·적금). 진도 변경 시 recomputeContinuePosition으로 갱신 */
let MOCK_CONTINUE_POSITION = {
  data: {
    curriculum_item_id: 502,
    main_chapter_id: 2,
    sub_chapter_id: 103,
    content_version_id: 303,
    last_page_id: 'page-2',
    progress_percent: 50,
    route: '/learning/sub-chapters/103?page=page-2',
  },
}

/**
 * 대단원 내 LESSON 진행 목록 (order 순)
 * @param {number} mainChapterId
 */
const getLessonProgressForChapter = (mainChapterId) =>
  MOCK_LEARNING_PROGRESS.filter(
    (item) => item.mainChapterId === mainChapterId && item.entryType === 'LESSON',
  ).sort((a, b) => a.order - b.order)

/**
 * 대단원 내 모든 LESSON 수료 여부
 * @param {number} mainChapterId
 */
const areAllLessonsCompleted = (mainChapterId) => {
  const lessons = getLessonProgressForChapter(mainChapterId)
  return lessons.length > 0 && lessons.every((item) => item.status === 'COMPLETED')
}

/**
 * ACTIVE 대단원 progress_percent를 LESSON 수료 비율로 동기화
 * @param {number} mainChapterId
 */
const syncCurriculumProgressPercent = (mainChapterId) => {
  const item = MOCK_CURRICULUM_RESPONSE.data.items.find(
    (row) => row.main_chapter_id === mainChapterId,
  )
  if (!item || item.status === 'COMPLETED') return
  const lessons = getLessonProgressForChapter(mainChapterId)
  if (!lessons.length) return
  const done = lessons.filter((row) => row.status === 'COMPLETED').length
  item.progress_percent = Math.round((done / lessons.length) * 100)
}

/**
 * 시나리오 수료 시 해당 대단원 COMPLETED + 다음 LOCKED 대단원 ACTIVE
 * @param {number} completedMainChapterId
 */
const promoteNextCurriculumChapter = (completedMainChapterId) => {
  const items = MOCK_CURRICULUM_RESPONSE.data.items
  const completed = items.find((item) => item.main_chapter_id === completedMainChapterId)
  if (!completed) return

  const now = new Date().toISOString()
  completed.status = 'COMPLETED'
  completed.progress_percent = 100
  completed.completed_at = completed.completed_at ?? now

  const next = items
    .filter((item) => item.display_order > completed.display_order && item.status === 'LOCKED')
    .sort((a, b) => a.display_order - b.display_order)[0]

  if (next) {
    next.status = 'ACTIVE'
    next.progress_percent = 0
    next.completed_at = null
  }
}

/**
 * 진행도·커리큘럼 기준으로 이어하기 위치 재계산
 * StudyNote「이어서 →」및 getContinuePosition 응답에 반영
 */
const recomputeContinuePosition = () => {
  const items = MOCK_CURRICULUM_RESPONSE.data.items
  const activeChapter =
    items.find((item) => item.status === 'ACTIVE') ??
    items
      .filter((item) => item.status !== 'LOCKED')
      .sort((a, b) => b.display_order - a.display_order)[0]

  if (!activeChapter) {
    MOCK_CONTINUE_POSITION = { data: null }
    return
  }

  const mainChapterId = activeChapter.main_chapter_id
  const lessons = getLessonProgressForChapter(mainChapterId)

  // 다음 대단원 ACTIVE 직후 등 — 소단원 mock이 아직 없으면 시간표로
  if (!lessons.length) {
    MOCK_CONTINUE_POSITION = {
      data: {
        curriculum_item_id: activeChapter.curriculum_item_id,
        main_chapter_id: mainChapterId,
        sub_chapter_id: null,
        content_version_id: null,
        last_page_id: null,
        progress_percent: activeChapter.progress_percent ?? 0,
        route: `/learning?mainChapterId=${mainChapterId}`,
      },
    }
    return
  }

  const inProgress = lessons.find((item) => item.status === 'IN_PROGRESS')
  const incomplete = lessons.find((item) => item.status !== 'COMPLETED')
  const targetLesson = inProgress ?? incomplete

  if (targetLesson) {
    const pageQuery = targetLesson.lastPageId ? `?page=${targetLesson.lastPageId}` : ''
    MOCK_CONTINUE_POSITION = {
      data: {
        curriculum_item_id: activeChapter.curriculum_item_id,
        main_chapter_id: mainChapterId,
        sub_chapter_id: targetLesson.subChapterId,
        content_version_id: targetLesson.contentVersionId,
        last_page_id: targetLesson.lastPageId ?? null,
        progress_percent:
          targetLesson.status === 'COMPLETED'
            ? 100
            : targetLesson.status === 'IN_PROGRESS'
              ? 50
              : 0,
        route: `/learning/sub-chapters/${targetLesson.subChapterId}${pageQuery}`,
      },
    }
    return
  }

  const scenarioProgress = MOCK_LEARNING_PROGRESS.find(
    (item) =>
      item.mainChapterId === mainChapterId &&
      item.entryType === 'SCENARIO_QUIZ' &&
      item.status !== 'COMPLETED',
  )

  if (scenarioProgress) {
    MOCK_CONTINUE_POSITION = {
      data: {
        curriculum_item_id: activeChapter.curriculum_item_id,
        main_chapter_id: mainChapterId,
        sub_chapter_id: null,
        content_version_id: null,
        last_page_id: null,
        progress_percent: 100,
        route: `/learning/main-chapters/${mainChapterId}/scenario-quiz`,
      },
    }
    return
  }

  // ACTIVE인데 전부 수료된 경우(다음 대단원 없음) → 이어하기 없음
  if (activeChapter.status !== 'ACTIVE') {
    MOCK_CONTINUE_POSITION = { data: null }
    return
  }

  MOCK_CONTINUE_POSITION = {
    data: {
      curriculum_item_id: activeChapter.curriculum_item_id,
      main_chapter_id: mainChapterId,
      sub_chapter_id: lessons[0]?.subChapterId ?? null,
      content_version_id: lessons[0]?.contentVersionId ?? null,
      last_page_id: null,
      progress_percent: activeChapter.progress_percent ?? 0,
      route: `/learning?mainChapterId=${mainChapterId}`,
    },
  }
}

/**
 * @param {object} item
 * @returns {CurriculumItem}
 */
const mapCurriculumItem = (item) => ({
  curriculumItemId: Number(pickField(item, 'curriculumItemId', 'curriculum_item_id')),
  mainChapterId: Number(pickField(item, 'mainChapterId', 'main_chapter_id')),
  title: item.title,
  chapterType: pickField(item, 'chapterType', 'chapter_type'),
  displayOrder: Number(pickField(item, 'displayOrder', 'display_order')),
  status: item.status,
  completedAt: pickField(item, 'completedAt', 'completed_at') ?? null,
  progressPercent: Number(pickField(item, 'progressPercent', 'progress_percent') ?? 0),
})

/**
 * @param {object} raw
 * @returns {SubChapterContent}
 */
const mapSubChapterContent = (raw) => ({
  subChapterId: Number(pickField(raw, 'subChapterId', 'sub_chapter_id')),
  mainChapterId: Number(pickField(raw, 'mainChapterId', 'main_chapter_id')),
  title: raw.title,
  contentVersionId: Number(pickField(raw, 'contentVersionId', 'content_version_id')),
  schemaVersion: pickField(raw, 'schemaVersion', 'schema_version'),
  contentUrl: pickField(raw, 'contentUrl', 'content_url'),
  expiresAt: pickField(raw, 'expiresAt', 'expires_at'),
  progress: {
    status: raw.progress.status,
    lastPageId: pickField(raw.progress, 'lastPageId', 'last_page_id'),
    completedAt: pickField(raw.progress, 'completedAt', 'completed_at'),
  },
})

/**
 * @param {object} raw
 * @returns {ContinuePosition}
 */
const mapContinuePosition = (raw) => ({
  curriculumItemId: Number(pickField(raw, 'curriculumItemId', 'curriculum_item_id')),
  mainChapterId: Number(pickField(raw, 'mainChapterId', 'main_chapter_id')),
  subChapterId: pickField(raw, 'subChapterId', 'sub_chapter_id') ?? null,
  contentVersionId: pickField(raw, 'contentVersionId', 'content_version_id') ?? null,
  lastPageId: pickField(raw, 'lastPageId', 'last_page_id') ?? null,
  progressPercent: Number(pickField(raw, 'progressPercent', 'progress_percent') ?? 0),
  route: raw.route,
})

/**
 * 확정된 개인 커리큘럼 + 대단원별 진행 상태 조회 (목업)
 * @returns {Promise<{ data: { items: CurriculumItem[] } }>}
 * @throws {StudyApiError} CURRICULUM_NOT_FOUND
 */
const getCurriculumMock = async () => {
  await delay()
  const raw = structuredClone(MOCK_CURRICULUM_RESPONSE)
  const items = raw.data?.items ?? []
  if (!items.length) {
    throw new StudyApiError('CURRICULUM_NOT_FOUND', '확정된 커리큘럼이 없다.', 404)
  }
  return {
    data: {
      items: items.map(mapCurriculumItem),
    },
  }
}

/**
 * GET /curriculums — 실 API 우선, DEV에서 미구현·시드 전 404 시 mock
 * @returns {Promise<{ data: { items: CurriculumItem[] } }>}
 * @throws {StudyApiError} CURRICULUM_NOT_FOUND
 */
export const getCurriculum = async () => {
  try {
    const raw = unwrapData(await getCurriculumApi())
    const items = (raw?.items ?? []).map(mapCurriculumItem)
    if (!items.length) {
      throw new StudyApiError('CURRICULUM_NOT_FOUND', '확정된 커리큘럼이 없다.', 404)
    }
    return { data: { items } }
  } catch (error) {
    const mapped = mapStudyError(error, 'CURRICULUM_FETCH_FAILED', '커리큘럼을 불러오지 못했다.')
    if (!shouldFallbackToMock(mapped)) throw mapped
    console.warn('[studyService] getCurriculum API 실패 — mock 사용', mapped)
    return getCurriculumMock()
  }
}

/**
 * 대단원 소단원 학습 진행 목록 (목업 — 목록 API 확정 전)
 * @param {number} mainChapterId
 * @returns {Promise<{ data: { items: LearningProgressItem[] } }>}
 */
const getLearningProgressMock = async (mainChapterId) => {
  await delay()
  const items = MOCK_LEARNING_PROGRESS.filter((item) => item.mainChapterId === mainChapterId)
  return { data: { items: structuredClone(items) } }
}

/**
 * GET /learning/main-chapters/{id}/progress
 * @param {number} mainChapterId
 * @returns {Promise<{ data: { items: LearningProgressItem[] } }>}
 */
export const getLearningProgress = async (mainChapterId) => {
  try {
    const raw = unwrapData(await getLearningProgressApi(mainChapterId))
    const items = (raw?.items ?? (Array.isArray(raw) ? raw : [])).map(mapLearningProgressItem)
    return { data: { items } }
  } catch (error) {
    const mapped = mapStudyError(error, 'PROGRESS_FETCH_FAILED', '학습 진행을 불러오지 못했다.')
    if (!shouldFallbackToMock(mapped)) throw mapped
    console.warn('[studyService] getLearningProgress API 실패 — mock 사용', mapped)
    return getLearningProgressMock(mainChapterId)
  }
}

/**
 * 직전 LESSON이 미완료면 선행 차단
 * @param {number} subChapterId
 */
const isPrerequisiteBlocked = (subChapterId) => {
  const raw = MOCK_SUB_CHAPTER_CONTENT[subChapterId]
  if (!raw) return false
  const lessons = getLessonProgressForChapter(raw.main_chapter_id)
  const index = lessons.findIndex((item) => item.subChapterId === subChapterId)
  if (index <= 0) return false
  const previous = lessons[index - 1]
  return Boolean(previous && previous.status !== 'COMPLETED')
}

/**
 * 소단원 메타 + 백엔드 발급 콘텐츠 접근 정보 조회 (목업)
 * - 클라이언트는 content_url만 사용하고 S3 경로를 조합하지 않는다.
 * - 완료한 소단원도 재열람 가능하다.
 * @param {number} subChapterId
 * @returns {Promise<{ data: SubChapterContent }>}
 * @throws {StudyApiError} SUB_CHAPTER_NOT_FOUND | PREREQUISITE_REQUIRED
 */
const getSubChapterContentMock = async (subChapterId) => {
  await delay()
  if (isPrerequisiteBlocked(subChapterId)) {
    throw new StudyApiError('PREREQUISITE_REQUIRED', '선행 학습이 필요하다.', 403)
  }
  const raw = MOCK_SUB_CHAPTER_CONTENT[subChapterId]
  if (!raw) {
    throw new StudyApiError('SUB_CHAPTER_NOT_FOUND', '공개 소단원을 찾을 수 없다.', 404)
  }
  return { data: mapSubChapterContent(structuredClone(raw)) }
}

/**
 * GET /learning/sub-chapters/{id} — lesson JSON 인라인
 * @param {number} subChapterId
 * @returns {Promise<{ data: SubChapterContent }>}
 * @throws {StudyApiError} SUB_CHAPTER_NOT_FOUND | PREREQUISITE_REQUIRED
 */
export const getSubChapterContent = async (subChapterId) => {
  try {
    const raw = unwrapData(await getSubChapterLessonApi(subChapterId))
    const lessonJson = mapLessonJson(raw?.lesson)
    const meta = mapLessonContentResponse(raw, lessonJson)
    LESSON_JSON_CACHE.set(meta.contentUrl, lessonJson)
    LESSON_JSON_CACHE.set(lessonCacheKey(meta.subChapterId), lessonJson)
    return { data: meta }
  } catch (error) {
    const mapped = mapStudyError(error, 'SUB_CHAPTER_NOT_FOUND', '공개 소단원을 찾을 수 없다.')
    if (!shouldFallbackToMock(mapped)) throw mapped
    console.warn('[studyService] getSubChapterContent API 실패 — mock 사용', mapped)
    return getSubChapterContentMock(subChapterId)
  }
}

/**
 * 백엔드가 발급한 contentUrl로 소단원 강좌 JSON 로드 (목업)
 * @param {string} contentUrl
 * @returns {Promise<{ data: SubChapterLessonJson }>}
 * @throws {StudyApiError} CONTENT_NOT_FOUND
 */
const getLessonPagesMock = async (contentUrl) => {
  await delay()
  const payload = MOCK_LESSON_JSON_BY_URL[contentUrl]
  if (!payload) {
    throw new StudyApiError('CONTENT_NOT_FOUND', '학습 페이지를 찾을 수 없다.', 404)
  }
  return { data: structuredClone(payload) }
}

/**
 * 인라인 캐시 → 서명 URL fetch → mock
 * @param {string} contentUrl
 * @returns {Promise<{ data: SubChapterLessonJson }>}
 * @throws {StudyApiError} CONTENT_NOT_FOUND
 */
export const getLessonPages = async (contentUrl) => {
  const cached = LESSON_JSON_CACHE.get(contentUrl)
  if (cached) return { data: structuredClone(cached) }

  const sentinelId = /^api:sub-chapter:(\d+)$/.exec(contentUrl)?.[1]
  if (sentinelId) {
    try {
      const raw = unwrapData(await getSubChapterLessonApi(Number(sentinelId)))
      const lessonJson = mapLessonJson(raw?.lesson)
      LESSON_JSON_CACHE.set(contentUrl, lessonJson)
      return { data: structuredClone(lessonJson) }
    } catch (error) {
      const mapped = mapStudyError(error, 'CONTENT_NOT_FOUND', '학습 페이지를 찾을 수 없다.')
      if (!shouldFallbackToMock(mapped)) throw mapped
      console.warn('[studyService] getLessonPages API 재조회 실패 — mock 사용', mapped)
    }
  }

  if (/^https?:\/\//.test(contentUrl)) {
    try {
      const response = await fetch(contentUrl)
      if (!response.ok) {
        throw new StudyApiError('CONTENT_NOT_FOUND', '학습 페이지를 찾을 수 없다.', response.status)
      }
      const lessonJson = mapLessonJson(await response.json())
      LESSON_JSON_CACHE.set(contentUrl, lessonJson)
      return { data: structuredClone(lessonJson) }
    } catch (error) {
      const mapped = mapStudyError(error, 'CONTENT_NOT_FOUND', '학습 페이지를 찾을 수 없다.')
      if (!shouldFallbackToMock(mapped)) throw mapped
      console.warn('[studyService] getLessonPages URL fetch 실패 — mock 사용', mapped)
    }
  }

  return getLessonPagesMock(contentUrl)
}

/**
 * 소단원 강좌 진도 저장 (목업) — lastPageId / status
 * @param {number} subChapterId
 * @param {{ lastPageId: string, status?: LearningProgressStatus }} payload
 * @returns {Promise<{ data: { lastPageId: string, status: LearningProgressStatus } }>}
 * @throws {StudyApiError} SUB_CHAPTER_NOT_FOUND
 */
const saveLessonProgressMock = async (subChapterId, payload) => {
  await delay(80)
  const raw = MOCK_SUB_CHAPTER_CONTENT[subChapterId]
  if (!raw) {
    throw new StudyApiError('SUB_CHAPTER_NOT_FOUND', '공개 소단원을 찾을 수 없다.', 404)
  }

  const lastPageId = payload.lastPageId
  let status = payload.status ?? raw.progress.status
  if (status === 'NOT_STARTED') status = 'IN_PROGRESS'
  if (lastPageId === 'page-final' && payload.status === 'COMPLETED') {
    status = 'COMPLETED'
  }

  raw.progress.last_page_id = lastPageId
  raw.progress.status = status
  if (status === 'COMPLETED' && !raw.progress.completed_at) {
    raw.progress.completed_at = new Date().toISOString()
  }

  const progressItem = MOCK_LEARNING_PROGRESS.find((item) => item.subChapterId === subChapterId)
  if (progressItem) {
    progressItem.lastPageId = lastPageId
    progressItem.status = status
    progressItem.updatedAt = new Date().toISOString()
    if (status === 'COMPLETED') {
      progressItem.completedAt = progressItem.completedAt ?? new Date().toISOString()
    } else if (!progressItem.startedAt) {
      progressItem.startedAt = new Date().toISOString()
    }
    syncCurriculumProgressPercent(progressItem.mainChapterId)
  }

  recomputeContinuePosition()

  return {
    data: {
      lastPageId,
      status,
    },
  }
}

/**
 * PATCH /learning/sub-chapters/{id}/progress
 * @param {number} subChapterId
 * @param {{ lastPageId: string, status?: LearningProgressStatus }} payload
 * @returns {Promise<{ data: { lastPageId: string, status: LearningProgressStatus } }>}
 */
export const saveLessonProgress = async (subChapterId, payload) => {
  try {
    const raw = unwrapData(
      await saveLessonProgressApi(subChapterId, {
        last_page_id: payload.lastPageId,
        status: payload.status,
      }),
    )
    return {
      data: {
        lastPageId: pickField(raw, 'lastPageId', 'last_page_id') ?? payload.lastPageId,
        status: raw?.status ?? payload.status ?? 'IN_PROGRESS',
      },
    }
  } catch (error) {
    const mapped = mapStudyError(error, 'PROGRESS_SAVE_FAILED', '학습 진도를 저장하지 못했다.')
    if (!shouldFallbackToMock(mapped)) throw mapped
    console.warn('[studyService] saveLessonProgress API 실패 — mock 사용', mapped)
    return saveLessonProgressMock(subChapterId, payload)
  }
}

/** 소단원별 포인트 지급 여부 (재응시 중복 방지) */
const MOCK_QUIZ_POINT_GRANTED = new Set()

/** @type {QuizWrongAnswer[]} */
const MOCK_WRONG_ANSWER_LOG = []

/**
 * @param {number} questionId
 * @param {number} subChapterId
 * @param {string} questionKey
 * @param {string} prompt
 * @param {string[]} labels
 * @param {string} correctKey
 * @param {string} explanation
 * @param {'SINGLE_CHOICE' | 'TRUE_FALSE'} [questionType]
 * @returns {QuizQuestion}
 */
const buildSubChapterQuestion = (
  questionId,
  subChapterId,
  questionKey,
  prompt,
  labels,
  correctKey,
  explanation,
  questionType = 'SINGLE_CHOICE',
) => ({
  questionId,
  questionKey,
  versionNo: 1,
  usageType: 'SUB_CHAPTER',
  mainChapterId: 2,
  subChapterId,
  displayOrder: null,
  questionType,
  difficulty: 'MEDIUM',
  prompt,
  scenarioJson: null,
  optionsJson: labels.map((label, i) => ({
    key: String(i + 1),
    label,
  })),
  correctAnswerJson: { key: correctKey },
  explanation,
  sourceRefsJson: null,
  status: 'PUBLISHED',
  createdBy: 1,
  publishedAt: '2026-07-01T00:00:00',
  createdAt: '2026-06-15T00:00:00',
})

/** quiz_questions 목업 — question_id 키, 소단원 JSON questionIds와 대응 */
const MOCK_QUIZ_QUESTIONS = {
  1001: buildSubChapterQuestion(
    1001,
    101,
    'deposit-vs-savings',
    '예금과 적금의 차이로 올바른 것은?',
    [
      '예금은 나눠 넣고 적금은 한 번에 맡긴다',
      '예금은 목돈을 한 번에, 적금은 나눠 넣는다',
      '둘 다 원금이 보장되지 않는다',
      '적금만 이자가 붙는다',
    ],
    '2',
    '정기 예금은 목돈을 한 번에 맡기고, 정기 적금은 매월 나눠 넣는 방식입니다.',
  ),
  1002: buildSubChapterQuestion(
    1002,
    101,
    'deposit-check-items',
    '금융상품을 볼 때 확인할 항목이 아닌 것은?',
    ['금리', '만기', '좋아하는 색', '위험도'],
    '3',
    '금리, 만기, 지급 주기, 위험도 등을 확인합니다. 선호 색은 상품 선택 기준이 아닙니다.',
  ),
  1003: buildSubChapterQuestion(
    1003,
    101,
    'deposit-interest-period',
    '적금 이자가 예금보다 적어 보이는 이유로 적절한 것은?',
    [
      '적금은 이자가 붙지 않아서',
      '돈이 통장에 머무는 기간이 평균적으로 짧아서',
      '은행이 적금만 손해를 봐서',
      '예금만 복리여서',
    ],
    '2',
    '적금은 나중에 넣는 돈일수록 예치 기간이 짧아 평균 이자가 작아질 수 있습니다.',
  ),
  1011: buildSubChapterQuestion(
    1011,
    102,
    'deposit-types-1',
    '보통예금의 특징으로 맞는 것은?',
    ['만기가 고정된다', '자유롭게 입출금할 수 있다', '이자가 없다', '주식과 같다'],
    '2',
    '보통예금은 필요할 때 자유롭게 입출금할 수 있는 예금입니다.',
  ),
  1012: buildSubChapterQuestion(
    1012,
    102,
    'deposit-types-2',
    '정기예금에 대한 설명으로 옳은 것은?',
    [
      '매일 나눠 넣어야 한다',
      '약정한 기간 동안 목돈을 맡겨 둔다',
      '정부가 발행한다',
      '원금이 항상 줄어든다',
    ],
    '2',
    '정기예금은 약정 기간 동안 목돈을 맡겨 두고 이자를 받는 상품입니다.',
  ),
  1013: buildSubChapterQuestion(
    1013,
    102,
    'deposit-types-3',
    '적금의 특징으로 맞는 것은?',
    ['한 번에만 입금한다', '정해진 주기로 나눠 넣는다', '주식 배당이다', '만기가 없다'],
    '2',
    '적금은 매월 등 정해진 주기로 나눠 넣는 저축 방식입니다.',
  ),
  1021: buildSubChapterQuestion(
    1021,
    103,
    'stock-basics-1',
    '다음 중 주식에 대한 설명으로\n올바른 것은?',
    [
      '주식은 원금이 보장됩니다',
      '주식을 사면 회사의 주주가 됩니다',
      '주식 수익률은 항상 예금보다 낮습니다',
      '주식은 정부가 발행합니다',
    ],
    '2',
    '주식을 매수하면 해당 회사의 주주가 됩니다. 원금 보장·정부 발행은 일반적인 주식의 특성이 아닙니다.',
  ),
  1022: buildSubChapterQuestion(
    1022,
    103,
    'deposit-protection-limit',
    '예금자 보호 한도로 올바른 것은?',
    ['1천만 원', '3천만 원', '5천만 원', '한도 없음'],
    '3',
    '예금자보호제도는 금융기관당 원금과 이자를 합쳐 5천만 원까지 보호합니다.',
  ),
  1023: buildSubChapterQuestion(
    1023,
    103,
    'real-interest-formula',
    '실질 금리의 계산으로 맞는 것은?',
    [
      '명목 금리 − 물가 상승률',
      '명목 금리 + 물가 상승률',
      '명목 금리 × 물가 상승률',
      '명목 금리 ÷ 물가 상승률',
    ],
    '1',
    '실질 금리 = 명목 금리 − 물가 상승률 입니다.',
  ),
  1031: buildSubChapterQuestion(
    1031,
    104,
    'protection-1',
    '예금자 보호 제도의 목적으로 적절한 것은?',
    ['주가 부양', '예금자 보호와 금융 안정', '세금 감면', '대출 금리 인하'],
    '2',
    '금융기관 파산 시 예금자를 보호하고 금융 안정을 돕습니다.',
  ),
  1032: buildSubChapterQuestion(
    1032,
    104,
    'protection-2',
    '예금자 보호 대상이 아닌 것은?',
    ['은행 예금', '일부 저축은행 예금', '주식', '보험금 일부'],
    '3',
    '주식 등 투자 상품은 예금자 보호 대상이 아닙니다.',
  ),
  1033: buildSubChapterQuestion(
    1033,
    104,
    'protection-3',
    '보호 한도 적용 단위로 맞는 것은?',
    ['계좌마다', '금융기관마다', '상품마다', '국가마다 매일'],
    '2',
    '일반적으로 금융기관당 합산하여 한도가 적용됩니다.',
  ),
  1041: buildSubChapterQuestion(
    1041,
    105,
    'saving-goal-1',
    '저축 목표를 세울 때 먼저 할 일로 적절한 것은?',
    [
      '목표 금액과 기간을 정한다',
      '아무 상품이나 가입한다',
      '대출부터 받는다',
      '주식을 전액 매수한다',
    ],
    '1',
    '목표 금액·기간을 정한 뒤 맞는 저축 방법을 고릅니다.',
  ),
  1042: buildSubChapterQuestion(
    1042,
    105,
    'saving-goal-2',
    '단기 목표에 더 잘 맞는 상품 성향은?',
    ['장기 묶임·고위험', '유동성이 높은 예금·적금', '부동산만', '암호화폐만'],
    '2',
    '단기 목표는 꺼내 쓰기 쉬운 예·적금이 유리한 경우가 많습니다.',
  ),
  1043: buildSubChapterQuestion(
    1043,
    105,
    'saving-goal-3',
    '목표 달성 점검으로 좋은 습관은?',
    [
      '아예 확인하지 않는다',
      '주기적으로 잔액·진행률을 본다',
      '매일 전액 출금한다',
      '목표를 숨긴다',
    ],
    '2',
    '주기적으로 진행률을 보면 계획을 조정하기 쉽습니다.',
  ),
}

/**
 * 게시된 문항 행 조회 (목업) — 소단원 JSON questionIds 순서 유지
 * @param {number[]} questionIds
 * @returns {Promise<{ data: { items: QuizQuestion[] } }>}
 * @throws {StudyApiError} QUESTIONS_NOT_FOUND
 */
const getQuizQuestionsMock = async (questionIds) => {
  await delay()
  if (!questionIds?.length) {
    throw new StudyApiError('QUESTIONS_NOT_FOUND', '퀴즈 문항 ID가 없다.', 404)
  }
  const items = []
  for (const id of questionIds) {
    const row = MOCK_QUIZ_QUESTIONS[id]
    if (!row || row.status !== 'PUBLISHED') {
      throw new StudyApiError('QUESTIONS_NOT_FOUND', `문항 ${id}를 찾을 수 없다.`, 404)
    }
    items.push(structuredClone(row))
  }
  return { data: { items } }
}

/**
 * GET /quiz/questions?question_ids=
 * @param {number[]} questionIds
 * @returns {Promise<{ data: { items: QuizQuestion[] } }>}
 * @throws {StudyApiError} QUESTIONS_NOT_FOUND
 */
export const getQuizQuestions = async (questionIds) => {
  if (!questionIds?.length) {
    throw new StudyApiError('QUESTIONS_NOT_FOUND', '퀴즈 문항 ID가 없다.', 404)
  }
  try {
    const raw = unwrapData(await getQuizQuestionsApi(questionIds))
    const items = (raw?.items ?? (Array.isArray(raw) ? raw : [])).map(mapQuizQuestion)
    if (!items.length) {
      throw new StudyApiError('QUESTIONS_NOT_FOUND', '퀴즈 문항을 찾을 수 없다.', 404)
    }
    return { data: { items } }
  } catch (error) {
    const mapped = mapStudyError(error, 'QUESTIONS_NOT_FOUND', '퀴즈 문항을 찾을 수 없다.')
    if (!shouldFallbackToMock(mapped)) throw mapped
    console.warn('[studyService] getQuizQuestions API 실패 — mock 사용', mapped)
    return getQuizQuestionsMock(questionIds)
  }
}

/**
 * 문항 단위 채점 — 서버 정답 미포함 문항용
 * @param {{ subChapterId: number, questionId: number, selectedKey: string }} payload
 * @returns {Promise<{ data: QuizGradeResult }>}
 */
export const gradeQuizAnswer = async (payload) => {
  const { subChapterId, questionId, selectedKey } = payload
  try {
    const raw = unwrapData(
      await gradeQuizAnswerApi(subChapterId, {
        question_id: questionId,
        selected_key: selectedKey,
      }),
    )
    return { data: mapQuizGradeResult(raw) }
  } catch (error) {
    throw mapStudyError(error, 'INVALID_ANSWER', '채점에 실패했다.')
  }
}

/**
 * 소단원 퀴즈 제출·채점 (목업)
 * @param {{ subChapterId: number, answers: QuizAnswerItem[] }} payload
 * @returns {Promise<{ data: QuizAttemptResult }>}
 */
const submitQuizAttemptMock = async (payload) => {
  await delay(120)
  const { subChapterId, answers } = payload
  if (!subChapterId || !answers?.length) {
    throw new StudyApiError('INVALID_ATTEMPT', '제출 데이터가 올바르지 않다.', 400)
  }

  const gradedAnswers = []
  const wrongAnswers = []
  let correctCount = 0

  for (const answer of answers) {
    const question = MOCK_QUIZ_QUESTIONS[answer.questionId]
    if (!question) {
      throw new StudyApiError(
        'QUESTIONS_NOT_FOUND',
        `문항 ${answer.questionId}를 찾을 수 없다.`,
        404,
      )
    }
    const correctKey = question.correctAnswerJson?.key
    const isCorrect = answer.selectedKey === correctKey
    if (isCorrect) correctCount += 1
    else {
      wrongAnswers.push({
        questionId: answer.questionId,
        selectedKey: answer.selectedKey,
        correctKey,
      })
      MOCK_WRONG_ANSWER_LOG.push({
        questionId: answer.questionId,
        selectedKey: answer.selectedKey,
        correctKey,
        subChapterId,
        recordedAt: new Date().toISOString(),
      })
    }
    gradedAnswers.push({
      questionId: answer.questionId,
      selectedKey: answer.selectedKey,
      isCorrect,
    })
  }

  const totalCount = answers.length
  const quizScore = totalCount ? Math.round((correctCount / totalCount) * 100) : 0
  let pointsGranted = correctCount * POINTS_PER_CORRECT
  if (!ALLOW_DUPLICATE_POINT_GRANT && MOCK_QUIZ_POINT_GRANTED.has(subChapterId)) {
    pointsGranted = 0
  } else if (pointsGranted > 0) {
    MOCK_QUIZ_POINT_GRANTED.add(subChapterId)
  }

  const progressItem = MOCK_LEARNING_PROGRESS.find((item) => item.subChapterId === subChapterId)
  if (progressItem) {
    progressItem.status = 'COMPLETED'
    progressItem.quizScore = quizScore
    progressItem.completedAt = progressItem.completedAt ?? new Date().toISOString()
    progressItem.updatedAt = new Date().toISOString()
    progressItem.lastPageId = progressItem.lastPageId ?? 'page-final'
  }

  const content = MOCK_SUB_CHAPTER_CONTENT[subChapterId]
  if (content) {
    content.progress.status = 'COMPLETED'
    content.progress.completed_at = content.progress.completed_at ?? new Date().toISOString()
  }

  const mainChapterId = progressItem?.mainChapterId ?? content?.main_chapter_id
  if (mainChapterId) {
    syncCurriculumProgressPercent(mainChapterId)
    if (areAllLessonsCompleted(mainChapterId)) {
      const game = MOCK_CHAPTER_GAMES.get(Number(mainChapterId))
      if (game) game.unlocked = true
    }
  }

  recomputeContinuePosition()

  return {
    data: {
      subChapterId,
      totalCount,
      correctCount,
      quizScore,
      pointsGranted,
      wrongAnswers,
      gradedAnswers,
    },
  }
}

/**
 * POST /quiz/attempts
 * @param {{ subChapterId: number, answers: QuizAnswerItem[] }} payload
 * @returns {Promise<{ data: QuizAttemptResult }>}
 */
export const submitQuizAttempt = async (payload) => {
  try {
    const raw = unwrapData(
      await submitQuizAttemptApi({
        quiz_type: 'SUB_CHAPTER',
        sub_chapter_id: payload.subChapterId,
        answers: (payload.answers ?? []).map((answer) => ({
          question_id: answer.questionId,
          selected_key: answer.selectedKey,
        })),
      }),
    )
    return { data: mapQuizAttemptResult(raw) }
  } catch (error) {
    const mapped = mapStudyError(error, 'INVALID_ATTEMPT', '퀴즈 제출에 실패했다.')
    if (!shouldFallbackToMock(mapped)) throw mapped
    console.warn('[studyService] submitQuizAttempt API 실패 — mock 사용', mapped)
    return submitQuizAttemptMock(payload)
  }
}

/** @type {Map<number, ChapterGame>} mainChapterId → chapter game
 * unlocked는 시드 false — 전체 LESSON 수료 시 submitQuizAttempt / getChapterGame에서 해금
 */
const MOCK_CHAPTER_GAMES = new Map([
  [
    2,
    {
      chapterGameId: 50,
      mainChapterId: 2,
      title: '예금 실전 퀴즈',
      unlocked: false,
      scenarios: [
        {
          scenarioId: 501,
          title: '첫 월급을 받은 사회초년생',
          completed: false,
        },
      ],
    },
  ],
])

/** scenarioId → detail */
const MOCK_SCENARIOS = {
  501: {
    scenarioId: 501,
    title: '첫 월급을 받은 사회초년생',
    rewardStar: 50,
    content: {
      scenarioKey: 'first-salary-portfolio',
      chapterTitle: '예·적금',
      chapterSubtitle: '안전한 자산관리의 시작',
      opening: {
        documentTitle: '공 문 서',
        docNo: '제 2024-시나-001 호',
        docDate: '2024. 06. 10',
        orgName: '금융 상담 교육원',
        title: '금융 상담사 역량 평가(가명)',
        mission:
          '실전 고객 상담 시나리오를 통해 귀하의 포트폴리오 추천 역량을 평가합니다. 고객 프로필과 금융 시황을 참고하여 최적의 포트폴리오를 선택하십시오.',
        issuerLabel: '발행처',
        issuerName: '투자 상담 교육원장',
        startLabel: '게임 시작',
      },
      conditions: {
        persona: {
          name: '펭귄',
          age: '28세',
          job: '직장인',
          monthlyIncome: '300만',
          monthlySaving: '50만',
        },
        requirements: {
          assets: '800만원',
          risk: '중위험 선호',
          goal: '안정+성장',
        },
        marketTitle: '오늘의 금융 시황',
        marketDate: '2024.06.10',
        marketBullets: [
          '시중은행 정기예금 금리 연 3.2% 수준',
          '적금 우대금리 조건이 까다로워지는 추세',
          '단기 유동성 수요가 늘어난 달',
        ],
        constraints: ['원금 손실은 원하지 않음', '안정과 성장을 함께 추구'],
      },
      steps: [
        {
          stepId: 9001,
          order: 1,
          paperTitle: '포트폴리오 추천서',
          prompt:
            '첫 직장 3년 차, 월급의 일부를 꾸준히 모아두었지만 어디에 투자해야 할지 막막합니다. 안정적인 수익을 원하면서도 성장 기회를 놓치고 싶지 않아, 오늘 포트폴리오 구성 조언을 받으러 왔습니다.',
          options: [
            {
              key: '1',
              label: '예금 80%, 주식 20%',
              description: '안정적인 자산 비중을 높인 포트폴리오입니다.',
            },
            {
              key: '2',
              label: '주식 100%',
              description: '성장 가능성은 높지만 주식에만 투자합니다.',
            },
            {
              key: '3',
              label: '예금 40%, 주식 40%, 채권 20%',
              description: '안정성과 성장의 균형을 갖춘 최적의 포트폴리오입니다.',
            },
            {
              key: '4',
              label: '채권 100%',
              description: '안정적인 수익을 목표로 채권에만 투자합니다.',
            },
          ],
          correctKey: '3',
          explanation:
            '중위험·안정+성장 목표에는 예금·주식·채권을 고루 담은 포트폴리오가 가장 잘 맞습니다.',
        },
        {
          stepId: 9002,
          order: 2,
          paperTitle: '포트폴리오 추천서',
          prompt:
            '승진으로 수입이 늘었습니다. 여유 자금이 생겼지만 주식·채권·예금에 얼마나 넣을지 고민이라 전문가의 포트폴리오 추천을 원합니다.',
          options: [
            {
              key: '1',
              label: '예금 80%, 주식 20%',
              description: '안정적인 자산 비중을 높인 포트폴리오입니다.',
            },
            {
              key: '2',
              label: '주식 100%',
              description: '성장 가능성은 높지만 주식에만 투자합니다.',
            },
            {
              key: '3',
              label: '예금 40%, 주식 40%, 채권 20%',
              description: '안정성과 성장의 균형을 갖춘 최적의 포트폴리오입니다.',
            },
            {
              key: '4',
              label: '채권 100%',
              description: '안정적인 수익을 목표로 채권에만 투자합니다.',
            },
          ],
          correctKey: '3',
          explanation: '소득이 늘어도 리스크 성향이 그대로라면 균형형 배분이 더 적절합니다.',
        },
        {
          stepId: 9003,
          order: 3,
          paperTitle: '포트폴리오 추천서',
          prompt:
            '비상금은 어느 정도 모였고, 남은 돈을 조금 더 적극적으로 굴리고 싶습니다. 그래도 크게 흔들리는 건 싫어요.',
          options: [
            {
              key: '1',
              label: '예금 80%, 주식 20%',
              description: '안정적인 자산 비중을 높인 포트폴리오입니다.',
            },
            {
              key: '2',
              label: '주식 100%',
              description: '성장 가능성은 높지만 주식에만 투자합니다.',
            },
            {
              key: '3',
              label: '예금 40%, 주식 40%, 채권 20%',
              description: '안정성과 성장의 균형을 갖춘 최적의 포트폴리오입니다.',
            },
            {
              key: '4',
              label: '채권 100%',
              description: '안정적인 수익을 목표로 채권에만 투자합니다.',
            },
          ],
          correctKey: '3',
          explanation: '적극적이되 흔들림을 싫어한다면 균형형이 적합합니다.',
        },
      ],
    },
  },
}

/** 시나리오 포인트 중복 지급 방지 — scenarioId */
const MOCK_SCENARIO_POINT_GRANTED = new Set()

/**
 * 대단원 챕터 게임 조회 (목업)
 * @param {number} mainChapterId
 * @returns {Promise<{ data: ChapterGame }>}
 */
const getChapterGameMock = async (mainChapterId) => {
  await delay()
  const game = MOCK_CHAPTER_GAMES.get(Number(mainChapterId))
  if (!game) {
    throw new StudyApiError('CHAPTER_GAME_NOT_FOUND', '챕터 게임을 찾을 수 없다.', 404)
  }
  const unlocked = game.unlocked || areAllLessonsCompleted(Number(mainChapterId))
  if (!unlocked) {
    throw new StudyApiError('CHAPTER_GAME_LOCKED', '아직 잠긴 챕터 게임이다.', 403)
  }
  if (!game.unlocked) game.unlocked = true
  return { data: structuredClone(game) }
}

/**
 * GET /learning/main-chapters/{id}/game
 * @param {number} mainChapterId
 * @returns {Promise<{ data: ChapterGame }>}
 */
export const getChapterGame = async (mainChapterId) => {
  try {
    const raw = unwrapData(await getChapterGameApi(mainChapterId))
    return { data: raw }
  } catch (error) {
    const mapped = mapStudyError(error, 'CHAPTER_GAME_NOT_FOUND', '챕터 게임을 찾을 수 없다.')
    if (!shouldFallbackToMock(mapped)) throw mapped
    console.warn('[studyService] getChapterGame API 실패 — mock 사용', mapped)
    return getChapterGameMock(mainChapterId)
  }
}

/**
 * 시나리오 상세 조회 (목업)
 * @param {number} scenarioId
 * @returns {Promise<{ data: ScenarioDetail }>}
 */
const getScenarioMock = async (scenarioId) => {
  await delay()
  const row = MOCK_SCENARIOS[Number(scenarioId)]
  if (!row) {
    throw new StudyApiError('SCENARIO_NOT_FOUND', '시나리오를 찾을 수 없다.', 404)
  }
  return { data: structuredClone(row) }
}

/**
 * GET /scenarios/{id}
 * @param {number} scenarioId
 * @returns {Promise<{ data: ScenarioDetail }>}
 */
export const getScenario = async (scenarioId) => {
  try {
    const raw = unwrapData(await getScenarioApi(scenarioId))
    return { data: raw }
  } catch (error) {
    const mapped = mapStudyError(error, 'SCENARIO_NOT_FOUND', '시나리오를 찾을 수 없다.')
    if (!shouldFallbackToMock(mapped)) throw mapped
    console.warn('[studyService] getScenario API 실패 — mock 사용', mapped)
    return getScenarioMock(scenarioId)
  }
}

/**
 * 시나리오 응시 제출·채점 (목업)
 * @param {{ scenarioId: number, mainChapterId: number, answers: ScenarioAnswerItem[] }} payload
 * @returns {Promise<{ data: ScenarioAttemptResult }>}
 */
const submitScenarioAttemptMock = async (payload) => {
  await delay(120)
  const { scenarioId, mainChapterId, answers } = payload
  if (!scenarioId || !mainChapterId || !answers?.length) {
    throw new StudyApiError('INVALID_ATTEMPT', '제출 데이터가 올바르지 않다.', 400)
  }

  const scenario = MOCK_SCENARIOS[scenarioId]
  if (!scenario) {
    throw new StudyApiError('SCENARIO_NOT_FOUND', '시나리오를 찾을 수 없다.', 404)
  }

  const stepMap = new Map(scenario.content.steps.map((step) => [step.stepId, step]))
  const gradedAnswers = []
  const wrongAnswers = []
  let correctCount = 0

  for (const answer of answers) {
    const step = stepMap.get(answer.stepId)
    if (!step) {
      throw new StudyApiError('STEP_NOT_FOUND', `스텝 ${answer.stepId}를 찾을 수 없다.`, 404)
    }
    const isCorrect = answer.selectedKey === step.correctKey
    if (isCorrect) correctCount += 1
    else {
      wrongAnswers.push({
        stepId: answer.stepId,
        selectedKey: answer.selectedKey,
        correctKey: step.correctKey,
      })
    }
    gradedAnswers.push({
      stepId: answer.stepId,
      selectedKey: answer.selectedKey,
      isCorrect,
    })
  }

  const totalCount = answers.length
  const quizScore = totalCount ? Math.round((correctCount / totalCount) * 100) : 0
  let pointsGranted = correctCount * POINTS_PER_CORRECT
  if (!ALLOW_DUPLICATE_POINT_GRANT && MOCK_SCENARIO_POINT_GRANTED.has(scenarioId)) {
    pointsGranted = 0
  } else if (pointsGranted > 0) {
    MOCK_SCENARIO_POINT_GRANTED.add(scenarioId)
  }

  const game = MOCK_CHAPTER_GAMES.get(Number(mainChapterId))
  if (game) {
    const summary = game.scenarios.find((s) => s.scenarioId === scenarioId)
    if (summary) summary.completed = true
  }

  const progressItem = MOCK_LEARNING_PROGRESS.find(
    (item) => item.mainChapterId === mainChapterId && item.entryType === 'SCENARIO_QUIZ',
  )
  if (progressItem) {
    progressItem.status = 'COMPLETED'
    progressItem.quizScore = quizScore
    progressItem.completedAt = progressItem.completedAt ?? new Date().toISOString()
    progressItem.updatedAt = new Date().toISOString()
  }

  promoteNextCurriculumChapter(mainChapterId)
  recomputeContinuePosition()

  return {
    data: {
      scenarioId,
      mainChapterId,
      totalCount,
      correctCount,
      quizScore,
      rewardStar: scenario.rewardStar,
      pointsGranted,
      wrongAnswers,
      gradedAnswers,
    },
  }
}

/**
 * POST /scenarios/{id}/attempts
 * @param {{ scenarioId: number, mainChapterId: number, answers: ScenarioAnswerItem[] }} payload
 * @returns {Promise<{ data: ScenarioAttemptResult }>}
 */
export const submitScenarioAttempt = async (payload) => {
  try {
    const raw = unwrapData(
      await submitScenarioAttemptApi(payload.scenarioId, {
        main_chapter_id: payload.mainChapterId,
        answers: (payload.answers ?? []).map((answer) => ({
          step_id: answer.stepId,
          selected_key: answer.selectedKey,
        })),
      }),
    )
    return { data: raw }
  } catch (error) {
    const mapped = mapStudyError(error, 'INVALID_ATTEMPT', '시나리오 제출에 실패했다.')
    if (!shouldFallbackToMock(mapped)) throw mapped
    console.warn('[studyService] submitScenarioAttempt API 실패 — mock 사용', mapped)
    return submitScenarioAttemptMock(payload)
  }
}

/**
 * 마지막 미완료 학습 위치 조회 (목업) — StudyNote「이어서 →」
 * @returns {Promise<{ data: ContinuePosition }>}
 */
const getContinuePositionMock = async () => {
  await delay()
  recomputeContinuePosition()
  if (!MOCK_CONTINUE_POSITION?.data) {
    throw new StudyApiError('CONTINUE_POSITION_NOT_FOUND', '이어갈 미완료 학습이 없다.', 404)
  }
  return { data: mapContinuePosition(structuredClone(MOCK_CONTINUE_POSITION.data)) }
}

/**
 * GET /learning/continue
 * @returns {Promise<{ data: ContinuePosition }>}
 */
export const getContinuePosition = async () => {
  try {
    const raw = unwrapData(await getContinuePositionApi())
    if (!raw) {
      throw new StudyApiError('CONTINUE_POSITION_NOT_FOUND', '이어갈 미완료 학습이 없다.', 404)
    }
    return { data: mapContinuePosition(raw) }
  } catch (error) {
    const mapped = mapStudyError(error, 'CONTINUE_POSITION_NOT_FOUND', '이어갈 미완료 학습이 없다.')
    if (!shouldFallbackToMock(mapped)) throw mapped
    console.warn('[studyService] getContinuePosition API 실패 — mock 사용', mapped)
    return getContinuePositionMock()
  }
}
