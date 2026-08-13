/**
 * 관리자 퀴즈 문항 서비스
 * — GET /admin/quiz-questions (usage_type, main/sub chapter, status, question_key, cursor)
 * — POST /admin/quiz-questions, POST …/{id}/versions
 * — 상태 전환: PATCH / publish (BE 미구현 시 로컬 캐시 폴백)
 */

import { parseApiError } from '@/api/user/errorHandler.js'
import {
  createAdminQuizQuestion,
  createAdminQuizQuestionVersion,
  getAdminQuizQuestions,
  patchAdminQuizQuestion,
  publishAdminQuizQuestion,
} from '@/api/admin/quizApi.js'
import { pickField, unwrapData } from '@/utils/apiMapper.js'

const CACHE_KEY = 'admin_quiz_questions_cache'

/**
 * @typedef {import('@/types/quiz.js').QuizQuestion} QuizQuestion
 * @typedef {import('@/types/quiz.js').QuizUsageType} QuizUsageType
 * @typedef {import('@/types/quiz.js').QuizQuestionType} QuizQuestionType
 * @typedef {import('@/types/quiz.js').QuizDifficulty} QuizDifficulty
 * @typedef {import('@/types/quiz.js').QuizQuestionStatus} QuizQuestionStatus
 * @typedef {import('@/types/quiz.js').QuizOption} QuizOption
 * @typedef {import('@/types/quiz.js').QuizScenarioJson} QuizScenarioJson
 */

