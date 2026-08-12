/**
 * 일일 퀘스트 서비스
 * - GET /daily-quests/today
 * - PUT /daily-quests/today/answers
 * - POST /daily-quests/today/submit
 * — 실 API 우선, DEV에서 실패 시 로컬 mock 폴백
 */

/**
 * @typedef {import('@/types/dailyQuest.js').DailyQuest} DailyQuest
 * @typedef {import('@/types/dailyQuest.js').DailyQuestItem} DailyQuestItem
 * @typedef {import('@/types/dailyQuest.js').DailyQuestQuestionSnapshot} DailyQuestQuestionSnapshot
 * @typedef {import('@/types/dailyQuest.js').DailyQuestSaveAnswerInput} DailyQuestSaveAnswerInput
 * @typedef {import('@/types/dailyQuest.js').DailyQuestSaveAnswerResult} DailyQuestSaveAnswerResult
 * @typedef {import('@/types/dailyQuest.js').DailyQuestStatus} DailyQuestStatus
 * @typedef {import('@/types/dailyQuest.js').DailyQuestQuestionTypeSummary} DailyQuestQuestionTypeSummary
 * @typedef {import('@/types/study.js').QuizQuestionType} QuizQuestionType
 */

import {
  getToday as getTodayApi,
  saveAnswer as saveAnswerApi,
  submitToday as submitTodayApi,
} from '@/api/user/dailyQuestApi.js'
import { ApiError } from '@/api/user/errorHandler.js'

const STORAGE_KEY = 'daily_quest_state'
const TOTAL_COUNT = 5
const delay = (ms = 150) => new Promise((resolve) => setTimeout(resolve, ms))

/** @type {Record<QuizQuestionType, string>} */
export const DAILY_QUEST_QUESTION_TYPE_LABELS = {
  SINGLE_CHOICE: '객관식 퀴즈',
  MULTIPLE_CHOICE: '객관식 퀴즈',
  TRUE_FALSE: '객관식 퀴즈',
  SCENARIO: '시나리오 퀴즈',
}

/** @type {Record<string, string>} */
const DAILY_QUEST_ERROR_MESSAGES = {
  UNAUTHORIZED: '인증이 필요합니다. 다시 로그인해 주세요.',
  DAILY_QUEST_POOL_INSUFFICIENT:
    '오늘의 퀘스트 문항을 배정할 수 없습니다. 잠시 후 다시 시도해 주세요.',
  VALIDATION_ERROR: '답안 형식이 올바르지 않습니다.',
  ITEM_NOT_FOUND: '문항을 찾을 수 없습니다.',
  DAILY_QUEST_ALREADY_COMPLETED: '오늘의 퀘스트를 이미 완료했습니다.',
  DAILY_QUEST_ANSWERS_INCOMPLETE: '아직 풀지 않은 문제가 있습니다. 5문제를 모두 저장해 주세요.',
}

/** API 비즈니스 오류 — DEV에서도 mock으로 가리지 않음 */
const BUSINESS_ERROR_CODES = new Set([
  'UNAUTHORIZED',
  'DAILY_QUEST_POOL_INSUFFICIENT',
  'VALIDATION_ERROR',
  'ITEM_NOT_FOUND',
  'DAILY_QUEST_ALREADY_COMPLETED',
  'DAILY_QUEST_ANSWERS_INCOMPLETE',
])

const POINTS_PER_CORRECT = 100

export class DailyQuestApiError extends Error {
  /**
   * @param {string} code
   * @param {string} message
   * @param {number} [status=400]
   */
  constructor(code, message, status = 400) {
    super(message)
    this.name = 'DailyQuestApiError'
    this.code = code
    this.status = status
    this.requestId = `req-${Date.now()}`
  }
}

/**
 * @param {unknown} error
 * @param {string} fallbackCode
 * @param {string} fallbackMessage
 * @returns {DailyQuestApiError}
 */
