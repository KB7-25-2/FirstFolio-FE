import { StudyApiError } from './studyApiError.js'

/**
 * @deprecated getChapterGame/getScenario는 더 이상 사용하지 않습니다.
 * 대단원 퀴즈는 startMainChapterQuizAttempt (quizStudyService) 로 처리합니다.
 */
export const getChapterGame = async () => {
  throw new StudyApiError('CHAPTER_GAME_NOT_FOUND', '더 이상 사용하지 않는 API입니다.', 410)
}

export const getScenario = async () => {
  throw new StudyApiError('SCENARIO_NOT_FOUND', '더 이상 사용하지 않는 API입니다.', 410)
}

export const submitScenarioAttempt = async () => {
  throw new StudyApiError('INVALID_ATTEMPT', '더 이상 사용하지 않는 API입니다.', 410)
}
