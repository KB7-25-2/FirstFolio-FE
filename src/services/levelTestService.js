/**
 * 레벨 테스트 mock 서비스
 * - POST /level-tests/attempts
 * - PUT  /level-tests/attempts/:attemptId/answers
 * - POST /level-tests/attempts/:attemptId/submit
 * TODO: API 연동 시 levelTestApi로 교체
 */

/**
 * @typedef {import('@/types/levelTest.js').LevelTestAttempt} LevelTestAttempt
 * @typedef {import('@/types/levelTest.js').LevelTestQuestion} LevelTestQuestion
 * @typedef {import('@/types/levelTest.js').LevelTestAnswerItem} LevelTestAnswerItem
 * @typedef {import('@/types/levelTest.js').LevelTestSaveAnswersResult} LevelTestSaveAnswersResult
 * @typedef {import('@/types/levelTest.js').LevelTestSubmitResult} LevelTestSubmitResult
 */

const STORAGE_KEY = 'level_test_state'
const delay = (ms = 150) => new Promise((resolve) => setTimeout(resolve, ms))

export class LevelTestApiError extends Error {
  /**
   * @param {string} code
   * @param {string} message
   * @param {number} [status=400]
   */
  constructor(code, message, status = 400) {
    super(message)
    this.name = 'LevelTestApiError'
    this.code = code
    this.status = status
    this.requestId = `req-mock-${Date.now()}`
  }
}

/**
 * ASSET 대단원 문항 시드 — 단원당 문항 수는 가변 (리스트)
 * choices.id 는 API selected_choice_ids / 퀴즈 optionsJson.key 와 동일
 */
const ASSET_QUESTIONS_SEED = [
  {
    question_id: 1001,
    question_key: 'level-deposit-interest',
    display_order: 1,
    main_chapter: { main_chapter_id: 2, asset_type: 'DEPOSIT_SAVINGS' },
    question_type: 'SINGLE_CHOICE',
    prompt: '금리가 오르면 예금 이자는?',
    choices: [
      { id: 'A', text: '대체로 늘어난다' },
      { id: 'B', text: '대체로 줄어든다' },
      { id: 'C', text: '항상 그대로다' },
      { id: 'D', text: '예금과 관계없다' },
    ],
    _correct_choice_id: 'A',
  },
  {
    question_id: 1005,
    question_key: 'level-deposit-protection',
    display_order: 2,
    main_chapter: { main_chapter_id: 2, asset_type: 'DEPOSIT_SAVINGS' },
    question_type: 'SINGLE_CHOICE',
    prompt: '예금자 보호 제도가 보장하는 것은?',
    choices: [
      { id: 'A', text: '주식 투자 손실 전액' },
      { id: 'B', text: '일정 한도 내 예금 원금·이자' },
      { id: 'C', text: '펀드 평가액 전액' },
      { id: 'D', text: '부동산 시세 하락분' },
    ],
    _correct_choice_id: 'B',
  },
  {
    question_id: 1002,
    question_key: 'level-bond-return',
    display_order: 3,
    main_chapter: { main_chapter_id: 3, asset_type: 'BOND' },
    question_type: 'SINGLE_CHOICE',
    prompt: '채권을 사면 투자자가 받는 것은?',
    choices: [
      { id: 'A', text: '기업의 의결권' },
      { id: 'B', text: '이자와 만기 원금 상환' },
      { id: 'C', text: '배당금만' },
      { id: 'D', text: '예금자 보호' },
    ],
    _correct_choice_id: 'B',
  },
  {
    question_id: 1006,
    question_key: 'level-bond-price',
    display_order: 4,
    main_chapter: { main_chapter_id: 3, asset_type: 'BOND' },
    question_type: 'SINGLE_CHOICE',
    prompt: '시장 금리가 오르면 기존 채권 가격은 보통?',
    choices: [
      { id: 'A', text: '함께 오른다' },
      { id: 'B', text: '내려가는 경향이 있다' },
      { id: 'C', text: '항상 그대로다' },
      { id: 'D', text: '배당이 늘어난다' },
    ],
    _correct_choice_id: 'B',
  },
  {
    question_id: 1003,
    question_key: 'level-stock-risk',
    display_order: 5,
    main_chapter: { main_chapter_id: 4, asset_type: 'STOCK' },
    question_type: 'SINGLE_CHOICE',
    prompt: '주식 투자의 특징으로 알맞은 것은?',
    choices: [
      { id: 'A', text: '원금이 항상 보장된다' },
      { id: 'B', text: '가격 변동 위험이 있다' },
      { id: 'C', text: '만기가 반드시 있다' },
      { id: 'D', text: '이자가 확정되어 있다' },
    ],
    _correct_choice_id: 'B',
  },
  {
    question_id: 1007,
    question_key: 'level-stock-dividend',
    display_order: 6,
    main_chapter: { main_chapter_id: 4, asset_type: 'STOCK' },
    question_type: 'SINGLE_CHOICE',
    prompt: '주주가 받을 수 있는 수익으로 알맞은 것은?',
    choices: [
      { id: 'A', text: '확정 예금 이자만' },
      { id: 'B', text: '시세 차익과 배당' },
      { id: 'C', text: '만기 원금만' },
      { id: 'D', text: '예금자 보호금' },
    ],
    _correct_choice_id: 'B',
  },
  {
    question_id: 1004,
    question_key: 'level-fund-diversify',
    display_order: 7,
    main_chapter: { main_chapter_id: 5, asset_type: 'FUND' },
    question_type: 'SINGLE_CHOICE',
    prompt: '펀드의 기본 특징으로 알맞은 것은?',
    choices: [
      { id: 'A', text: '여러 자산에 나누어 투자한다' },
      { id: 'B', text: '한 종목만 보유한다' },
      { id: 'C', text: '예금과 동일한 상품이다' },
      { id: 'D', text: '손실이 날 수 없다' },
    ],
    _correct_choice_id: 'A',
  },
  {
    question_id: 1008,
    question_key: 'level-fund-nav',
    display_order: 8,
    main_chapter: { main_chapter_id: 5, asset_type: 'FUND' },
    question_type: 'SINGLE_CHOICE',
    prompt: '펀드 기준가(NAV)가 의미하는 것은?',
    choices: [
      { id: 'A', text: '예금 이자율' },
      { id: 'B', text: '펀드 자산의 1좌당 가치' },
      { id: 'C', text: '주식 1주의 액면가' },
      { id: 'D', text: '채권 만기일' },
    ],
    _correct_choice_id: 'B',
  },
]

