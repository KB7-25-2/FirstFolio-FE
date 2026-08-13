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

const pick = (obj, ...keys) => {
  for (const key of keys) {
    if (obj?.[key] !== undefined && obj?.[key] !== null) return obj[key]
  }
  return undefined
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

const mapChoice = (choice) => ({
  key: pick(choice, 'key', 'id'),
  label: pick(choice, 'label', 'text'),
})

const mapQuestion = (raw) => {
  const questionId = pick(raw, 'questionId', 'question_id')
  const saved = raw.savedAnswer ?? raw.saved_answer
  return {
    questionId,
    questionKey: pick(raw, 'questionKey', 'question_key') ?? String(questionId),
    questionType: pick(raw, 'questionType', 'question_type'),
    generationType: pick(raw, 'generationType', 'generation_type'),
    prompt: raw.prompt,
    scenario: raw.scenario ?? null,
    optionsJson: (raw.choices ?? []).map(mapChoice),
    mainChapterId: pick(
      raw.mainChapter ?? raw.main_chapter ?? {},
      'mainChapterId',
      'main_chapter_id',
    ),
    assetType: pick(raw.mainChapter ?? raw.main_chapter ?? {}, 'assetType', 'asset_type'),
    displayOrder: pick(raw, 'displayOrder', 'display_order'),
    savedAnswerKey: saved?.key ?? null,
  }
}

const mapSavedAnswer = (raw, fallbackQuestionId) => {
  const questionId = pick(raw, 'questionId', 'question_id') ?? fallbackQuestionId
  const key = raw.answer?.key ?? raw.key ?? null
  return {
    questionId,
    selectedChoiceIds: key ? [key] : [],
  }
}

const mapAttempt = (raw) => {
  const questions = (raw.questions ?? []).map(mapQuestion)
  const fromAnswers = (raw.answers ?? [])
    .map((row, index) => mapSavedAnswer(row, questions[index]?.questionId))
    .filter((row) => row.questionId != null && row.selectedChoiceIds.length)
  const fromQuestions = questions
    .filter((q) => q.savedAnswerKey)
    .map((q) => ({ questionId: q.questionId, selectedChoiceIds: [q.savedAnswerKey] }))

  return {
    attemptId: pick(raw, 'attemptId', 'attempt_id'),
    status: raw.status,
    questionCount: pick(raw, 'questionCount', 'question_count'),
    questions,
    savedAnswers: fromAnswers.length ? fromAnswers : fromQuestions,
    updatedAt: pick(raw, 'updatedAt', 'updated_at') ?? null,
  }
}

const mapSubmitResult = (raw) => ({
  attemptId: pick(raw, 'attemptId', 'attempt_id'),
  status: raw.status,
  results: (raw.questionResults ?? raw.question_results ?? []).map((result) => ({
    questionId: pick(result, 'questionId', 'question_id'),
    mainChapterId: pick(result, 'mainChapterId', 'main_chapter_id'),
    assetType: pick(result, 'assetType', 'asset_type'),
    isCorrect: pick(result, 'isCorrect', 'is_correct'),
  })),
  chapterResults: (raw.chapterResults ?? raw.chapter_results ?? []).map((result) => ({
    mainChapterId: pick(result, 'mainChapterId', 'main_chapter_id'),
    assetType: pick(result, 'assetType', 'asset_type'),
    totalCount: pick(result, 'totalCount', 'total_count'),
    correctCount: pick(result, 'correctCount', 'correct_count'),
    allCorrect: pick(result, 'allCorrect', 'all_correct'),
  })),
  recommendations: (raw.recommendations ?? []).map((item) => ({
    mainChapterId: pick(item, 'mainChapterId', 'main_chapter_id'),
    sourceType: pick(item, 'sourceType', 'source_type'),
  })),
  cartCandidates: (raw.cartCandidates ?? raw.cart_candidates ?? []).map((item) => ({
    mainChapterId: pick(item, 'mainChapterId', 'main_chapter_id'),
    assetType: pick(item, 'assetType', 'asset_type'),
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
      // 라이브 BE: question_id (snake_case)
      question_id: item.questionId,
      answer: { key: item.selectedChoiceIds?.[0] },
    })),
  }
  const response = await saveLevelTestAttemptAnswers(attemptId, body)
  const raw = unwrap(response)
  const data = {
    attemptId: pick(raw, 'attemptId', 'attempt_id'),
    savedAnswerCount: pick(raw, 'savedAnswerCount', 'saved_answer_count'),
    answeredCount: pick(raw, 'answeredCount', 'answered_count'),
    totalCount: pick(raw, 'totalCount', 'total_count'),
    status: raw.status,
    updatedAt: pick(raw, 'updatedAt', 'updated_at'),
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