const mapDailyQuestError = (error, fallbackCode, fallbackMessage) => {
  if (error instanceof DailyQuestApiError) return error

  if (error instanceof ApiError) {
    const code = error.code ?? fallbackCode
    const message = DAILY_QUEST_ERROR_MESSAGES[code] ?? error.message ?? fallbackMessage
    return new DailyQuestApiError(code, message, error.status)
  }

  if (error && typeof error === 'object' && 'code' in error && 'message' in error) {
    const err = /** @type {{ code: string, message: string, status?: number }} */ (error)
    return new DailyQuestApiError(
      err.code,
      DAILY_QUEST_ERROR_MESSAGES[err.code] ?? err.message,
      err.status ?? 400,
    )
  }

  return new DailyQuestApiError(fallbackCode, fallbackMessage, 500)
}

/**
 * @param {DailyQuestApiError} error
 * @returns {boolean}
 */
const shouldFallbackToMock = (error) => {
  if (!import.meta.env.DEV) return false
  if (BUSINESS_ERROR_CODES.has(error.code)) return false
  return true
}

/**
 * quiz_questions 시드 → daily_quest_items.question_snapshot_json
 * SINGLE_CHOICE 3 · SCENARIO 2 (혼합 배정)
 * 내부 `_correct_key` / `_explanation` 은 스냅샷 공개 응답에서 제거
 */
const QUESTION_SEED = [
  {
    question_id: 1001,
    question_key: 'daily-deposit-protection',
    version_no: 1,
    usage_type: 'DAILY_GENERAL',
    main_chapter_id: 2,
    sub_chapter_id: null,
    question_type: 'SINGLE_CHOICE',
    difficulty: 'MEDIUM',
    prompt: '예금자 보호 제도가 보장하는 범위로 알맞은 것은?',
    scenario_json: null,
    options_json: [
      { key: '1', label: '주식 투자 손실 전액' },
      { key: '2', label: '일정 한도 내 예금 원금·이자' },
      { key: '3', label: '펀드 평가액 전액' },
      { key: '4', label: '부동산 시세 하락분' },
    ],
    source_refs_json: null,
    source_type: 'GENERAL',
    _correct_key: '2',
    _explanation: '예금자 보호는 일정 한도 내 예금 원금과 이자를 보장합니다.',
  },
  {
    question_id: 1002,
    question_key: 'daily-bond-rate',
    version_no: 1,
    usage_type: 'DAILY_GENERAL',
    main_chapter_id: 3,
    sub_chapter_id: null,
    question_type: 'SINGLE_CHOICE',
    difficulty: 'MEDIUM',
    prompt: '시장 금리가 오르면 기존 채권 가격은 보통 어떻게 되나?',
    scenario_json: null,
    options_json: [
      { key: '1', label: '함께 오른다' },
      { key: '2', label: '내려가는 경향이 있다' },
      { key: '3', label: '항상 그대로다' },
      { key: '4', label: '배당이 늘어난다' },
    ],
    source_refs_json: null,
    source_type: 'GENERAL',
    _correct_key: '2',
    _explanation: '금리가 오르면 기존 채권의 상대 매력이 떨어져 가격이 내려가는 경향이 있습니다.',
  },
  {
    question_id: 1003,
    question_key: 'daily-first-salary-portfolio',
    version_no: 1,
    usage_type: 'MAIN_CHAPTER',
    main_chapter_id: 2,
    sub_chapter_id: null,
    question_type: 'SCENARIO',
    difficulty: 'MEDIUM',
    prompt: '이 고객에게 가장 적합한 포트폴리오 구성은?',
    scenario_json: {
      title: '첫 월급을 받은 사회초년생',
      paperTitle: '포트폴리오 추천서',
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
      market: {
        title: '오늘의 금융 시황',
        bullets: ['시중은행 정기예금 금리 연 3.2% 수준', '단기 유동성 수요가 늘어난 달'],
      },
      constraints: ['원금 손실은 원하지 않음', '안정과 성장을 함께 추구'],
      narrative:
        '첫 직장 3년 차, 월급의 일부를 꾸준히 모아두었지만 어디에 투자해야 할지 막막합니다. 안정적인 수익을 원하면서도 성장 기회를 놓치고 싶지 않아, 오늘 포트폴리오 구성 조언을 받으러 왔습니다.',
    },
    options_json: [
      { key: '1', label: '예금 80%, 주식 20%', description: '안정 중심' },
      { key: '2', label: '주식 100%', description: '성장 중심' },
      { key: '3', label: '예금 40%, 주식 40%, 채권 20%', description: '균형 배분' },
      { key: '4', label: '채권 100%', description: '수익 중심' },
    ],
    source_refs_json: null,
    source_type: 'WRONG_RETRY',
    _correct_key: '3',
    _explanation:
      '중위험·안정+성장 목표에는 예금·주식·채권을 고루 담은 포트폴리오가 가장 잘 맞습니다.',
  },
  {
    question_id: 1004,
    question_key: 'daily-diversification',
    version_no: 1,
    usage_type: 'DAILY_GENERAL',
    main_chapter_id: 4,
    sub_chapter_id: null,
    question_type: 'SINGLE_CHOICE',
    difficulty: 'EASY',
    prompt: '분산 투자의 주요 목적으로 가장 알맞은 것은?',
    scenario_json: null,
    options_json: [
      { key: '1', label: '특정 자산의 손실 영향을 줄인다' },
      { key: '2', label: '거래 수수료를 없앤다' },
      { key: '3', label: '원금을 법적으로 보장한다' },
      { key: '4', label: '세금 납부를 면제한다' },
    ],
    source_refs_json: null,
    source_type: 'WRONG_RETRY',
    _correct_key: '1',
    _explanation: '분산 투자는 특정 자산 손실이 전체에 미치는 영향을 줄이기 위함입니다.',
  },
  {
    question_id: 1005,
    question_key: 'daily-news-deposit-rate',
    version_no: 1,
    usage_type: 'DAILY_NEWS',
    main_chapter_id: 2,
    sub_chapter_id: null,
    question_type: 'SCENARIO',
    difficulty: 'MEDIUM',
    prompt: '상담사가 고객에게 가장 먼저 확인해 주라고 조언할 항목은?',
    scenario_json: {
      title: '예·적금 금리 경쟁',
      paperTitle: '포트폴리오 추천서',
      persona: {
        name: '펭귄',
        age: '30세',
        job: '직장인',
        monthlyIncome: '350만',
        monthlySaving: '80만',
      },
      requirements: {
        assets: '1,200만원',
        risk: '저위험 선호',
        goal: '금리 비교',
      },
      market: {
        title: '오늘의 금융 시황',
        bullets: ['은행권 예·적금 금리 경쟁 심화', '우대금리 조건이 까다로워지는 추세'],
      },
      constraints: ['여유 자금의 일부만 예·적금에 배분'],
      narrative:
        '최근 은행권 예·적금 금리 경쟁이 뜨겁다는 뉴스를 봤습니다. 여유 자금 일부를 예·적금에 넣으려는데, 어디에 주목해야 할지 모르겠습니다.',
    },
    options_json: [
      { key: '1', label: '우대금리 조건과 실질 적용 금리', description: '조건 확인' },
      { key: '2', label: '은행 로고 색상', description: '브랜드' },
      { key: '3', label: '지점 인테리어', description: '분위기' },
      { key: '4', label: '모바일 앱 아이콘', description: '디자인' },
    ],
    source_refs_json: [
      {
        title: '예·적금 금리 비교 수요 증가…은행권 경쟁 격화',
        reference_at: '2026-07-29T00:00:00Z',
      },
    ],
    source_type: 'NEWS',
    _correct_key: '1',
    _explanation: '금리 경쟁 시기에는 우대 조건과 실질 금리를 먼저 비교해야 합니다.',
  },
]

