import { ApiError } from '@/api/user/errorHandler.js'
import {
  saveLevelTestAttemptAnswers,
  startLevelTestAttempt,
  submitLevelTestAttempt,
} from '@/api/user/levelTestApi.js'

const SESSION_KEY = 'level_test_api_session'

export class LevelTestApiError extends ApiError {
  constructor(code, message, status = 400, data = null) {
    super(message, status, data, code)
    this.name = 'LevelTestApiError'
  }
}

const readSession = () => {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY)) ?? {}
  } catch {
    return {}
  }
}

const writeSession = (patch) => {
  const current = readSession()
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({ ...current, ...patch }))
}

const unwrap = (response) => response.data?.data ?? response.data

const mapQuestion = (raw) => ({
  questionId: raw.question_id,
  questionKey: raw.question_key ?? String(raw.question_id),
  questionType: raw.question_type,
  generationType: raw.generation_type,
  prompt: raw.prompt,
  scenario: raw.scenario ?? null,
  optionsJson: (raw.choices ?? []).map((choice) => ({
    key: choice.id,
    label: choice.text,
  })),
  mainChapterId: raw.main_chapter?.main_chapter_id,
  assetType: raw.main_chapter?.asset_type,
  displayOrder: raw.display_order,
})

const mapSavedAnswer = (raw) => ({
  questionId: raw.question_id,
  selectedChoiceIds: raw.answer?.key ? [raw.answer.key] : [],
})

const mapAttempt = (raw) => ({
  attemptId: raw.attempt_id,
  status: raw.status,
  questionCount: raw.question_count,
  questions: (raw.questions ?? []).map(mapQuestion),
  savedAnswers: (raw.answers ?? []).map(mapSavedAnswer),
  updatedAt: null,
})

const mapSubmitResult = (raw) => ({
  attemptId: raw.attempt_id,
  status: raw.status,
  results: (raw.question_results ?? []).map((result) => ({
    questionId: result.question_id,
    mainChapterId: result.main_chapter_id,
    assetType: result.asset_type,
    isCorrect: result.is_correct,
  })),
  chapterResults: (raw.chapter_results ?? []).map((result) => ({
    mainChapterId: result.main_chapter_id,
    assetType: result.asset_type,
    totalCount: result.total_count,
    correctCount: result.correct_count,
    allCorrect: result.all_correct,
  })),
  recommendations: (raw.recommendations ?? []).map((item) => ({
    mainChapterId: item.main_chapter_id,
    sourceType: item.source_type,
  })),
  cartCandidates: (raw.cart_candidates ?? []).map((item) => ({
    mainChapterId: item.main_chapter_id,
    assetType: item.asset_type,
  })),
})

export const getStoredLevelTestSession = () => {
  const session = readSession()
  return {
    completed: Boolean(session.submitResult),
    attempt: session.attempt ?? null,
    answers: session.answers ?? {},
    submitResult: session.submitResult ?? null,
  }
}

// 별도 상태 조회 API가 없으므로 현재 브라우저 세션에 저장된 서버 응답만 확인한다.
export const getLevelTestStatus = async () => ({
  data: { completed: Boolean(readSession().submitResult) },
})

export const startLevelTest = async () => {
  const response = await startLevelTestAttempt()
  const attempt = mapAttempt(unwrap(response))
  const answers = Object.fromEntries(
    attempt.savedAnswers
      .filter((item) => item.selectedChoiceIds.length)
      .map((item) => [item.questionId, item.selectedChoiceIds]),
  )
  writeSession({ attempt, answers, submitResult: null })
  return { data: attempt }
}

export const saveLevelTestAnswers = async (attemptId, payload) => {
  const answerItems = payload?.answers ?? []
  const body = {
    answers: answerItems.map((item) => ({
      question_id: item.questionId,
      answer: { key: item.selectedChoiceIds?.[0] },
    })),
  }
  const response = await saveLevelTestAttemptAnswers(attemptId, body)
  const raw = unwrap(response)
  const data = {
    attemptId: raw.attempt_id,
    savedAnswerCount: raw.saved_answer_count,
    answeredCount: raw.answered_count,
    totalCount: raw.total_count,
    status: raw.status,
    updatedAt: raw.updated_at,
  }
  const currentAnswers = readSession().answers ?? {}
  const answers = { ...currentAnswers }
  answerItems.forEach((item) => {
    answers[item.questionId] = [...item.selectedChoiceIds]
  })
  writeSession({ answers })
  return { data }
}

export const submitLevelTest = async (attemptId) => {
  const response = await submitLevelTestAttempt(attemptId)
  const data = mapSubmitResult(unwrap(response))
  const current = readSession()
  writeSession({
    submitResult: data,
    attempt: current.attempt ? { ...current.attempt, status: data.status } : null,
  })
  return { data }
}

export const resetLevelTestState = () => {
  sessionStorage.removeItem(SESSION_KEY)
}
