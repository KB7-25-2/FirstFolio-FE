/**
 * 레벨 테스트 mock 서비스
 * POST /level-tests/attempts (시작)
 * TODO: API 연동 시 levelTestApi로 교체
 */

/**
 * @typedef {import('@/types/levelTest.js').LevelTestAttempt} LevelTestAttempt
 * @typedef {import('@/types/levelTest.js').LevelTestQuestion} LevelTestQuestion
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

/** ASSET 대단원만 — FOUNDATION(포트폴리오 기초) 제외 */
const ASSET_QUESTIONS_SEED = [
  {
    question_id: 1001,
    main_chapter: { main_chapter_id: 2, asset_type: 'DEPOSIT_SAVINGS' },
    question_type: 'SINGLE_CHOICE',
    prompt: '금리가 오르면 예금 이자는?',
    choices: [
      { id: 'A', text: '대체로 늘어난다' },
      { id: 'B', text: '대체로 줄어든다' },
      { id: 'C', text: '항상 그대로다' },
      { id: 'D', text: '예금과 관계없다' },
    ],
    // 제출 전 응답에는 포함하지 않음
    _correct_choice_id: 'A',
  },
  {
    question_id: 1002,
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
    question_id: 1003,
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
    question_id: 1004,
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
]

/**
 * @returns {{ completed: boolean, attempt: object | null }}
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

/**
 * @param {object} raw
 * @returns {LevelTestQuestion}
 */
const mapQuestionPublic = (raw) => ({
  questionId: raw.question_id,
  mainChapter: {
    mainChapterId: raw.main_chapter.main_chapter_id,
    assetType: raw.main_chapter.asset_type,
  },
  questionType: raw.question_type,
  prompt: raw.prompt,
  choices: raw.choices.map((c) => ({ id: c.id, text: c.text })),
})

/**
 * @param {object} rawAttempt
 * @returns {LevelTestAttempt}
 */
const mapAttempt = (rawAttempt) => ({
  attemptId: rawAttempt.attempt_id,
  status: rawAttempt.status,
  questions: (rawAttempt.questions || []).map(mapQuestionPublic),
})

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
 * 레벨 테스트 응시 시작
 * POST /level-tests/attempts
 * - 미완료 응시가 있으면 기존 응시 반환
 * - 완료했으면 409 LEVEL_TEST_ALREADY_COMPLETED
 * - 정답·해설은 포함하지 않음
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

  if (ASSET_QUESTIONS_SEED.length !== 4) {
    throw new LevelTestApiError(
      'LEVEL_TEST_QUESTION_SET_INVALID',
      '대단원별 공개 문항 구성이 올바르지 않다.',
      422,
    )
  }

  const attempt = {
    attempt_id: 2001,
    status: 'IN_PROGRESS',
    questions: ASSET_QUESTIONS_SEED.map(({ _correct_choice_id, ...publicFields }) =>
      structuredClone(publicFields),
    ),
  }

  writeState({ completed: false, attempt })
  return { data: mapAttempt(structuredClone(attempt)) }
}

/**
 * 레벨 테스트 완료 처리 (목업 — 이후 제출 API에서 사용)
 * @returns {Promise<{ data: { completed: boolean } }>}
 */
export const completeLevelTest = async () => {
  await delay(50)
  const state = readState()
  if (state.attempt) {
    state.attempt.status = 'COMPLETED'
  }
  writeState({ completed: true, attempt: state.attempt })
  return { data: { completed: true } }
}

/**
 * 목업 상태 초기화 (로그아웃·개발용)
 */
export const resetLevelTestState = () => {
  localStorage.removeItem(STORAGE_KEY)
}
