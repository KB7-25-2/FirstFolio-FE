import {
  gradeQuizAnswer as gradeQuizAnswerApi,
  startMainChapterQuizAttempt as startMainChapterQuizAttemptApi,
  startSubChapterQuizAttempt as startSubChapterQuizAttemptApi,
} from '@/api/user/quizApi.js'
import { parseApiError } from '@/api/user/errorHandler.js'
import { StudyApiError } from './studyApiError.js'
import { unwrap } from './studyResponseUtils.js'
import { mapQuizAnswerGrading, mapQuizAttemptStart } from './mappers/quizMapper.js'

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
