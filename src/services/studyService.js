import { ALLOW_DUPLICATE_POINT_GRANT, POINTS_PER_CORRECT } from '@/constants/quizPolicy.js'

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

/** @type {LearningProgressItem[]} */
const MOCK_LEARNING_PROGRESS = [
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
]

/** 선행 미충족으로 콘텐츠 조회가 막히는 소단원 ID */
const MOCK_PREREQUISITE_BLOCKED = new Set([105])

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

/** 이어하기 목업 — ACTIVE 대단원(예·적금) */
const MOCK_CONTINUE_POSITION = {
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
 * @param {object} item
 * @returns {CurriculumItem}
 */
const mapCurriculumItem = (item) => ({
  curriculumItemId: item.curriculum_item_id,
  mainChapterId: item.main_chapter_id,
  title: item.title,
  chapterType: item.chapter_type,
  displayOrder: item.display_order,
  status: item.status,
  completedAt: item.completed_at,
  progressPercent: item.progress_percent,
})

/**
 * @param {object} raw
 * @returns {SubChapterContent}
 */
const mapSubChapterContent = (raw) => ({
  subChapterId: raw.sub_chapter_id,
  mainChapterId: raw.main_chapter_id,
  title: raw.title,
  contentVersionId: raw.content_version_id,
  schemaVersion: raw.schema_version,
  contentUrl: raw.content_url,
  expiresAt: raw.expires_at,
  progress: {
    status: raw.progress.status,
    lastPageId: raw.progress.last_page_id,
    completedAt: raw.progress.completed_at,
  },
})

/**
 * @param {object} raw
 * @returns {ContinuePosition}
 */
const mapContinuePosition = (raw) => ({
  curriculumItemId: raw.curriculum_item_id,
  mainChapterId: raw.main_chapter_id,
  subChapterId: raw.sub_chapter_id,
  contentVersionId: raw.content_version_id,
  lastPageId: raw.last_page_id,
  progressPercent: raw.progress_percent,
  route: raw.route,
})

/**
 * 확정된 개인 커리큘럼 + 대단원별 진행 상태 조회 (목업)
 * @returns {Promise<{ data: { items: CurriculumItem[] } }>}
 * @throws {StudyApiError} CURRICULUM_NOT_FOUND
 */
export const getCurriculum = async () => {
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
 * 대단원 소단원 학습 진행 목록 (목업 — 목록 API 확정 전)
 * @param {number} mainChapterId
 * @returns {Promise<{ data: { items: LearningProgressItem[] } }>}
 */
export const getLearningProgress = async (mainChapterId) => {
  await delay()
  const items = MOCK_LEARNING_PROGRESS.filter((item) => item.mainChapterId === mainChapterId)
  return { data: { items: structuredClone(items) } }
}

/**
 * 소단원 메타 + 백엔드 발급 콘텐츠 접근 정보 조회 (목업)
 * - 클라이언트는 content_url만 사용하고 S3 경로를 조합하지 않는다.
 * - 완료한 소단원도 재열람 가능하다.
 * @param {number} subChapterId
 * @returns {Promise<{ data: SubChapterContent }>}
 * @throws {StudyApiError} SUB_CHAPTER_NOT_FOUND | PREREQUISITE_REQUIRED
 */
export const getSubChapterContent = async (subChapterId) => {
  await delay()
  if (MOCK_PREREQUISITE_BLOCKED.has(subChapterId)) {
    throw new StudyApiError('PREREQUISITE_REQUIRED', '선행 학습이 필요하다.', 403)
  }
  const raw = MOCK_SUB_CHAPTER_CONTENT[subChapterId]
  if (!raw) {
    throw new StudyApiError('SUB_CHAPTER_NOT_FOUND', '공개 소단원을 찾을 수 없다.', 404)
  }
  return { data: mapSubChapterContent(structuredClone(raw)) }
}

/**
 * 백엔드가 발급한 contentUrl로 소단원 강좌 JSON 로드 (목업)
 * @param {string} contentUrl
 * @returns {Promise<{ data: SubChapterLessonJson }>}
 * @throws {StudyApiError} CONTENT_NOT_FOUND
 */
export const getLessonPages = async (contentUrl) => {
  await delay()
  const payload = MOCK_LESSON_JSON_BY_URL[contentUrl]
  if (!payload) {
    throw new StudyApiError('CONTENT_NOT_FOUND', '학습 페이지를 찾을 수 없다.', 404)
  }
  return { data: structuredClone(payload) }
}

/**
 * 소단원 강좌 진도 저장 (목업) — lastPageId / status
 * @param {number} subChapterId
 * @param {{ lastPageId: string, status?: LearningProgressStatus }} payload
 * @returns {Promise<{ data: { lastPageId: string, status: LearningProgressStatus } }>}
 * @throws {StudyApiError} SUB_CHAPTER_NOT_FOUND
 */
export const saveLessonProgress = async (subChapterId, payload) => {
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
  }

  if (MOCK_CONTINUE_POSITION.data?.sub_chapter_id === subChapterId) {
    MOCK_CONTINUE_POSITION.data.last_page_id = lastPageId
    MOCK_CONTINUE_POSITION.data.route = `/learning/sub-chapters/${subChapterId}?page=${lastPageId}`
  }

  return {
    data: {
      lastPageId,
      status,
    },
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
 * 마지막 미완료 학습 위치 조회 (목업) — StudyNote「이어서 →」
 * @returns {Promise<{ data: ContinuePosition }>}
 */
export const getContinuePosition = async () => {
  await delay()
  if (!MOCK_CONTINUE_POSITION?.data) {
    throw new StudyApiError('CONTINUE_POSITION_NOT_FOUND', '이어갈 미완료 학습이 없다.', 404)
  }
  return { data: mapContinuePosition(structuredClone(MOCK_CONTINUE_POSITION.data)) }
}
