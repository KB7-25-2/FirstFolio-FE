import { ALLOW_DUPLICATE_POINT_GRANT, POINTS_PER_CORRECT } from '@/constants/quizPolicy.js'
import { setGrantedSimulationCash } from '@/utils/foundationGrant.js'
import { getUserCurriculum } from '@/api/user/curriculumApi.js'
import { parseApiError } from '@/api/user/errorHandler.js'
import {
  getContinuePosition as getContinuePositionApi,
  getRoadmap as getRoadmapApi,
  getSubChapters as getSubChaptersApi,
  getSubChapterLesson as getSubChapterLessonApi,
  getSubChapterProgress as getSubChapterProgressApi,
  putSubChapterProgress as putSubChapterProgressApi,
} from '@/api/user/studyApi.js'
import {
  gradeQuizAnswer as gradeQuizAnswerApi,
  startMainChapterQuizAttempt as startMainChapterQuizAttemptApi,
  startSubChapterQuizAttempt as startSubChapterQuizAttemptApi,
} from '@/api/user/quizApi.js'
import { withScheduleStatus } from '@/utils/scheduleStatus.js'

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
 */

const delay = (ms = 150) => new Promise((resolve) => setTimeout(resolve, ms))

const unwrap = (response) => response?.data?.data ?? response?.data

const pickField = (obj, ...keys) => {
  if (!obj || typeof obj !== 'object') return undefined
  for (const key of keys) {
    if (obj[key] !== undefined && obj[key] !== null) return obj[key]
  }
  return undefined
}

const shouldFallbackStudyMock = (error) => {
  if (!import.meta.env.DEV) return false
  const code = error?.code
  if (
    code === 'CONTINUE_POSITION_NOT_FOUND' ||
    code === 'SUB_CHAPTER_NOT_FOUND' ||
    code === 'CONTENT_NOT_PUBLISHED' ||
    code === 'PREREQUISITE_REQUIRED' ||
    code === 'QUIZ_NOT_AVAILABLE' ||
    code === 'SUB_CHAPTERS_INCOMPLETE' ||
    code === 'CONTENT_VERSION_MISMATCH' ||
    code === 'INVALID_PAGE_ID' ||
    code === 'CONTENT_UNAVAILABLE'
  ) {
    return false
  }
  return true
}

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
 * @returns {CurriculumItem & { status: string }}
 */
const mapCurriculumItem = (item) => {
  const chapterTypeRaw = String(pickField(item, 'chapterType', 'chapter_type') ?? '')
  const chapterType = chapterTypeRaw === 'ASSET' ? 'CORE' : chapterTypeRaw
  const progressPercent = Number(pickField(item, 'progressPercent', 'progress_percent') ?? 0)
  const completedAt = pickField(item, 'completedAt', 'completed_at') ?? null
  const rawStatus = String(pickField(item, 'status') ?? '')

  /** @type {string} */
  let status
  if (rawStatus === 'REMOVED') {
    status = 'REMOVED'
  } else if (rawStatus === 'COMPLETED' || rawStatus === 'LOCKED') {
    status = rawStatus
  } else if (completedAt || progressPercent >= 100) {
    status = 'COMPLETED'
  } else {
    // API ACTIVE = 커리큘럼 포함. 학습 UI ACTIVE/LOCKED는 아래에서 정규화
    status = 'PENDING'
  }

  return {
    curriculumItemId: Number(pickField(item, 'curriculumItemId', 'curriculum_item_id')),
    mainChapterId: Number(pickField(item, 'mainChapterId', 'main_chapter_id')),
    title: String(pickField(item, 'title') ?? ''),
    chapterType,
    displayOrder: Number(pickField(item, 'displayOrder', 'display_order') ?? 0),
    status,
    completedAt,
    progressPercent,
  }
}

/**
 * 순차 학습용 status 정규화: 완료 → 첫 미완료 ACTIVE → 나머지 LOCKED
 * @param {Array<CurriculumItem & { status: string }>} items
 * @returns {CurriculumItem[]}
 */
const normalizeCurriculumStatuses = (items) => {
  const sorted = items
    .filter((item) => item.status !== 'REMOVED')
    .slice()
    .sort((a, b) => a.displayOrder - b.displayOrder)

  let activeAssigned = false
  return sorted.map((item) => {
    if (item.status === 'COMPLETED') return /** @type {CurriculumItem} */ (item)
    if (!activeAssigned) {
      activeAssigned = true
      return { ...item, status: 'ACTIVE' }
    }
    return { ...item, status: 'LOCKED' }
  })
}

/**
 * 확정된 개인 커리큘럼 + 대단원별 진행 상태 조회
 * GET /curriculum
 * @returns {Promise<{ data: { items: CurriculumItem[] } }>}
 * @throws {StudyApiError} CURRICULUM_NOT_FOUND
 */
