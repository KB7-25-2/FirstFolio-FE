import { ALLOW_DUPLICATE_POINT_GRANT, POINTS_PER_CORRECT } from '@/constants/quizPolicy.js'
import {
  gradeQuizAnswer as gradeQuizAnswerApi,
  startMainChapterQuizAttempt as startMainChapterQuizAttemptApi,
  startSubChapterQuizAttempt as startSubChapterQuizAttemptApi,
} from '@/api/user/quizApi.js'
import { parseApiError } from '@/api/user/errorHandler.js'
import { StudyApiError } from './studyApiError.js'
import { delay, unwrap } from './studyResponseUtils.js'
import { mapQuizAnswerGrading, mapQuizAttemptStart } from './mappers/quizMapper.js'
import {
  MOCK_CHAPTER_GAMES,
  MOCK_LEARNING_PROGRESS,
  MOCK_QUIZ_POINT_GRANTED,
  MOCK_QUIZ_QUESTIONS,
  MOCK_WRONG_ANSWER_LOG,
} from './mock/studyMockData.js'
import {
  areAllLessonsCompleted,
  recomputeContinuePosition,
  syncCurriculumProgressPercent,
} from './mock/studyMockEngine.js'

/**
 * @typedef {import('@/types/study.js').QuizQuestion} QuizQuestion
 * @typedef {import('@/types/study.js').QuizAnswerItem} QuizAnswerItem
 * @typedef {import('@/types/study.js').QuizAttemptResult} QuizAttemptResult
 */

export {
  mapQuizAttemptQuestion,
  mapQuizAttemptStart,
  mapQuizAnswerGrading,
} from './mappers/quizMapper.js'

export const startSubChapterQuizAttempt = async (subChapterId) => {
  try {
    const response = await startSubChapterQuizAttemptApi(subChapterId)
    return { data: mapQuizAttemptStart(unwrap(response)) }
  } catch (error) {
    const parsed = parseApiError(error)
    throw new StudyApiError(
      parsed?.code ?? 'QUIZ_START_FAILED',
      parsed?.message ?? '퀴즈를 시작하지 못했습니다.',
      parsed?.status ?? 500,
    )
  }
}

export const startMainChapterQuizAttempt = async (mainChapterId) => {
  const response = await startMainChapterQuizAttemptApi(mainChapterId)
  return { data: mapQuizAttemptStart(unwrap(response)) }
}

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

  const mainChapterId = progressItem?.mainChapterId
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