const CORRECT_BY_QUESTION_ID = Object.fromEntries(
  ASSET_QUESTIONS_SEED.map((q) => [q.question_id, q._correct_choice_id]),
)

/**
 * @returns {{
 *   completed: boolean,
 *   attempt: object | null,
 * }}
 */
const readState = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { completed: false, attempt: null }
    const parsed = JSON.parse(raw)
    return {
      completed: Boolean(parsed.completed),
      attempt: parsed.attempt ?? null,
    }
  } catch {
    return { completed: false, attempt: null }
  }
}

/**
 * @param {{ completed: boolean, attempt: object | null }} state
 */
const writeState = (state) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

const nowIso = () => new Date().toISOString()

/**
 * 공개 문항 — 소단원 퀴즈와 동일한 optionsJson 형태
 * @param {object} raw
 * @returns {LevelTestQuestion}
 */
const mapQuestionPublic = (raw) => ({
  questionId: raw.question_id,
  questionKey: raw.question_key,
  questionType: raw.question_type,
  prompt: raw.prompt,
  optionsJson: (raw.choices || []).map((c) => ({
    key: c.id,
    label: c.text,
  })),
  mainChapterId: raw.main_chapter.main_chapter_id,
  assetType: raw.main_chapter.asset_type,
  displayOrder: raw.display_order,
})

/**
 * @param {object} rawAttempt
 * @returns {LevelTestAttempt}
 */
const mapAttempt = (rawAttempt) => ({
  attemptId: rawAttempt.attempt_id,
  status: rawAttempt.status,
  questions: (rawAttempt.questions || []).map(mapQuestionPublic),
  updatedAt: rawAttempt.updated_at ?? null,
})

/**
 * @param {object} raw
 * @returns {LevelTestSubmitResult}
 */