export const getCurriculum = async () => {
  try {
    const raw = unwrap(await getUserCurriculum())
    const items = normalizeCurriculumStatuses((raw?.items ?? []).map(mapCurriculumItem))
    if (!items.length) {
      throw new StudyApiError('CURRICULUM_NOT_FOUND', '확정된 커리큘럼이 없다.', 404)
    }
    return { data: { items } }
  } catch (error) {
    const mapped =
      error instanceof StudyApiError
        ? error
        : (() => {
            const parsed = parseApiError(error)
            if (parsed.status === 404 || parsed.code === 'CURRICULUM_NOT_FOUND') {
              return new StudyApiError(
                'CURRICULUM_NOT_FOUND',
                parsed.message || '확정된 커리큘럼이 없다.',
                404,
              )
            }
            return new StudyApiError(
              parsed.code || 'CURRICULUM_FETCH_FAILED',
              parsed.message || '커리큘럼을 불러오지 못했다.',
              parsed.status || 500,
            )
          })()

    // 실제 미확정(404)은 mock으로 가리지 않음. 네트워크 등은 DEV mock 폴백.
    if (mapped.code === 'CURRICULUM_NOT_FOUND' || !shouldFallbackStudyMock(mapped)) {
      throw mapped
    }
    console.warn('[studyService] GET curriculum 실패 — mock으로 대체합니다.', mapped)
  }

  await delay()
  const items = normalizeCurriculumStatuses(
    structuredClone(MOCK_CURRICULUM_RESPONSE.data.items).map(mapCurriculumItem),
  )
  if (!items.length) {
    throw new StudyApiError('CURRICULUM_NOT_FOUND', '확정된 커리큘럼이 없다.', 404)
  }
  return { data: { items } }
}

/**
 * 로드맵 API 대단원 status → UI status
 * @param {string | undefined} rawStatus
 */
const mapRoadmapChapterStatus = (rawStatus) => {
  if (rawStatus === 'COMPLETED') return 'COMPLETED'
  if (rawStatus === 'LOCKED') return 'LOCKED'
  if (rawStatus === 'IN_PROGRESS' || rawStatus === 'ACTIVE') return 'ACTIVE'
  return 'LOCKED'
}

/**
 * @param {object} raw
 * @returns {CurriculumItem & { description?: string }}
 */
const mapRoadmapChapterItem = (raw) => {
  const chapterTypeRaw = String(pickField(raw, 'chapterType', 'chapter_type') ?? '')
  const chapterType = chapterTypeRaw === 'ASSET' ? 'CORE' : chapterTypeRaw

  return {
    curriculumItemId: Number(pickField(raw, 'curriculumItemId', 'curriculum_item_id')),
    mainChapterId: Number(pickField(raw, 'mainChapterId', 'main_chapter_id')),
    title: String(pickField(raw, 'title') ?? ''),
    description: String(pickField(raw, 'description') ?? ''),
    chapterType,
    displayOrder: Number(pickField(raw, 'displayOrder', 'display_order') ?? 0),
    status: mapRoadmapChapterStatus(pickField(raw, 'status')),
    completedAt: pickField(raw, 'completedAt', 'completed_at') ?? null,
    progressPercent: Number(pickField(raw, 'progressPercent', 'progress_percent') ?? 0),
  }
}

/**
 * @param {object} raw
 * @param {number} mainChapterId
 * @returns {LearningProgressItem & { scheduleStatus: import('@/types/study.js').ScheduleStatus, contentAvailable?: boolean }}
 */
const mapRoadmapSubChapter = (raw, mainChapterId) => {
  const order = Number(pickField(raw, 'displayOrder', 'display_order') ?? 0)
  const title = String(raw.title ?? '')
  const description = raw.description != null ? String(raw.description) : ''
  const subChapterId = Number(pickField(raw, 'subChapterId', 'sub_chapter_id'))
  const status = /** @type {LearningProgressStatus} */ (
    pickField(raw, 'progressStatus', 'progress_status') ?? 'NOT_STARTED'
  )
  const scheduleStatus = /** @type {import('@/types/study.js').ScheduleStatus} */ (
    pickField(raw, 'scheduleStatus', 'schedule_status') ?? 'LOCKED'
  )

  return {
    progressId: Number(pickField(raw, 'progressId', 'progress_id') ?? subChapterId),
    userId: 0,
    mainChapterId: Number(mainChapterId),
    subChapterId,
    contentVersionId:
      pickField(raw, 'progressContentVersionId', 'progress_content_version_id') ??
      pickField(raw, 'currentContentVersionId', 'current_content_version_id') ??
      null,
    lastPageId: pickField(raw, 'lastPageId', 'last_page_id') ?? null,
    status,
    startedAt: pickField(raw, 'startedAt', 'started_at') ?? null,
    completedAt: pickField(raw, 'completedAt', 'completed_at') ?? null,
    updatedAt: pickField(raw, 'updatedAt', 'updated_at') ?? '',
    order,
    title,
    shortLabel: title.slice(0, 8) || `${order}교시`,
    periodSubtitle: description || `${order}교시`,
    entryType: 'LESSON',
    quizScore: null,
    contentAvailable: Boolean(pickField(raw, 'contentAvailable', 'content_available') ?? true),
    scheduleStatus,
  }
}

/**
 * @param {CurriculumItem & { description?: string, accent?: string, icon?: string }} chapter
 * @param {Array<LearningProgressItem & { scheduleStatus?: import('@/types/study.js').ScheduleStatus }>} subChapters
 * @param {object | null | undefined} mainChapterQuiz
 */