/**
 * @returns {string}
 */
const todayDateString = () => {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * @returns {{ quest: object | null }}
 */
const readState = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { quest: null }
    const parsed = JSON.parse(raw)
    return { quest: parsed.quest ?? null }
  } catch {
    return { quest: null }
  }
}

/**
 * @param {{ quest: object | null }} state
 */
const writeState = (state) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

/**
 * @param {object} seed
 * @returns {object} question_snapshot_json (내부 채점 필드 포함 가능)
 */
const buildSnapshotRaw = (seed) => ({
  question_id: seed.question_id,
  question_key: seed.question_key,
  version_no: seed.version_no,
  usage_type: seed.usage_type,
  main_chapter_id: seed.main_chapter_id,
  sub_chapter_id: seed.sub_chapter_id,
  question_type: seed.question_type,
  difficulty: seed.difficulty ?? null,
  prompt: seed.prompt,
  scenario_json: seed.scenario_json ?? null,
  options_json: structuredClone(seed.options_json ?? []),
  source_refs_json: seed.source_refs_json ?? null,
  _correct_key: seed._correct_key,
  _explanation: seed._explanation,
})

/**
 * 공개 스냅샷 — 정답·해설 제거
 * @param {object} snapshot
 * @returns {object}
 */
const toPublicSnapshotRaw = (snapshot) => ({
  question_id: snapshot.question_id,
  question_key: snapshot.question_key,
  version_no: snapshot.version_no,
  usage_type: snapshot.usage_type,
  main_chapter_id: snapshot.main_chapter_id,
  sub_chapter_id: snapshot.sub_chapter_id,
  question_type: snapshot.question_type,
  difficulty: snapshot.difficulty ?? null,
  prompt: snapshot.prompt,
  scenario_json: snapshot.scenario_json ?? null,
  options_json: structuredClone(snapshot.options_json ?? []),
  source_refs_json: snapshot.source_refs_json ?? null,
})