/** @returns {QuizQuestion[]} */
const readCache = () => {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/** @param {QuizQuestion[]} items */
const writeCache = (items) => {
  localStorage.setItem(CACHE_KEY, JSON.stringify(items))
}

/** @param {QuizQuestion} question */
const upsertCache = (question) => {
  const items = readCache().filter((q) => q.questionId !== question.questionId)
  items.unshift(question)
  writeCache(items)
  return question
}

/** @param {unknown} raw @param {Partial<QuizQuestion>} [fallback] @returns {QuizQuestion} */
const mapQuestion = (raw, fallback = {}) => ({
  questionId: Number(pickField(raw, 'questionId', 'question_id') ?? fallback.questionId),
  questionKey: String(pickField(raw, 'questionKey', 'question_key') ?? fallback.questionKey ?? ''),
  versionNo: Number(pickField(raw, 'versionNo', 'version_no') ?? fallback.versionNo ?? 1),
  usageType: /** @type {QuizUsageType} */ (
    pickField(raw, 'usageType', 'usage_type') ?? fallback.usageType ?? 'SUB_CHAPTER'
  ),
  mainChapterId: (() => {
    const v = pickField(raw, 'mainChapterId', 'main_chapter_id')
    if (v == null) return fallback.mainChapterId ?? null
    return Number(v)
  })(),
  subChapterId: (() => {
    const v = pickField(raw, 'subChapterId', 'sub_chapter_id')
    if (v == null) return fallback.subChapterId ?? null
    return Number(v)
  })(),
  displayOrder: (() => {
    const v = pickField(raw, 'displayOrder', 'display_order')
    if (v == null) return fallback.displayOrder ?? null
    return Number(v)
  })(),
  questionType: /** @type {QuizQuestionType} */ (
    pickField(raw, 'questionType', 'question_type') ?? fallback.questionType ?? 'SINGLE_CHOICE'
  ),
  difficulty: pickField(raw, 'difficulty') ?? fallback.difficulty ?? null,
  prompt: String(pickField(raw, 'prompt') ?? fallback.prompt ?? ''),
  scenarioJson: pickField(raw, 'scenarioJson', 'scenario_json') ?? fallback.scenarioJson ?? null,
  optionsJson: /** @type {QuizOption[]} */ (
    pickField(raw, 'optionsJson', 'options_json') ?? fallback.optionsJson ?? []
  ),
  correctAnswerJson: pickField(raw, 'correctAnswerJson', 'correct_answer_json') ??
    fallback.correctAnswerJson ?? { key: '' },
  explanation: String(pickField(raw, 'explanation') ?? fallback.explanation ?? ''),
  generationType:
    pickField(raw, 'generationType', 'generation_type') ?? fallback.generationType ?? 'HUMAN',
  sourceRefsJson:
    pickField(raw, 'sourceRefsJson', 'source_refs_json') ?? fallback.sourceRefsJson ?? null,
  status: /** @type {QuizQuestionStatus} */ (
    pickField(raw, 'status') ?? fallback.status ?? 'DRAFT'
  ),
  createdBy: (() => {
    const v = pickField(raw, 'createdBy', 'created_by')
    return v == null ? (fallback.createdBy ?? null) : Number(v)
  })(),
  publishedAt: pickField(raw, 'publishedAt', 'published_at') ?? fallback.publishedAt ?? null,
  createdAt: pickField(raw, 'createdAt', 'created_at') ?? fallback.createdAt ?? null,
})

const listItems = (data) => {
  if (Array.isArray(data)) return data
  if (data && typeof data === 'object' && Array.isArray(data.items)) return data.items
  return []
}

/**
 * GET /admin/quiz-questions
 * @param {{
 *   usageType?: QuizUsageType | '',
 *   status?: QuizQuestionStatus | '',
 *   mainChapterId?: number | null,
 *   subChapterId?: number | null,
 *   questionKey?: string,
 *   cursor?: string | null,
 * }} [filters]
 * @returns {Promise<{ items: QuizQuestion[], nextCursor: string | null }>}
 */
export const fetchAdminQuizQuestions = async (filters = {}) => {
  const params = {}
  if (filters.usageType) params.usage_type = filters.usageType
  if (filters.status) params.status = filters.status
  if (filters.mainChapterId != null && filters.mainChapterId !== '') {
    params.main_chapter_id = Number(filters.mainChapterId)
  }
  if (filters.subChapterId != null && filters.subChapterId !== '') {
    params.sub_chapter_id = Number(filters.subChapterId)
  }
  if (filters.questionKey?.trim()) params.question_key = filters.questionKey.trim()
  if (filters.cursor) params.cursor = filters.cursor

  try {
    const raw = unwrapData(await getAdminQuizQuestions(params))
    const items = listItems(raw).map((item) => mapQuestion(item))
    const nextCursor = pickField(raw, 'nextCursor', 'next_cursor') ?? null

    if (items.length) {
      const byId = new Map(readCache().map((q) => [q.questionId, q]))
      for (const q of items) {
        byId.set(q.questionId, { ...(byId.get(q.questionId) ?? {}), ...q })
      }
      writeCache([...byId.values()])
    }

    return {
      items,
      nextCursor: nextCursor == null || nextCursor === '' ? null : String(nextCursor),
    }
  } catch (error) {
    const parsed = parseApiError(error)
    // 일시적 미구현·권한 외 — 작성 직후 캐시로 폴백
    if (parsed.status === 404 || parsed.status === 405 || parsed.code === 'METHOD_NOT_ALLOWED') {
      let items = readCache()
      if (filters.usageType) items = items.filter((q) => q.usageType === filters.usageType)
      if (filters.status) items = items.filter((q) => q.status === filters.status)
      if (filters.mainChapterId != null && filters.mainChapterId !== '') {
        items = items.filter((q) => q.mainChapterId === Number(filters.mainChapterId))
      }
      if (filters.subChapterId != null && filters.subChapterId !== '') {
        items = items.filter((q) => q.subChapterId === Number(filters.subChapterId))
      }
      if (filters.questionKey?.trim()) {
        const key = filters.questionKey.trim()
        items = items.filter((q) => q.questionKey.includes(key))
      }
      return {
        items: items.sort((a, b) => Number(b.questionId) - Number(a.questionId)),
        nextCursor: null,
      }
    }
    throw parsed
  }
}

/**
 * @param {{
 *   questionKey: string,
 *   usageType: QuizUsageType,
 *   mainChapterId?: number | null,
 *   subChapterId?: number | null,
 *   questionType: QuizQuestionType,
 *   difficulty?: QuizDifficulty | null,
 *   prompt: string,
 *   scenarioJson?: QuizScenarioJson | null,
 *   optionsJson: QuizOption[],
 *   correctAnswerJson: { key: string },
 *   explanation: string,
 *   generationType?: 'HUMAN' | 'AI',
 *   sourceRefsJson?: unknown,
 * }} payload
 * @returns {Promise<QuizQuestion>}
 */
export const createQuizQuestion = async (payload) => {
  validateQuestionPayload(payload)

  /** JSON_SCHEMA / 관리자 API — snake_case */
  const body = {
    question_key: payload.questionKey.trim(),
    usage_type: payload.usageType,
    question_type: payload.questionType,
    prompt: payload.prompt.trim(),
    options_json: payload.optionsJson,
    correct_answer_json: { key: String(payload.correctAnswerJson.key) },
    explanation: payload.explanation.trim(),
    generation_type: payload.generationType ?? 'HUMAN',
  }

  if (payload.difficulty) body.difficulty = payload.difficulty
  if (payload.mainChapterId != null) body.main_chapter_id = Number(payload.mainChapterId)
  if (payload.subChapterId != null) body.sub_chapter_id = Number(payload.subChapterId)
  if (payload.questionType === 'SCENARIO') {
    body.scenario_json = payload.scenarioJson ?? null
  } else {
    body.scenario_json = null
  }
  if (payload.sourceRefsJson != null) body.source_refs_json = payload.sourceRefsJson

  try {
    const raw = unwrapData(await createAdminQuizQuestion(body))
    const question = mapQuestion(raw, {
      ...payload,
      status: 'DRAFT',
      versionNo: 1,
      createdAt: new Date().toISOString(),
    })
    return upsertCache(question)
  } catch (error) {
    throw parseApiError(error)
  }
}

/**
 * @param {number} questionId
 * @param {{
 *   prompt: string,
 *   scenarioJson?: QuizScenarioJson | null,
 *   optionsJson: QuizOption[],
 *   correctAnswerJson: { key: string },
 *   explanation: string,
 *   sourceRefsJson?: unknown,
 *   questionType?: QuizQuestionType,
 * }} payload
 * @returns {Promise<QuizQuestion>}
 */
export const createQuizQuestionVersion = async (questionId, payload) => {
  const existing = readCache().find((q) => q.questionId === questionId)
  const questionType = payload.questionType ?? existing?.questionType ?? 'SINGLE_CHOICE'
  validateQuestionPayload({
    questionKey: existing?.questionKey ?? 'version',
    usageType: existing?.usageType ?? 'SUB_CHAPTER',
    questionType,
    prompt: payload.prompt,
    scenarioJson: payload.scenarioJson,
    optionsJson: payload.optionsJson,
    correctAnswerJson: payload.correctAnswerJson,
    explanation: payload.explanation,
  })

  const body = {
    prompt: payload.prompt.trim(),
    options_json: payload.optionsJson,
    correct_answer_json: { key: String(payload.correctAnswerJson.key) },
    explanation: payload.explanation.trim(),
    scenario_json: questionType === 'SCENARIO' ? (payload.scenarioJson ?? null) : null,
  }
  if (payload.sourceRefsJson != null) body.source_refs_json = payload.sourceRefsJson

  try {
    const raw = unwrapData(await createAdminQuizQuestionVersion(questionId, body))
    const previous = existing ?? mapQuestion({ question_id: questionId })
    const question = mapQuestion(raw, {
      ...previous,
      ...payload,
      questionType,
      status: 'DRAFT',
      versionNo: Number(previous.versionNo || 1) + 1,
      createdAt: new Date().toISOString(),
      publishedAt: null,
    })
    // 새 버전 행이 새 questionId를 받으면 캐시에 추가
    return upsertCache(question)
  } catch (error) {
    throw parseApiError(error)
  }
}

/**
 * DRAFT → REVIEW
 * @param {number} questionId
 * @returns {Promise<QuizQuestion>}
 */
export const submitQuizQuestionForReview = async (questionId) => {
  try {
    const raw = unwrapData(await patchAdminQuizQuestion(questionId, { status: 'REVIEW' }))
    const previous = readCache().find((q) => q.questionId === questionId) ?? {
      questionId,
      status: 'DRAFT',
    }
    return upsertCache(mapQuestion(raw, { ...previous, status: 'REVIEW' }))
  } catch (error) {
    const parsed = parseApiError(error)
    // BE 미구현 시 로컬 상태만 진행 (관리자 워크플로 계속)
    if (parsed.status === 404 || parsed.status === 405 || parsed.code === 'METHOD_NOT_ALLOWED') {
      const previous = readCache().find((q) => q.questionId === questionId)
      if (!previous) throw parsed
      return upsertCache({ ...previous, status: 'REVIEW' })
    }
    throw parsed
  }
}

/**
 * REVIEW/DRAFT → PUBLISHED
 * @param {number} questionId
 * @returns {Promise<QuizQuestion>}
 */
export const publishQuizQuestion = async (questionId) => {
  try {
    let raw
    try {
      raw = unwrapData(await publishAdminQuizQuestion(questionId))
    } catch (error) {
      const first = parseApiError(error)
      if (first.status !== 404 && first.status !== 405) throw first
      raw = unwrapData(await patchAdminQuizQuestion(questionId, { status: 'PUBLISHED' }))
    }
    const previous = readCache().find((q) => q.questionId === questionId) ?? {
      questionId,
      status: 'REVIEW',
    }
    return upsertCache(
      mapQuestion(raw, {
        ...previous,
        status: 'PUBLISHED',
        publishedAt: new Date().toISOString(),
      }),
    )
  } catch (error) {
    const parsed = parseApiError(error)
    if (parsed.status === 404 || parsed.status === 405 || parsed.code === 'METHOD_NOT_ALLOWED') {
      const previous = readCache().find((q) => q.questionId === questionId)
      if (!previous) throw parsed
      return upsertCache({
        ...previous,
        status: 'PUBLISHED',
        publishedAt: new Date().toISOString(),
      })
    }
    throw parsed
  }
}

/**
 * A2 연동 — 소단원 JSON에 넣을 수 있는 PUBLISHED questionId
 * @param {number} [subChapterId]
 * @returns {QuizQuestion[]}
 */
export const listPublishedQuestionsForSubChapter = (subChapterId) => {
  return readCache().filter(
    (q) =>
      q.status === 'PUBLISHED' &&
      q.usageType === 'SUB_CHAPTER' &&
      (subChapterId == null || q.subChapterId === Number(subChapterId)),
  )
}

/** @param {object} payload */
const validateQuestionPayload = (payload) => {
  const errors = []
  if (!payload.prompt?.trim()) errors.push('prompt는 필수입니다.')
  if (!payload.explanation?.trim()) errors.push('explanation은 필수입니다.')
  if (!Array.isArray(payload.optionsJson) || payload.optionsJson.length < 2) {
    errors.push('선택지는 최소 2개여야 합니다.')
  } else {
    const keys = payload.optionsJson.map((o) => o.key)
    if (new Set(keys).size !== keys.length) errors.push('선택지 key가 중복됩니다.')
    if (!payload.optionsJson.every((o) => o.key && String(o.label ?? '').trim())) {
      errors.push('선택지 key·label은 필수입니다.')
    }
  }
  const correctKey = payload.correctAnswerJson?.key
  if (!correctKey) errors.push('정답 key는 필수입니다.')
  else if (!payload.optionsJson?.some((o) => o.key === correctKey)) {
    errors.push('정답 key가 선택지에 없습니다.')
  }
  if (payload.questionType === 'TRUE_FALSE') {
    const keys = new Set(payload.optionsJson?.map((o) => o.key))
    if (!keys.has('O') || !keys.has('X')) {
      errors.push('O/X 문항은 key가 "O", "X"여야 합니다.')
    }
  }
  if (payload.questionType === 'SCENARIO') {
    const scenario = payload.scenarioJson
    if (!scenario || typeof scenario !== 'object') {
      errors.push('SCENARIO 문항은 scenario_json이 필수입니다.')
    } else if (!String(scenario.narrative ?? scenario.title ?? '').trim()) {
      errors.push('scenario_json에 narrative 또는 title이 필요합니다.')
    }
  }
  if (payload.usageType === 'SUB_CHAPTER' && payload.subChapterId == null) {
    errors.push('SUB_CHAPTER는 sub_chapter_id가 필요합니다.')
  }
  if (
    (payload.usageType === 'LEVEL_TEST' || payload.usageType === 'MAIN_CHAPTER') &&
    payload.mainChapterId == null
  ) {
    errors.push(`${payload.usageType}는 main_chapter_id가 필요합니다.`)
  }
  if (errors.length) {
    const err = new Error(errors.join('\n'))
    err.code = 'QUIZ_VALIDATION_ERROR'
    err.errors = errors
    throw err
  }
}

export const USAGE_TYPE_OPTIONS = [
  { value: 'SUB_CHAPTER', label: '소단원 퀴즈' },
  { value: 'MAIN_CHAPTER', label: '대단원 퀴즈' },
  { value: 'LEVEL_TEST', label: '레벨 테스트' },
  { value: 'DAILY_GENERAL', label: '일일(일반)' },
  { value: 'DAILY_NEWS', label: '일일(뉴스)' },
]

export const QUESTION_TYPE_OPTIONS = [
  { value: 'SINGLE_CHOICE', label: '단일 선택' },
  { value: 'TRUE_FALSE', label: 'O / X' },
  { value: 'SCENARIO', label: '상황판단' },
]

export const DIFFICULTY_OPTIONS = [
  { value: '', label: '없음' },
  { value: 'EASY', label: '쉬움' },
  { value: 'MEDIUM', label: '보통' },
  { value: 'HARD', label: '어려움' },
]

export const STATUS_LABELS = {
  DRAFT: '초안',
  REVIEW: '검수',
  PUBLISHED: '게시됨',
  RETIRED: '폐기',
}

export const ADMIN_QUIZ_ERROR_MESSAGES = {
  QUIZ_VALIDATION_ERROR: '문항 값이 올바르지 않습니다.',
  QUESTION_NOT_FOUND: '문항을 찾을 수 없습니다.',
  VALIDATION_ERROR: '요청 값이 올바르지 않습니다.',
  DUPLICATE_QUESTION_KEY: '같은 question_key가 이미 있습니다.',
  ADMIN_REQUIRED: '관리자 권한이 필요합니다.',
}

export const formatAdminQuizError = (error) => {
  if (error?.code === 'QUIZ_VALIDATION_ERROR' && Array.isArray(error.errors)) {
    return error.errors.join('\n')
  }
  if (error?.code && ADMIN_QUIZ_ERROR_MESSAGES[error.code]) {
    return ADMIN_QUIZ_ERROR_MESSAGES[error.code]
  }
  return error?.message || '요청에 실패했습니다.'
}

/** @returns {{ key: string, label: string, description: null }[]} */
export const defaultOptionsForType = (questionType) => {
  if (questionType === 'TRUE_FALSE') {
    return [
      { key: 'O', label: 'O', description: null },
      { key: 'X', label: 'X', description: null },
    ]
  }
  return [
    { key: '1', label: '', description: null },
    { key: '2', label: '', description: null },
  ]
}