export const buildRoadmapStage = (chapter, subChapters, mainChapterQuiz = null) => {
  let periods = subChapters
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((row) => ({
      ...row,
      entryType: row.entryType ?? 'LESSON',
      scheduleStatus: row.scheduleStatus ?? 'LOCKED',
    }))

  if (chapter.status === 'LOCKED') {
    periods = periods.map((row) => ({ ...row, scheduleStatus: 'LOCKED' }))
  }

  const lessonsDone =
    chapter.status !== 'LOCKED' &&
    periods.length > 0 &&
    periods.every((row) => row.status === 'COMPLETED')

  const quiz = mainChapterQuiz ?? {}
  const quizStatus = pickField(quiz, 'status')
  const scenarioReady =
    lessonsDone && Boolean(pickField(quiz, 'available')) && quizStatus !== 'COMPLETED'

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
    scenarioTitle: '대단원 실전 퀴즈',
    scenarioSubtitle: '배운 내용을 실전 상황에서 점검해요',
  }
}

/**
 * @param {CurriculumItem & { description?: string }} chapter
 * @param {LearningProgressItem[]} progressItems
 */
const buildRoadmapStageFromLegacyProgress = (chapter, progressItems) => {
  const withStatus = withScheduleStatus(progressItems)
  const periods = withStatus.filter((row) => row.entryType !== 'SCENARIO_QUIZ')
  const scenarioItem = withStatus.find((row) => row.entryType === 'SCENARIO_QUIZ') ?? null
  const lessonsDone =
    chapter.status !== 'LOCKED' &&
    periods.length > 0 &&
    periods.every((row) => row.status === 'COMPLETED')
  const mainChapterQuiz = {
    available: lessonsDone && Boolean(scenarioItem),
    status: scenarioItem?.status === 'COMPLETED' ? 'COMPLETED' : 'LOCKED',
  }
  return buildRoadmapStage(chapter, periods, mainChapterQuiz)
}

/**
 * 학습 로드맵 통합 조회
 * GET /learning/roadmap
 * @returns {Promise<{ data: { curriculumItems: CurriculumItem[], stages: ReturnType<typeof buildRoadmapStage>[] } }>}
 * @throws {StudyApiError} CURRICULUM_NOT_FOUND
 */
export const getLearningRoadmap = async () => {
  try {
    const raw = unwrap(await getRoadmapApi())
    const rawItems = raw?.items ?? []
    if (!rawItems.length) {
      throw new StudyApiError('CURRICULUM_NOT_FOUND', '확정된 커리큘럼이 없다.', 404)
    }

    const curriculumItems = rawItems.map(mapRoadmapChapterItem)
    const stages = rawItems.map((item) => {
      const chapter = mapRoadmapChapterItem(item)
      const subChapters = (item.sub_chapters ?? item.subChapters ?? []).map((row) =>
        mapRoadmapSubChapter(row, chapter.mainChapterId),
      )
      const mainChapterQuiz = item.main_chapter_quiz ?? item.mainChapterQuiz ?? null
      return buildRoadmapStage(chapter, subChapters, mainChapterQuiz)
    })

    return { data: { curriculumItems, stages } }
  } catch (error) {
    if (error instanceof StudyApiError) throw error
    const parsed = parseApiError(error)
    const mapped = new StudyApiError(
      parsed?.code || 'ROADMAP_FETCH_FAILED',
      parsed?.message || '학습 로드맵을 불러오지 못했습니다.',
      parsed?.status || 500,
    )
    if (mapped.status === 404 || mapped.code === 'CURRICULUM_NOT_FOUND') {
      throw new StudyApiError(
        'CURRICULUM_NOT_FOUND',
        mapped.message || '확정된 커리큘럼이 없다.',
        404,
      )
    }
    if (!shouldFallbackStudyMock(mapped)) throw mapped
    console.warn('[studyService] GET roadmap 실패 — mock으로 대체합니다.', mapped)
  }

  const { data: curriculumData } = await getCurriculum()
  const curriculumItems = curriculumData.items
  /** @type {ReturnType<typeof buildRoadmapStage>[]} */
  const stages = []

  for (const chapter of curriculumItems) {
    try {
      const { data } = await getLearningProgress(chapter.mainChapterId)
      stages.push(buildRoadmapStageFromLegacyProgress(chapter, data.items ?? []))
    } catch {
      stages.push(buildRoadmapStage(chapter, [], null))
    }
  }

  return { data: { curriculumItems, stages } }
}

/**
 * GET /learning/sub-chapters/{id}/progress 응답 매핑
 * @param {object} raw
 */
const mapSubChapterProgress = (raw) => ({
  subChapterId: Number(pickField(raw, 'subChapterId', 'sub_chapter_id')),
  contentVersionId: pickField(raw, 'contentVersionId', 'content_version_id') ?? null,
  lastPageId: pickField(raw, 'lastPageId', 'last_page_id') ?? null,
  status: /** @type {LearningProgressStatus} */ (pickField(raw, 'status') ?? 'NOT_STARTED'),
  startedAt: pickField(raw, 'startedAt', 'started_at') ?? null,
  completedAt: pickField(raw, 'completedAt', 'completed_at') ?? null,
  updated: pickField(raw, 'updated') ?? null,
})