/**
 * @param {object} raw
 * @returns {import('@/types/dailyQuest.js').DailyQuestSourceRef[] | null}
 */
const mapSourceRefs = (raw) => {
  if (!Array.isArray(raw)) return null
  return raw.map((ref) => ({
    title: ref.title,
    url: ref.url,
    publisher: ref.publisher,
    referenceAt: ref.reference_at ?? ref.referenceAt ?? null,
  }))
}

/**
 * @param {object} raw
 * @returns {DailyQuestQuestionSnapshot}
 */
export const mapQuestionSnapshot = (raw) => ({
  questionId: raw.question_id ?? raw.questionId,
  questionKey: raw.question_key ?? raw.questionKey,
  versionNo: raw.version_no ?? raw.versionNo,
  usageType: raw.usage_type ?? raw.usageType,
  mainChapterId: raw.main_chapter_id ?? raw.mainChapterId ?? null,
  subChapterId: raw.sub_chapter_id ?? raw.subChapterId ?? null,
  questionType: raw.question_type ?? raw.questionType,
  difficulty: raw.difficulty ?? null,
  prompt: raw.prompt,
  scenarioJson: raw.scenario_json ?? raw.scenarioJson ?? null,
  optionsJson: (raw.options_json ?? raw.optionsJson ?? []).map((o) => ({
    key: o.key,
    label: o.label,
    ...(o.description ? { description: o.description } : {}),
  })),
  sourceRefs: mapSourceRefs(raw.source_refs_json ?? raw.sourceRefs),
  ...(raw.correct_answer_json || raw.correctAnswerJson
    ? { correctAnswerJson: raw.correct_answer_json ?? raw.correctAnswerJson }
    : {}),
  ...(raw.explanation != null ? { explanation: raw.explanation } : {}),
})

/**
 * @param {object | null} raw
 * @returns {import('@/types/dailyQuest.js').DailyQuestUserAnswer | null}
 */
export const mapUserAnswer = (raw) => {
  if (!raw) return null
  const answer = {}
  if (raw.selected_key != null) answer.selectedKey = raw.selected_key
  if (Array.isArray(raw.selected_keys)) answer.selectedKeys = [...raw.selected_keys]
  return Object.keys(answer).length ? answer : null
}

/**
 * @param {object} raw
 * @returns {DailyQuestItem}
 */
export const mapDailyQuestItem = (raw) => ({
  dailyQuestItemId: raw.daily_quest_item_id ?? raw.dailyQuestItemId,
  questionId: raw.question_id ?? raw.questionId,
  sourceType: raw.source_type ?? raw.sourceType,
  displayOrder: raw.display_order ?? raw.displayOrder,
  questionSnapshot: mapQuestionSnapshot(raw.question_snapshot_json ?? raw.questionSnapshot ?? {}),
  userAnswer: mapUserAnswer(raw.user_answer_json ?? raw.userAnswer),
  isCorrect: raw.is_correct ?? raw.isCorrect ?? null,
  answeredAt: raw.answered_at ?? raw.answeredAt ?? null,
})

/**
 * @param {object[]} itemsRaw
 * @returns {{ questionTypes: QuizQuestionType[], questionTypeSummary: DailyQuestQuestionTypeSummary[] }}
 */
