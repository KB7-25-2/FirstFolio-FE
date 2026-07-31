/**
 * @typedef {import('@/types/study.js').CurriculumItem} CurriculumItem
 * @typedef {import('@/types/study.js').LearningProgressItem} LearningProgressItem
 * @typedef {import('@/types/study.js').SubChapterContent} SubChapterContent
 * @typedef {import('@/types/study.js').ContinuePosition} ContinuePosition
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

/** API 원본 형태 목업 (snake_case) — PROJECT_SPEC: 기초 + 예·적금/채권/주식/펀드 */
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
        description: '모의투자 전에 꼭 알아야 할 포트폴리오의 기초',
        sub_chapter_count: 5,
        accent: 'cream',
        icon: '📋',
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
        description: '안전한 자산관리의 시작',
        sub_chapter_count: 6,
        accent: 'yellow',
        icon: '🏦',
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
        description: '안정적인 수익을 위한 채권 이해',
        sub_chapter_count: 5,
        accent: 'mint',
        icon: '📜',
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
        description: '기업과 시장을 읽는 투자 기초',
        sub_chapter_count: 6,
        accent: 'blue',
        icon: '📈',
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
        description: '분산투자로 시작하는 자산관리',
        sub_chapter_count: 5,
        accent: 'purple',
        icon: '💼',
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
    title: '예금과 적금의 이해',
    shortLabel: '예금·적금',
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
    title: '금리와 복리의 원리',
    shortLabel: '금리·복리',
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
    title: '예금자 보호 제도',
    shortLabel: '예금자보호',
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
    title: '투자 상품의 기초',
    shortLabel: '투자기초',
    quizScore: null,
  },
]

/** 소단원 콘텐츠 목업 (snake_case) — sub_chapter_id 키 */
const MOCK_SUB_CHAPTER_CONTENT = {
  101: {
    sub_chapter_id: 101,
    title: '예금과 적금의 이해',
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
    title: '금리와 복리의 원리',
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
    title: '예금자 보호 제도',
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
    title: '투자 상품의 기초',
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
}

/** 이어하기 목업 (snake_case) — ACTIVE 대단원(예·적금)의 IN_PROGRESS 소단원 */
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
  description: item.description ?? '',
  subChapterCount: item.sub_chapter_count ?? 0,
  accent: item.accent ?? 'cream',
  icon: item.icon ?? '',
})

/**
 * @param {object} raw
 * @returns {SubChapterContent}
 */
const mapSubChapterContent = (raw) => ({
  subChapterId: raw.sub_chapter_id,
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
 */
export const getCurriculum = async () => {
  await delay()
  const raw = structuredClone(MOCK_CURRICULUM_RESPONSE)
  return {
    data: {
      items: raw.data.items.map(mapCurriculumItem),
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
 * 소단원 메타 + 학습 콘텐츠 접근 정보 조회 (목업)
 * @param {number} subChapterId
 * @returns {Promise<{ data: SubChapterContent }>}
 */
export const getSubChapterContent = async (subChapterId) => {
  await delay()
  const raw = MOCK_SUB_CHAPTER_CONTENT[subChapterId]
  if (!raw) {
    throw new StudyApiError('SUB_CHAPTER_NOT_FOUND', '공개 소단원을 찾을 수 없다.', 404)
  }
  return { data: mapSubChapterContent(structuredClone(raw)) }
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