/**
 * PUT /learning/sub-chapters/{id}/progress 요청 status 정규화
 * @param {LearningProgressStatus | undefined} status
 */
const normalizePutProgressStatus = (status) => {
  if (status === 'COMPLETED') return 'COMPLETED'
  return 'IN_PROGRESS'
}

/**
 * @param {number} subChapterId
 * @param {number | null | undefined} payloadVersionId
 */
const resolveContentVersionId = async (subChapterId, payloadVersionId) => {
  if (payloadVersionId != null) return payloadVersionId
  try {
    const raw = unwrap(await getSubChapterProgressApi(subChapterId))
    return pickField(raw, 'contentVersionId', 'content_version_id') ?? null
  } catch {
    return MOCK_SUB_CHAPTER_CONTENT[subChapterId]?.content_version_id ?? null
  }
}

/**
 * @param {object} raw
 * @param {{ lastPageId: string | null, status: LearningProgressStatus }} fallback
 */
const mapSaveProgressResponse = (raw, fallback) => {
  const progress = mapSubChapterProgress(raw)
  return {
    subChapterId: progress.subChapterId,
    contentVersionId: progress.contentVersionId,
    lastPageId: progress.lastPageId ?? fallback.lastPageId,
    status: progress.status ?? fallback.status,
    startedAt: progress.startedAt,
    completedAt: progress.completedAt,
    updated: progress.updated ?? true,
  }
}

/**
 * GET /learning/main-chapters/{id}/sub-chapters → LearningProgressItem
 * @param {object} raw
 * @param {number} mainChapterId
 * @param {number} index
 * @returns {LearningProgressItem & { contentAvailable?: boolean, description?: string }}
 */
const mapSubChapterListItem = (raw, mainChapterId, index) => {
  const order = Number(pickField(raw, 'displayOrder', 'display_order') ?? index + 1)
  const title = String(raw.title ?? '')
  const description = raw.description != null ? String(raw.description) : ''
  const subChapterId = Number(pickField(raw, 'subChapterId', 'sub_chapter_id'))
  const contentAvailable = Boolean(pickField(raw, 'contentAvailable', 'content_available') ?? true)

  return {
    progressId: subChapterId,
    userId: 0,
    mainChapterId: Number(mainChapterId),
    subChapterId,
    contentVersionId: null,
    lastPageId: null,
    status: 'NOT_STARTED',
    startedAt: null,
    completedAt: null,
    updatedAt: '',
    order,
    title,
    shortLabel: title.slice(0, 8) || `${order}교시`,
    periodSubtitle: description || `${order}교시`,
    entryType: 'LESSON',
    quizScore: null,
    contentAvailable,
    description,
  }
}

/**
 * @param {LearningProgressItem & { contentAvailable?: boolean, description?: string }} item
 * @param {object | null} progressRaw
 */
const mergeProgressIntoItem = (item, progressRaw) => {
  if (!progressRaw) return item
  const progress = mapSubChapterProgress(progressRaw)
  return {
    ...item,
    contentVersionId: progress.contentVersionId,
    lastPageId: progress.lastPageId,
    status: progress.status,
    startedAt: progress.startedAt,
    completedAt: progress.completedAt,
    updatedAt: progress.completedAt ?? progress.startedAt ?? item.updatedAt,
  }
}

/**
 * 대단원 소단원 목록 + 각 소단원 진도 조회
 * GET /learning/main-chapters/{mainChapterId}/sub-chapters
 * GET /learning/sub-chapters/{subChapterId}/progress
 * @param {number} mainChapterId
 * @returns {Promise<{ data: { items: LearningProgressItem[] } }>}
 * @throws {StudyApiError} MAIN_CHAPTER_NOT_FOUND
 */
export const getLearningProgress = async (mainChapterId) => {
  try {
    const raw = unwrap(await getSubChaptersApi(mainChapterId))
    const baseItems = (raw?.items ?? [])
      .map((item, index) => mapSubChapterListItem(item, mainChapterId, index))
      .sort((a, b) => a.order - b.order)

    const items = await Promise.all(
      baseItems.map(async (item) => {
        if (!item.subChapterId) return item
        try {
          const progressRaw = unwrap(await getSubChapterProgressApi(item.subChapterId))
          return mergeProgressIntoItem(item, progressRaw)
        } catch {
          return item
        }
      }),
    )

    return { data: { items } }
  } catch (error) {
    if (error instanceof StudyApiError) throw error
    const parsed = parseApiError(error)
    const mapped = new StudyApiError(
      parsed?.code || 'SUB_CHAPTER_LIST_FAILED',
      parsed?.message || '소단원 목록을 불러오지 못했습니다.',
      parsed?.status || 500,
    )
    if (mapped.status === 404 || mapped.code === 'MAIN_CHAPTER_NOT_FOUND') {
      throw new StudyApiError(
        'MAIN_CHAPTER_NOT_FOUND',
        mapped.message || '대단원을 찾을 수 없습니다.',
        404,
      )
    }
    if (!shouldFallbackStudyMock(mapped)) throw mapped
    console.warn('[studyService] GET sub-chapters 실패 — mock으로 대체합니다.', mapped)
  }

  await delay()
  const items = MOCK_LEARNING_PROGRESS.filter((item) => item.mainChapterId === mainChapterId)
  return { data: { items: structuredClone(items) } }
}