export const buildQuestionTypeSummary = (itemsRaw) => {
  /** @type {QuizQuestionType[]} */
  const questionTypes = []
  /** @type {Record<string, number>} */
  const counts = {}

  for (const item of itemsRaw ?? []) {
    const type = item.question_snapshot_json?.question_type ?? item.questionSnapshot?.questionType
    if (!type) continue
    if (!counts[type]) {
      questionTypes.push(type)
      counts[type] = 0
    }
    counts[type] += 1
  }

  const questionTypeSummary = questionTypes.map((questionType) => ({
    questionType,
    label: DAILY_QUEST_QUESTION_TYPE_LABELS[questionType] ?? questionType,
    count: counts[questionType] ?? 0,
  }))

  return { questionTypes, questionTypeSummary }
}

/**
 * @param {object} raw
 * @returns {DailyQuest}
 */
export const mapDailyQuest = (raw) => {
  const items = (raw.items ?? []).map(mapDailyQuestItem)
  const answeredCount = raw.answered_count ?? items.filter((item) => item.userAnswer != null).length

  const fromRaw =
    Array.isArray(raw.question_types) && Array.isArray(raw.question_type_summary)
      ? {
          questionTypes: raw.question_types,
          questionTypeSummary: raw.question_type_summary.map((row) => ({
            questionType: row.question_type ?? row.questionType,
            label:
              row.label ??
              DAILY_QUEST_QUESTION_TYPE_LABELS[row.question_type ?? row.questionType] ??
              String(row.question_type ?? row.questionType),
            count: row.count,
          })),
        }
      : buildQuestionTypeSummary(
          (raw.items ?? []).map((item) => ({
            question_snapshot_json: item.question_snapshot_json,
          })),
        )

  return {
    dailyQuestId: raw.daily_quest_id ?? raw.dailyQuestId,
    questDate: raw.quest_date ?? raw.questDate,
    status: raw.status,
    totalCount: raw.total_count ?? raw.totalCount,
    correctCount: raw.correct_count ?? raw.correctCount ?? 0,
    score: raw.score ?? 0,
    answeredCount,
    completedAt: raw.completed_at ?? raw.completedAt ?? null,
    items,
    questionTypes: fromRaw.questionTypes,
    questionTypeSummary: fromRaw.questionTypeSummary,
  }
}

/**
 * @param {object} raw
 * @returns {DailyQuestSaveAnswerResult}
 */
export const mapSaveAnswerResult = (raw) => ({
  dailyQuestId: raw.daily_quest_id ?? raw.dailyQuestId,
  status: raw.status,
  answeredCount: raw.answered_count ?? raw.answeredCount,
  totalCount: raw.total_count ?? raw.totalCount,
  dailyQuestItemId: raw.daily_quest_item_id ?? raw.dailyQuestItemId,
  userAnswer: mapUserAnswer(raw.user_answer_json ?? raw.userAnswer ?? raw.user_answer),
})

/**
 * @param {object[]} items
 * @returns {number}
 */
const countAnswered = (items) => items.filter((item) => item.user_answer_json != null).length

/**
 * @param {object} quest
 * @returns {DailyQuestStatus}
 */
const deriveStatus = (quest) => {
  if (quest.status === 'COMPLETED') return 'COMPLETED'
  const answered = countAnswered(quest.items ?? [])
  if (answered === 0) return 'ASSIGNED'
  return 'IN_PROGRESS'
}

/**
 * @returns {object}
 */
const createTodayQuest = () => {
  if (QUESTION_SEED.length < TOTAL_COUNT) {
    throw new DailyQuestApiError(
      'DAILY_QUEST_POOL_INSUFFICIENT',
      DAILY_QUEST_ERROR_MESSAGES.DAILY_QUEST_POOL_INSUFFICIENT,
      422,
    )
  }

  const items = QUESTION_SEED.slice(0, TOTAL_COUNT).map((seed, index) => ({
    daily_quest_item_id: 5001 + index,
    question_id: seed.question_id,
    source_type: seed.source_type,
    display_order: index + 1,
    question_snapshot_json: buildSnapshotRaw(seed),
    user_answer_json: null,
    is_correct: null,
    answered_at: null,
    created_at: new Date().toISOString(),
  }))

  return {
    daily_quest_id: 4001,
    quest_date: todayDateString(),
    status: 'ASSIGNED',
    total_count: TOTAL_COUNT,
    correct_count: 0,
    score: 0,
    answered_count: 0,
    completed_at: null,
    items,
  }
}