const mapSubmitResult = (raw) => ({
  attemptId: raw.attempt_id,
  status: raw.status,
  results: (raw.results || []).map((r) => ({
    questionId: r.question_id,
    mainChapterId: r.main_chapter_id,
    assetType: r.asset_type,
    isCorrect: r.is_correct,
  })),
  recommendations: (raw.recommendations || []).map((r) => ({
    mainChapterId: r.main_chapter_id,
    sourceType: r.source_type,
  })),
  cartCandidates: (raw.cart_candidates || []).map((c) => ({
    mainChapterId: c.main_chapter_id,
    assetType: c.asset_type,
  })),
})

/**
 * @param {number} attemptId
 */
const requireInProgressAttempt = (attemptId) => {
  const state = readState()
  const attempt = state.attempt
  if (!attempt || attempt.attempt_id !== attemptId) {
    throw new LevelTestApiError('ATTEMPT_NOT_FOUND', '응시를 찾을 수 없다.', 404)
  }
  if (attempt.status === 'COMPLETED' || state.completed) {
    throw new LevelTestApiError('ATTEMPT_ALREADY_SUBMITTED', '이미 제출된 응시다.', 409)
  }
  return { state, attempt }
}

/**
 * 레벨 테스트 완료 여부 조회 (목업)
 * @returns {Promise<{ data: { completed: boolean } }>}
 */
export const getLevelTestStatus = async () => {
  await delay(50)
  const state = readState()
  return { data: { completed: state.completed } }
}

/**
 * 로컬 저장된 응시·제출 결과 복원
 * @returns {{ completed: boolean, attempt: import('@/types/levelTest.js').LevelTestAttempt | null, submitResult: import('@/types/levelTest.js').LevelTestSubmitResult | null }}
 */
export const getStoredLevelTestSession = () => {
  const state = readState()
  if (!state.attempt) {
    return { completed: state.completed, attempt: null, submitResult: null }
  }
  return {
    completed: state.completed,
    attempt: mapAttempt(structuredClone(state.attempt)),
    submitResult: state.attempt.submit_result
      ? mapSubmitResult(structuredClone(state.attempt.submit_result))
      : null,
  }
}

/**
 * 레벨 테스트 응시 시작
 * POST /level-tests/attempts
 * @returns {Promise<{ data: LevelTestAttempt }>}
 */
export const startLevelTest = async () => {
  await delay()
  const state = readState()

  if (state.completed) {
    throw new LevelTestApiError('LEVEL_TEST_ALREADY_COMPLETED', '이미 레벨 테스트를 완료했다.', 409)
  }

  if (state.attempt && state.attempt.status === 'IN_PROGRESS') {
    return { data: mapAttempt(structuredClone(state.attempt)) }
  }

  if (!ASSET_QUESTIONS_SEED.length) {
    throw new LevelTestApiError(
      'LEVEL_TEST_QUESTION_SET_INVALID',
      '레벨 테스트 공개 문항이 없다.',
      422,
    )
  }

  const attempt = {
    attempt_id: 2001,
    status: 'IN_PROGRESS',
    updated_at: nowIso(),
    answers: {},
    submit_result: null,
    questions: ASSET_QUESTIONS_SEED.map(({ _correct_choice_id, ...publicFields }) =>
      structuredClone(publicFields),
    ),
  }

  writeState({ completed: false, attempt })
  return { data: mapAttempt(structuredClone(attempt)) }
}

/**
 * 레벨 테스트 답안 저장 (채점 없음)
 * PUT /level-tests/attempts/:attemptId/answers
 * @param {number} attemptId
 * @param {{ answers: LevelTestAnswerItem[] }} payload
 * @returns {Promise<{ data: LevelTestSaveAnswersResult }>}
 */