/**
 * @param {object} raw
 * @returns {SubChapterContent}
 */
const mapSubChapterContent = (raw, progressRaw = null) => {
  const progress = progressRaw ?? raw.progress ?? {}
  const lesson = raw.lesson ?? null
  return {
    subChapterId: pickField(raw, 'subChapterId', 'sub_chapter_id'),
    mainChapterId: pickField(raw, 'mainChapterId', 'main_chapter_id'),
    title: raw.title,
    contentVersionId: pickField(raw, 'contentVersionId', 'content_version_id'),
    schemaVersion: pickField(raw, 'schemaVersion', 'schema_version'),
    contentUrl: pickField(raw, 'contentUrl', 'content_url') ?? null,
    expiresAt: pickField(raw, 'expiresAt', 'expires_at') ?? null,
    lesson,
    progress: {
      status: pickField(progress, 'status') ?? 'NOT_STARTED',
      lastPageId: pickField(progress, 'lastPageId', 'last_page_id') ?? null,
      completedAt: pickField(progress, 'completedAt', 'completed_at') ?? null,
    },
  }
}

/**
 * @param {object} raw
 * @returns {ContinuePosition}
 */
const mapContinuePosition = (raw) => ({
  curriculumItemId: pickField(raw, 'curriculumItemId', 'curriculum_item_id'),
  mainChapterId: pickField(raw, 'mainChapterId', 'main_chapter_id'),
  subChapterId: pickField(raw, 'subChapterId', 'sub_chapter_id'),
  contentVersionId: pickField(raw, 'contentVersionId', 'content_version_id'),
  lastPageId: pickField(raw, 'lastPageId', 'last_page_id'),
  progressPercent: pickField(raw, 'progressPercent', 'progress_percent'),
  route: raw.route,
})

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
 * 소단원 메타 + 공개 강좌 + 진도
 * OpenAPI: GET /learning/sub-chapters/{id} + GET …/progress
 * @param {number} subChapterId
 * @returns {Promise<{ data: SubChapterContent }>}
 */