/**
 * @returns {object}
 */
const ensureTodayQuest = () => {
  const state = readState()
  const today = todayDateString()

  if (state.quest && state.quest.quest_date === today) {
    state.quest.answered_count = countAnswered(state.quest.items ?? [])
    if (state.quest.status !== 'COMPLETED') {
      state.quest.status = deriveStatus(state.quest)
    }
    writeState(state)
    return state.quest
  }

  const quest = createTodayQuest()
  writeState({ quest })
  return quest
}

/**
 * @param {object} quest
 * @returns {object}
 */
const toPublicQuestRaw = (quest) => {
  const publicItems = (quest.items ?? []).map((item) => ({
    daily_quest_item_id: item.daily_quest_item_id,
    question_id: item.question_id,
    source_type: item.source_type,
    display_order: item.display_order,
    question_snapshot_json: toPublicSnapshotRaw(item.question_snapshot_json),
    user_answer_json: item.user_answer_json,
    is_correct: item.is_correct,
    answered_at: item.answered_at,
  }))

  const { questionTypes, questionTypeSummary } = buildQuestionTypeSummary(publicItems)

  return {
    daily_quest_id: quest.daily_quest_id,
    quest_date: quest.quest_date,
    status: quest.status,
    total_count: quest.total_count,
    correct_count: quest.correct_count,
    score: quest.score,
    answered_count: quest.answered_count,
    completed_at: quest.completed_at,
    question_types: questionTypes,
    question_type_summary: questionTypeSummary.map((row) => ({
      question_type: row.questionType,
      label: row.label,
      count: row.count,
    })),
    items: publicItems,
  }
}

/**
 * GET /daily-quests/today (mock)
 * @returns {Promise<{ data: DailyQuest }>}
 */
const getTodayDailyQuestMock = async () => {
  await delay()
  const quest = ensureTodayQuest()
  return { data: mapDailyQuest(structuredClone(toPublicQuestRaw(quest))) }
}

/**
 * GET /daily-quests/today
 * @returns {Promise<{ data: DailyQuest }>}
 */
export const getTodayDailyQuest = async () => {
  try {
    const { data } = await getTodayApi()
    const raw = data?.data ?? data
    return { data: mapDailyQuest(raw) }
  } catch (error) {
    const mapped = mapDailyQuestError(
      error,
      'DAILY_QUEST_FETCH_FAILED',
      '오늘의 퀘스트를 불러오지 못했습니다.',
    )
    if (!shouldFallbackToMock(mapped)) throw mapped
    console.warn('[dailyQuestService] GET today 실패 — mock으로 대체합니다.', mapped)
    return getTodayDailyQuestMock()
  }
}

/**
 * PUT /daily-quests/today/answers (mock)
 * @param {DailyQuestSaveAnswerInput} input
 * @returns {Promise<{ data: DailyQuestSaveAnswerResult }>}
 */
const saveDailyQuestAnswerMock = async (input) => {
  await delay()

  const dailyQuestItemId = input?.dailyQuestItemId
  const answer = input?.answer
  const selectedKey = answer?.selectedKey
  const selectedKeys = answer?.selectedKeys

  if (dailyQuestItemId == null || (!selectedKey && !selectedKeys?.length)) {
    throw new DailyQuestApiError(
      'VALIDATION_ERROR',
      DAILY_QUEST_ERROR_MESSAGES.VALIDATION_ERROR,
      400,
    )
  }

  const quest = ensureTodayQuest()

  if (quest.status === 'COMPLETED') {
    throw new DailyQuestApiError(
      'DAILY_QUEST_ALREADY_COMPLETED',
      DAILY_QUEST_ERROR_MESSAGES.DAILY_QUEST_ALREADY_COMPLETED,
      409,
    )
  }

  const item = (quest.items ?? []).find((row) => row.daily_quest_item_id === dailyQuestItemId)
  if (!item) {
    throw new DailyQuestApiError('ITEM_NOT_FOUND', DAILY_QUEST_ERROR_MESSAGES.ITEM_NOT_FOUND, 404)
  }

  const optionKeys = new Set((item.question_snapshot_json?.options_json ?? []).map((o) => o.key))
  const keysToValidate = selectedKeys?.length ? selectedKeys : [selectedKey]
  if (!keysToValidate.every((key) => optionKeys.has(key))) {
    throw new DailyQuestApiError(
      'VALIDATION_ERROR',
      DAILY_QUEST_ERROR_MESSAGES.VALIDATION_ERROR,
      400,
    )
  }

  item.user_answer_json = selectedKeys?.length
    ? { selected_keys: [...selectedKeys] }
    : { selected_key: selectedKey }
  item.answered_at = new Date().toISOString()
  item.is_correct = null

  quest.answered_count = countAnswered(quest.items)
  quest.status = deriveStatus(quest)

  writeState({ quest })

  return {
    data: {
      dailyQuestId: quest.daily_quest_id,
      status: quest.status,
      answeredCount: quest.answered_count,
      totalCount: quest.total_count,
      dailyQuestItemId,
      userAnswer: mapUserAnswer(item.user_answer_json),
    },
  }
}