export const saveLevelTestAnswers = async (attemptId, payload) => {
  await delay()
  const { state, attempt } = requireInProgressAttempt(attemptId)

  const answers = payload?.answers
  if (!Array.isArray(answers) || answers.length === 0) {
    throw new LevelTestApiError('VALIDATION_ERROR', 'answers가 필요하다.', 400)
  }

  const questionIds = new Set((attempt.questions || []).map((q) => q.question_id))
  const nextAnswers = { ...(attempt.answers || {}) }

  for (const item of answers) {
    const questionId = item.questionId ?? item.question_id
    const selected = item.selectedChoiceIds ?? item.selected_choice_ids ?? []

    if (!questionIds.has(questionId)) {
      throw new LevelTestApiError(
        'VALIDATION_ERROR',
        `응시 문항에 포함되지 않은 question_id: ${questionId}`,
        400,
      )
    }
    if (!Array.isArray(selected) || selected.length === 0) {
      throw new LevelTestApiError('VALIDATION_ERROR', 'selected_choice_ids가 필요하다.', 400)
    }

    nextAnswers[questionId] = [...selected]
  }

  attempt.answers = nextAnswers
  attempt.updated_at = nowIso()
  writeState({ ...state, attempt })

  return {
    data: {
      attemptId: attempt.attempt_id,
      savedAnswerCount: Object.keys(nextAnswers).length,
      status: attempt.status,
      updatedAt: attempt.updated_at,
    },
  }
}

/**
 * 레벨 테스트 제출·채점
 * POST /level-tests/attempts/:attemptId/submit
 * - 필수 답안 모두 필요
 * - 재제출 시 최초 결과 반환
 * @param {number} attemptId
 * @returns {Promise<{ data: LevelTestSubmitResult }>}
 */
export const submitLevelTest = async (attemptId) => {
  await delay()
  const state = readState()
  const attempt = state.attempt

  if (!attempt || attempt.attempt_id !== attemptId) {
    throw new LevelTestApiError('ATTEMPT_NOT_FOUND', '응시를 찾을 수 없다.', 404)
  }

  // 동일 응시 재제출 → 최초 결과
  if (attempt.submit_result) {
    return { data: mapSubmitResult(structuredClone(attempt.submit_result)) }
  }

  if (attempt.status === 'COMPLETED' || state.completed) {
    throw new LevelTestApiError('ATTEMPT_ALREADY_SUBMITTED', '이미 제출된 응시다.', 409)
  }

  const requiredIds = (attempt.questions || []).map((q) => q.question_id)
  const answers = attempt.answers || {}
  const missing = requiredIds.filter((id) => !answers[id]?.length)
  if (missing.length) {
    throw new LevelTestApiError(
      'REQUIRED_ANSWERS_MISSING',
      '필수 답안이 모두 저장되지 않았다.',
      409,
    )
  }

  /** @type {object[]} */
  const results = []
  /** @type {Map<number, { wrong: boolean, assetType: string, correctCount: number, total: number }>} */
  const chapterOutcome = new Map()

  for (const question of attempt.questions) {
    const qid = question.question_id
    const selected = answers[qid] || []
    const correctId = CORRECT_BY_QUESTION_ID[qid]
    const isCorrect = selected.length === 1 && selected[0] === correctId
    const mainChapterId = question.main_chapter.main_chapter_id
    const assetType = question.main_chapter.asset_type

    results.push({
      question_id: qid,
      main_chapter_id: mainChapterId,
      asset_type: assetType,
      is_correct: isCorrect,
    })

    const prev = chapterOutcome.get(mainChapterId) ?? {
      wrong: false,
      assetType,
      correctCount: 0,
      total: 0,
    }
    chapterOutcome.set(mainChapterId, {
      wrong: prev.wrong || !isCorrect,
      assetType,
      correctCount: prev.correctCount + (isCorrect ? 1 : 0),
      total: prev.total + 1,
    })
  }

  /** @type {object[]} */
  const recommendations = []
  /** @type {object[]} */
  const cart_candidates = []

  for (const [mainChapterId, outcome] of chapterOutcome) {
    if (outcome.wrong) {
      recommendations.push({
        main_chapter_id: mainChapterId,
        source_type: 'LEVEL_TEST_WRONG',
      })
    } else {
      cart_candidates.push({
        main_chapter_id: mainChapterId,
        asset_type: outcome.assetType,
      })
    }
  }

  const submit_result = {
    attempt_id: attempt.attempt_id,
    status: 'COMPLETED',
    results,
    recommendations,
    cart_candidates,
  }

  attempt.status = 'COMPLETED'
  attempt.submit_result = submit_result
  attempt.updated_at = nowIso()
  writeState({ completed: true, attempt })

  return { data: mapSubmitResult(structuredClone(submit_result)) }
}

/**
 * 목업 상태 초기화 (로그아웃·개발용)
 */
export const resetLevelTestState = () => {
  localStorage.removeItem(STORAGE_KEY)
}