export const getSubChapterContent = async (subChapterId) => {
  try {
    const [lessonRes, progressRes] = await Promise.all([
      getSubChapterLessonApi(subChapterId),
      getSubChapterProgressApi(subChapterId).catch(() => null),
    ])
    const lessonRaw = unwrap(lessonRes)
    const progressRaw = progressRes ? unwrap(progressRes) : null
    return { data: mapSubChapterContent(lessonRaw, progressRaw) }
  } catch (error) {
    const parsed = parseApiError(error)
    const mapped = new StudyApiError(
      parsed?.code ?? error?.code ?? 'SUB_CHAPTER_FETCH_FAILED',
      parsed?.message ?? error?.message ?? '소단원을 불러오지 못했습니다.',
      parsed?.status ?? error?.status ?? 500,
    )
    if (!shouldFallbackStudyMock(mapped)) throw mapped
    console.warn('[studyService] GET sub-chapter 실패 — mock으로 대체합니다.', mapped)
  }

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
 * 강좌 JSON 로드 — OpenAPI는 lesson을 콘텐츠 응답에 포함
 * @param {string | null | undefined} contentUrl
 * @param {import('@/types/study.js').SubChapterLessonJson | null} [embeddedLesson]
 * @returns {Promise<{ data: SubChapterLessonJson }>}
 */
export const getLessonPages = async (contentUrl, embeddedLesson = null) => {
  if (embeddedLesson && (embeddedLesson.pages || embeddedLesson.schemaVersion)) {
    return { data: structuredClone(embeddedLesson) }
  }
  if (embeddedLesson && typeof embeddedLesson === 'object') {
    // lesson 노드가 pages를 직접 감싸지 않고 루트일 수 있음
    if (Array.isArray(embeddedLesson.pages) || embeddedLesson.subChapterQuiz) {
      return { data: structuredClone(embeddedLesson) }
    }
  }

  await delay()
  const payload = contentUrl ? MOCK_LESSON_JSON_BY_URL[contentUrl] : null
  if (!payload) {
    throw new StudyApiError('CONTENT_NOT_FOUND', '학습 페이지를 찾을 수 없다.', 404)
  }
  return { data: structuredClone(payload) }
}

/**
 * 소단원 강좌 진도 저장
 * PUT /learning/sub-chapters/{subChapterId}/progress
 * @param {number} subChapterId
 * @param {{ lastPageId?: string | null, status?: LearningProgressStatus, contentVersionId?: number }} payload
 */
export const saveLessonProgress = async (subChapterId, payload) => {
  const lastPageId = payload.lastPageId ?? null
  const status = normalizePutProgressStatus(payload.status)

  try {
    const contentVersionId = await resolveContentVersionId(subChapterId, payload.contentVersionId)
    if (contentVersionId == null) {
      throw new StudyApiError(
        'CONTENT_NOT_PUBLISHED',
        '공개된 학습 콘텐츠 버전을 찾을 수 없습니다.',
        404,
      )
    }

    const response = await putSubChapterProgressApi(subChapterId, {
      contentVersionId,
      lastPageId,
      status,
    })
    const raw = unwrap(response)
    return {
      data: mapSaveProgressResponse(raw, { lastPageId, status }),
    }
  } catch (error) {
    if (error instanceof StudyApiError) throw error
    const parsed = parseApiError(error)
    const mapped = new StudyApiError(
      parsed?.code ?? 'PROGRESS_SAVE_FAILED',
      parsed?.message ?? '진도를 저장하지 못했습니다.',
      parsed?.status ?? 500,
    )
    if (!shouldFallbackStudyMock(mapped)) throw mapped
    console.warn('[studyService] PUT progress 실패 — mock으로 대체합니다.', mapped)
  }

  await delay(80)
  const raw = MOCK_SUB_CHAPTER_CONTENT[subChapterId]
  if (!raw) {
    throw new StudyApiError('SUB_CHAPTER_NOT_FOUND', '공개 소단원을 찾을 수 없다.', 404)
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
    data: mapSaveProgressResponse(
      {
        sub_chapter_id: subChapterId,
        content_version_id: raw.content_version_id,
        last_page_id: lastPageId,
        status,
        started_at: progressItem?.startedAt ?? null,
        completed_at: progressItem?.completedAt ?? null,
        updated: true,
      },
      { lastPageId, status },
    ),
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
 * OpenAPI QuizAttemptQuestionResponse → QuizQuestion (정답·해설 제외)
 * @param {object} raw
 * @returns {QuizQuestion}
 */
export const mapQuizAttemptQuestion = (raw) => ({
  questionId: pickField(raw, 'questionId', 'question_id'),
  questionKey: String(pickField(raw, 'questionId', 'question_id') ?? ''),
  questionType: pickField(raw, 'questionType', 'question_type'),
  generationType: pickField(raw, 'generationType', 'generation_type'),
  prompt: raw.prompt,
  scenarioJson: raw.scenario ?? null,
  optionsJson: (raw.choices ?? []).map((choice) => ({
    key: pickField(choice, 'key', 'id'),
    label: pickField(choice, 'label', 'text'),
  })),
  correctAnswerJson: null,
  explanation: null,
  status: 'PUBLISHED',
  displayOrder: pickField(raw, 'displayOrder', 'display_order'),
})

/**
 * @param {object} raw
 */
export const mapQuizAttemptStart = (raw) => ({
  attemptId: pickField(raw, 'attemptId', 'attempt_id'),
  quizType: pickField(raw, 'quizType', 'quiz_type'),
  mainChapterId: pickField(raw, 'mainChapterId', 'main_chapter_id'),
  subChapterId: pickField(raw, 'subChapterId', 'sub_chapter_id'),
  contentVersionId: pickField(raw, 'contentVersionId', 'content_version_id'),
  status: raw.status,
  questionCount: pickField(raw, 'questionCount', 'question_count'),
  questions: (raw.questions ?? []).map(mapQuizAttemptQuestion),
})

/**
 * @param {object} raw
 */
export const mapQuizAnswerGrading = (raw) => ({
  attemptId: pickField(raw, 'attemptId', 'attempt_id'),
  questionId: pickField(raw, 'questionId', 'question_id'),
  generationType: pickField(raw, 'generationType', 'generation_type'),
  selectedKey: pickField(raw, 'selectedKey', 'selected_key'),
  isCorrect: pickField(raw, 'isCorrect', 'is_correct'),
  correctAnswer: {
    key: pickField(raw.correctAnswer ?? raw.correct_answer ?? {}, 'key'),
  },
  explanation: raw.explanation ?? null,
  attempt: {
    status: raw.attempt?.status,
    answeredCount: pickField(raw.attempt ?? {}, 'answeredCount', 'answered_count'),
    totalCount: pickField(raw.attempt ?? {}, 'totalCount', 'total_count'),
    correctCount: pickField(raw.attempt ?? {}, 'correctCount', 'correct_count'),
    score: raw.attempt?.score ?? null,
    completed: raw.attempt?.completed ?? false,
  },
  reward: raw.reward
    ? {
        points: raw.reward.points ?? 0,
        pointTransactionId: pickField(raw.reward, 'pointTransactionId', 'point_transaction_id'),
      }
    : null,
  mainChapterCompleted: pickField(raw, 'mainChapterCompleted', 'main_chapter_completed'),
  nextAction: pickField(raw, 'nextAction', 'next_action'),
})

/**
 * 소단원 퀴즈 응시 시작 (OpenAPI)
 * @param {number} subChapterId
 */
export const startSubChapterQuizAttempt = async (subChapterId) => {
  try {
    const response = await startSubChapterQuizAttemptApi(subChapterId)
    return { data: mapQuizAttemptStart(unwrap(response)) }
  } catch (error) {
    const mapped = new StudyApiError(
      error?.code ?? parseApiError(error)?.code ?? 'QUIZ_START_FAILED',
      error?.message ?? '퀴즈를 시작하지 못했습니다.',
      error?.status ?? 500,
    )
    if (!shouldFallbackStudyMock(mapped)) throw mapped
    console.warn('[studyService] POST quiz-attempts 실패 — mock 문항으로 대체합니다.', mapped)
    return null
  }
}

/**
 * 대단원 퀴즈 응시 시작 (OpenAPI)
 * @param {number} mainChapterId
 */
export const startMainChapterQuizAttempt = async (mainChapterId) => {
  const response = await startMainChapterQuizAttemptApi(mainChapterId)
  return { data: mapQuizAttemptStart(unwrap(response)) }
}

/**
 * 퀴즈 문항 즉시 채점 (OpenAPI)
 * @param {number} attemptId
 * @param {number} questionId
 * @param {string} selectedKey
 */
export const gradeQuizAttemptAnswer = async (attemptId, questionId, selectedKey) => {
  const response = await gradeQuizAnswerApi(attemptId, questionId, {
    answer: { key: selectedKey },
  })
  return { data: mapQuizAnswerGrading(unwrap(response)) }
}

/**
 * 게시된 문항 행 조회 (목업) — 소단원 JSON questionIds 순서 유지
 * @param {number[]} questionIds
 * @returns {Promise<{ data: { items: QuizQuestion[] } }>}
 * @throws {StudyApiError} QUESTIONS_NOT_FOUND
 */
export const getQuizQuestions = async (questionIds) => {
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
 * 소단원 퀴즈 제출·채점 (목업)
 * @param {{ subChapterId: number, answers: QuizAnswerItem[] }} payload
 * @returns {Promise<{ data: QuizAttemptResult }>}
 */
export const submitQuizAttempt = async (payload) => {
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

/** @type {Map<number, ChapterGame>} mainChapterId → chapter game
 * unlocked는 시드 false — 전체 LESSON 수료 시 submitQuizAttempt / getChapterGame에서 해금
 */
const MOCK_CHAPTER_GAMES = new Map([
  [
    1,
    {
      chapterGameId: 40,
      mainChapterId: 1,
      title: '기초 실전 퀴즈',
      unlocked: false,
      scenarios: [
        {
          scenarioId: 401,
          title: '첫 모의 포트폴리오를 짜는 친구',
          completed: false,
        },
      ],
    },
  ],
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
  401: {
    scenarioId: 401,
    title: '첫 모의 포트폴리오를 짜는 친구',
    rewardStar: 30,
    content: {
      scenarioKey: 'foundation-first-portfolio',
      chapterTitle: '포트폴리오 기초',
      chapterSubtitle: '모의투자 전 필수 선행',
      opening: {
        documentTitle: '공 문 서',
        docNo: '제 2026-기초-001 호',
        docDate: '2026. 06. 01',
        orgName: '금융 상담 교육원',
        title: '포트폴리오 기초 실전 점검',
        mission:
          '친구가 모의투자금을 받아 첫 포트폴리오를 구성하려 합니다. 분산과 위험의 기본을 떠올리며 가장 알맞은 조언을 고르세요.',
        issuerLabel: '발행처',
        issuerName: '투자 상담 교육원장',
        startLabel: '게임 시작',
      },
      conditions: {
        persona: {
          name: '펭귄',
          age: '17세',
          job: '고등학생',
          monthlyIncome: '용돈 5만원',
          monthlySaving: '2만원',
        },
        requirements: {
          assets: '모의투자금 3천만원(가상)',
          risk: '중위험 이하 선호',
          goal: '첫 분산 포트폴리오 구성',
        },
        marketTitle: '기초 점검 시황',
        marketDate: '2026. 06. 01',
        marketBullets: [
          '한 자산에만 몰빵하면 위험이 커져요',
          '현금·예금·주식·펀드를 나눠 담아보세요',
        ],
        constraints: ['교육용 모의투자이며 실제 거래가 아닙니다'],
      },
      steps: [
        {
          stepId: 4011,
          order: 1,
          paperTitle: '첫 포트폴리오 조언',
          prompt: '친구가 “주식만 사면 빨리 부자 되지 않아?”라고 물었습니다. 가장 알맞은 대답은?',
          options: [
            {
              key: 'A',
              label: '한 자산에만 몰아넣는 게 최고야',
              description: '수익만 보고 위험을 무시하는 조언',
            },
            {
              key: 'B',
              label: '분산해서 위험을 나눠 담아보자',
              description: '포트폴리오 기초의 핵심',
            },
            {
              key: 'C',
              label: '현금만 들고 있으면 돼',
              description: '기회 비용을 전혀 고려하지 않음',
            },
          ],
          correctKey: 'B',
          explanation: '분산 투자는 위험을 한곳에 몰지 않고 자산 역할을 나누는 기본 원칙입니다.',
        },
      ],
    },
  },
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
export const getChapterGame = async (mainChapterId) => {
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
 * 시나리오 상세 조회 (목업)
 * @param {number} scenarioId
 * @returns {Promise<{ data: ScenarioDetail }>}
 */
export const getScenario = async (scenarioId) => {
  await delay()
  const row = MOCK_SCENARIOS[Number(scenarioId)]
  if (!row) {
    throw new StudyApiError('SCENARIO_NOT_FOUND', '시나리오를 찾을 수 없다.', 404)
  }
  return { data: structuredClone(row) }
}

/**
 * 시나리오 응시 제출·채점 (목업)
 * @param {{ scenarioId: number, mainChapterId: number, answers: ScenarioAnswerItem[] }} payload
 * @returns {Promise<{ data: ScenarioAttemptResult }>}
 */
export const submitScenarioAttempt = async (payload) => {
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
 * 마지막 미완료 학습 위치 조회 (목업) — StudyNote「이어서 →」
 * @returns {Promise<{ data: ContinuePosition }>}
 */
export const getContinuePosition = async () => {
  try {
    const response = await getContinuePositionApi()
    return { data: mapContinuePosition(unwrap(response)) }
  } catch (error) {
    const parsed = parseApiError(error)
    const mapped = new StudyApiError(
      parsed?.code ?? error?.code ?? 'CONTINUE_FETCH_FAILED',
      parsed?.message ?? error?.message ?? '이어하기 위치를 불러오지 못했습니다.',
      parsed?.status ?? error?.status ?? 500,
    )
    if (mapped.code === 'CONTINUE_POSITION_NOT_FOUND') throw mapped
    if (!shouldFallbackStudyMock(mapped)) throw mapped
    console.warn('[studyService] GET continue 실패 — mock으로 대체합니다.', mapped)
  }

  await delay()
  recomputeContinuePosition()
  if (!MOCK_CONTINUE_POSITION?.data) {
    throw new StudyApiError('CONTINUE_POSITION_NOT_FOUND', '이어갈 미완료 학습이 없다.', 404)
  }
  return { data: mapContinuePosition(structuredClone(MOCK_CONTINUE_POSITION.data)) }
}

/** @typedef {'mid-curriculum' | 'foundation-pending'} MockLearningProfile */

/** 기본 시드 스냅샷 (기초 수료 · 예·적금 진행 중) */
const MID_CURRICULUM_SNAPSHOT = {
  curriculumItems: structuredClone(MOCK_CURRICULUM_RESPONSE.data.items),
  learningProgress: structuredClone(MOCK_LEARNING_PROGRESS),
}

/** @type {MockLearningProfile} */
let mockLearningProfile = 'mid-curriculum'

const applyMidCurriculumProfile = () => {
  MOCK_CURRICULUM_RESPONSE.data.items = structuredClone(MID_CURRICULUM_SNAPSHOT.curriculumItems)
  MOCK_LEARNING_PROGRESS.length = 0
  MOCK_LEARNING_PROGRESS.push(...structuredClone(MID_CURRICULUM_SNAPSHOT.learningProgress))
  recomputeContinuePosition()
}

const applyFoundationPendingProfile = () => {
  for (const item of MOCK_CURRICULUM_RESPONSE.data.items) {
    if (item.chapter_type === 'FOUNDATION') {
      item.status = 'ACTIVE'
      item.completed_at = null
      item.progress_percent = 0
    } else {
      item.status = 'LOCKED'
      item.completed_at = null
      item.progress_percent = 0
    }
  }

  for (const row of MOCK_LEARNING_PROGRESS) {
    row.status = 'NOT_STARTED'
    row.startedAt = null
    row.completedAt = null
    row.lastPageId = null
    row.quizScore = null
    row.updatedAt = '2026-06-01T00:00:00'
  }

  for (const game of MOCK_CHAPTER_GAMES.values()) {
    game.unlocked = false
    for (const scenario of game.scenarios) {
      scenario.completed = false
    }
  }

  setGrantedSimulationCash(false)
  recomputeContinuePosition()
}

/**
 * 학습 mock 진도 프로필 전환 (테스트·가이드 연동용)
 * @param {MockLearningProfile} profile
 */
export const __setMockLearningProfile = (profile) => {
  if (profile !== 'mid-curriculum' && profile !== 'foundation-pending') {
    throw new Error(`Unknown mock learning profile: ${profile}`)
  }
  mockLearningProfile = profile
  try {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('mock_learning_profile', profile)
    }
  } catch {
    /* ignore */
  }
  if (profile === 'foundation-pending') {
    applyFoundationPendingProfile()
    return
  }
  applyMidCurriculumProfile()
}

/** @returns {MockLearningProfile} */
export const __getMockLearningProfile = () => mockLearningProfile

const resolveInitialMockLearningProfile = () => {
  try {
    if (typeof sessionStorage !== 'undefined') {
      const stored = sessionStorage.getItem('mock_learning_profile')
      if (stored === 'mid-curriculum' || stored === 'foundation-pending') return stored
    }
  } catch {
    /* ignore */
  }
  return 'mid-curriculum'
}

__setMockLearningProfile(resolveInitialMockLearningProfile())

if (typeof window !== 'undefined') {
  window.__setMockLearningProfile = __setMockLearningProfile
  window.__getMockLearningProfile = __getMockLearningProfile
}