/**
 * PUT /daily-quests/today/answers
 * @param {DailyQuestSaveAnswerInput} input
 * @returns {Promise<{ data: DailyQuestSaveAnswerResult }>}
 */
export const saveDailyQuestAnswer = async (input) => {
  const dailyQuestItemId = input?.dailyQuestItemId
  const answer = input?.answer
  const selectedKey = answer?.selectedKey
  const selectedKeys = answer?.selectedKeys

  if (dailyQuestItemId == null || (!selectedKey && !selectedKeys?.length)) {
    throw new DailyQuestApiError(
      'VALIDATION_ERROR',
      DAILY_QUEST_ERROR_MESSAGES.VALIDATION_ERROR,
      400,
    )
  }

  /** @type {{ selected_key?: string, selected_keys?: string[] }} */
  const user_answer_json = selectedKeys?.length
    ? { selected_keys: [...selectedKeys] }
    : { selected_key: selectedKey }

  try {
    const { data } = await saveAnswerApi({
      daily_quest_item_id: dailyQuestItemId,
      user_answer_json,
    })
    const raw = data?.data ?? data
    return { data: mapSaveAnswerResult(raw) }
  } catch (error) {
    const mapped = mapDailyQuestError(
      error,
      'DAILY_QUEST_SAVE_FAILED',
      '답안을 저장하지 못했습니다.',
    )
    if (!shouldFallbackToMock(mapped)) throw mapped
    console.warn('[dailyQuestService] PUT answers 실패 — mock으로 대체합니다.', mapped)
    return saveDailyQuestAnswerMock(input)
  }
}

/**
 * 해설 + 뉴스 근거 문구
 * @param {object} snapshot
 * @returns {string}
 */
const buildExplanation = (snapshot) => {
  let text = snapshot._explanation || snapshot.explanation || '해설이 준비되지 않았습니다.'
  const refs = snapshot.source_refs_json
  if (Array.isArray(refs) && refs.length > 0) {
    const lines = refs.map((ref) => {
      const title = ref.title || '출처'
      const at = ref.reference_at ? ` · 기준 ${String(ref.reference_at).slice(0, 10)}` : ''
      return `${title}${at}`
    })
    text = `${text}\n\n근거: ${lines.join(' / ')}`
  }
  return text
}

/**
 * @param {object} raw
 * @returns {import('@/types/dailyQuest.js').DailyQuestSubmitResult}
 */
export const mapSubmitResult = (raw) => ({
  dailyQuestId: raw.daily_quest_id ?? raw.dailyQuestId,
  status: raw.status,
  correctCount: raw.correct_count ?? raw.correctCount,
  totalCount: raw.total_count ?? raw.totalCount,
  score: raw.score,
  results: (raw.results ?? []).map((row) => ({
    questionId: row.question_id ?? row.questionId,
    dailyQuestItemId: row.daily_quest_item_id ?? row.dailyQuestItemId,
    isCorrect: row.is_correct ?? row.isCorrect,
    explanation: row.explanation,
    sourceRefs: mapSourceRefs(row.source_refs_json ?? row.source_refs ?? row.sourceRefs),
  })),
  reward: {
    points: raw.reward?.points ?? 0,
    pointTransactionId: raw.reward?.point_transaction_id ?? raw.reward?.pointTransactionId ?? 0,
  },
})

/**
 * POST /daily-quests/today/submit — mock
 * @returns {Promise<{ data: import('@/types/dailyQuest.js').DailyQuestSubmitResult }>}
 */
