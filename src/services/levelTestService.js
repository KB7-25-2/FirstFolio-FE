import { ApiError } from '@/api/user/errorHandler.js'
import {
  saveLevelTestAttemptAnswers,
  startLevelTestAttempt,
  submitLevelTestAttempt,
} from '@/api/user/levelTestApi.js'
import { pickField } from '@/utils/apiMapper.js'

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

/** OpenAPI QuizChoiceResponse: key/label — 구버전 id/text 호환 */
const mapChoice = (choice) => ({
  key: String(pickField(choice, 'key', 'id') ?? ''),
  label: String(pickField(choice, 'label', 'text') ?? ''),
})

const mapQuestion = (raw) => {
  const mainChapter = pickField(raw, 'mainChapter', 'main_chapter') ?? {}
  const questionId = Number(pickField(raw, 'questionId', 'question_id'))
  const choices = pickField(raw, 'choices', 'optionsJson', 'options_json') ?? []

  return {
    questionId,
    questionKey: String(pickField(raw, 'questionKey', 'question_key') ?? questionId),
    questionType: pickField(raw, 'questionType', 'question_type'),
    generationType: pickField(raw, 'generationType', 'generation_type'),
    prompt: String(pickField(raw, 'prompt') ?? ''),
    scenario: pickField(raw, 'scenario', 'scenarioJson', 'scenario_json') ?? null,
    optionsJson: (Array.isArray(choices) ? choices : []).map(mapChoice).filter((c) => c.key),
    mainChapterId: (() => {
      const v =
        pickField(mainChapter, 'mainChapterId', 'main_chapter_id') ??
        pickField(raw, 'mainChapterId', 'main_chapter_id')
      return v == null ? null : Number(v)
    })(),
    assetType:
      pickField(mainChapter, 'assetType', 'asset_type') ??
      pickField(raw, 'assetType', 'asset_type') ??
      null,
    displayOrder: (() => {
      const v = pickField(raw, 'displayOrder', 'display_order')
      return v == null ? null : Number(v)
    })(),
  }
}

const mapSavedAnswer = (raw) => {
  const questionId = Number(pickField(raw, 'questionId', 'question_id'))
  const answer = pickField(raw, 'answer', 'savedAnswer', 'saved_answer')
  const key =
    pickField(answer, 'key') ??
    (typeof answer === 'string' ? answer : null) ??
    pickField(raw, 'key')
  return {
    questionId,
    selectedChoiceIds: key ? [String(key)] : [],
  }
}

const mapAttempt = (raw) => ({
  attemptId: Number(pickField(raw, 'attemptId', 'attempt_id')),
  status: pickField(raw, 'status'),
  questionCount: Number(pickField(raw, 'questionCount', 'question_count') ?? 0),
  questions: (pickField(raw, 'questions') ?? []).map(mapQuestion),
  savedAnswers: (pickField(raw, 'answers', 'savedAnswers', 'saved_answers') ?? []).map(
    mapSavedAnswer,
  ),
  updatedAt: pickField(raw, 'updatedAt', 'updated_at') ?? null,
})

const mapSubmitResult = (raw) => ({
  attemptId: Number(pickField(raw, 'attemptId', 'attempt_id')),
  status: pickField(raw, 'status'),
  results: (pickField(raw, 'questionResults', 'question_results') ?? []).map((result) => ({
    questionId: Number(pickField(result, 'questionId', 'question_id')),
    mainChapterId: Number(pickField(result, 'mainChapterId', 'main_chapter_id')),
    assetType: pickField(result, 'assetType', 'asset_type'),
    isCorrect: Boolean(pickField(result, 'isCorrect', 'is_correct')),
  })),
  chapterResults: (pickField(raw, 'chapterResults', 'chapter_results') ?? []).map((result) => ({
    mainChapterId: Number(pickField(result, 'mainChapterId', 'main_chapter_id')),
    assetType: pickField(result, 'assetType', 'asset_type'),
    totalCount: Number(pickField(result, 'totalCount', 'total_count') ?? 0),
    correctCount: Number(pickField(result, 'correctCount', 'correct_count') ?? 0),
    allCorrect: Boolean(pickField(result, 'allCorrect', 'all_correct')),
  })),
  recommendations: (pickField(raw, 'recommendations') ?? []).map((item) => ({
    mainChapterId: Number(pickField(item, 'mainChapterId', 'main_chapter_id')),
    sourceType: pickField(item, 'sourceType', 'source_type'),
  })),
  cartCandidates: (pickField(raw, 'cartCandidates', 'cart_candidates') ?? []).map((item) => ({
    mainChapterId: Number(pickField(item, 'mainChapterId', 'main_chapter_id')),
    assetType: pickField(item, 'assetType', 'asset_type'),
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

export const getLevelTestStatus = async () => ({
  data: { completed: Boolean(readSession().submitResult) },
})

export const startLevelTest = async () => {
  const response = await startLevelTestAttempt()
  const attempt = mapAttempt(unwrap(response))
  const answers = Object.fromEntries(
    attempt.savedAnswers
      .filter((item) => item.selectedChoiceIds.length && item.questionId)
      .map((item) => [item.questionId, item.selectedChoiceIds]),
  )
  writeSession({ attempt, answers, submitResult: null })
  return { data: attempt }
}

export const saveLevelTestAnswers = async (attemptId, payload) => {
  const answerItems = payload?.answers ?? []
  // Live DTO는 snake_case (OpenAPI camelCase와 불일치 가능)
  const body = {
    answers: answerItems.map((item) => ({
      // 라이브 BE: question_id (snake_case)
      question_id: item.questionId,
      answer: { key: item.selectedChoiceIds?.[0] },
    })),
  }
  const response = await saveLevelTestAttemptAnswers(attemptId, body)
  const raw = unwrap(response)
  const data = {
    attemptId: Number(pickField(raw, 'attemptId', 'attempt_id')),
    savedAnswerCount: Number(pickField(raw, 'savedAnswerCount', 'saved_answer_count') ?? 0),
    answeredCount: Number(pickField(raw, 'answeredCount', 'answered_count') ?? 0),
    totalCount: Number(pickField(raw, 'totalCount', 'total_count') ?? 0),
    status: pickField(raw, 'status'),
    updatedAt: pickField(raw, 'updatedAt', 'updated_at'),
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