const submitDailyQuestMock = async () => {
  await delay()
  const quest = ensureTodayQuest()

  if (quest.submit_result) {
    return { data: mapSubmitResult(structuredClone(quest.submit_result)) }
  }

  if (quest.status === 'COMPLETED' && quest.submit_result) {
    return { data: mapSubmitResult(structuredClone(quest.submit_result)) }
  }

  const items = quest.items ?? []
  if (items.length < quest.total_count || items.some((item) => !item.user_answer_json)) {
    throw new DailyQuestApiError(
      'DAILY_QUEST_ANSWERS_INCOMPLETE',
      DAILY_QUEST_ERROR_MESSAGES.DAILY_QUEST_ANSWERS_INCOMPLETE,
      409,
    )
  }

  let correctCount = 0
  const results = []

  for (const item of items) {
    const snapshot = item.question_snapshot_json
    const selectedKey = item.user_answer_json?.selected_key
    const correctKey = snapshot._correct_key
    const isCorrect = Boolean(selectedKey && correctKey && selectedKey === correctKey)
    if (isCorrect) correctCount += 1

    item.is_correct = isCorrect
    snapshot.explanation = buildExplanation(snapshot)
    snapshot.correct_answer_json = { key: correctKey }

    results.push({
      question_id: item.question_id,
      daily_quest_item_id: item.daily_quest_item_id,
      is_correct: isCorrect,
      explanation: snapshot.explanation,
      source_refs_json: snapshot.source_refs_json,
    })
  }

  const score = correctCount
  const points = correctCount * POINTS_PER_CORRECT
  const completedAt = new Date().toISOString()
  const pointTransactionId = 7100 + Number(quest.daily_quest_id)

  quest.status = 'COMPLETED'
  quest.correct_count = correctCount
  quest.score = score
  quest.answered_count = items.length
  quest.completed_at = completedAt
  quest.point_transaction_id = pointTransactionId

  const submit_result = {
    daily_quest_id: quest.daily_quest_id,
    status: 'COMPLETED',
    correct_count: correctCount,
    total_count: quest.total_count,
    score,
    results,
    reward: {
      points,
      point_transaction_id: pointTransactionId,
    },
  }
  quest.submit_result = submit_result

  writeState({ quest })

  return { data: mapSubmitResult(structuredClone(submit_result)) }
}

/**
 * POST /daily-quests/today/submit — 최종 제출·채점 (멱등)
 * @returns {Promise<{ data: import('@/types/dailyQuest.js').DailyQuestSubmitResult }>}
 */
export const submitDailyQuest = async () => {
  try {
    const { data } = await submitTodayApi()
    const raw = data?.data ?? data
    return { data: mapSubmitResult(raw) }
  } catch (error) {
    const mapped = mapDailyQuestError(error, 'DAILY_QUEST_SUBMIT_FAILED', '제출에 실패했습니다.')
    if (!shouldFallbackToMock(mapped)) throw mapped
    console.warn('[dailyQuestService] POST submit 실패 — mock으로 대체합니다.', mapped)
    return submitDailyQuestMock()
  }
}

/**
 * @param {DailyQuest | null | undefined} quest
 * @returns {number} 0-based items index
 */
export const resolveResumeItemIndex = (quest) => {
  const items = quest?.items ?? []
  if (items.length === 0) return 0

  const firstUnanswered = items.findIndex((item) => item.userAnswer == null)
  if (firstUnanswered === -1) return items.length - 1
  return firstUnanswered
}

/**
 * 허브 진입용 — COMPLETED만 RESULT, 그 외 INTRO(문항 선택)
 * @param {DailyQuestStatus | null | undefined} status
 * @returns {import('@/types/dailyQuest.js').DailyQuestPhase}
 */
export const resolveInitialPhase = (status) => {
  if (status === 'COMPLETED') return 'RESULT'
  return 'INTRO'
}

export const resetDailyQuestState = () => {
  localStorage.removeItem(STORAGE_KEY)
}

/** @internal 테스트용 */
export const __QUESTION_SEED_COUNT = QUESTION_SEED.length
export const __STORAGE_KEY = STORAGE_KEY
export const __POINTS_PER_CORRECT = POINTS_PER_CORRECT
