import { ALLOW_DUPLICATE_POINT_GRANT, POINTS_PER_CORRECT } from '@/constants/quizPolicy.js'
import { StudyApiError } from './studyApiError.js'
import { delay } from './studyResponseUtils.js'
import {
  MOCK_CHAPTER_GAMES,
  MOCK_LEARNING_PROGRESS,
  MOCK_SCENARIO_POINT_GRANTED,
  MOCK_SCENARIOS,
} from './mock/studyMockData.js'
import {
  areAllLessonsCompleted,
  promoteNextCurriculumChapter,
  recomputeContinuePosition,
} from './mock/studyMockEngine.js'

/**
 * @typedef {import('@/types/study.js').ChapterGame} ChapterGame
 * @typedef {import('@/types/study.js').ScenarioDetail} ScenarioDetail
 * @typedef {import('@/types/study.js').ScenarioAnswerItem} ScenarioAnswerItem
 * @typedef {import('@/types/study.js').ScenarioAttemptResult} ScenarioAttemptResult
 */

export const getChapterGame = async (mainChapterId) => {
  await delay()
  const game = MOCK_CHAPTER_GAMES.get(Number(mainChapterId))
  if (!game) {
    throw new StudyApiError('CHAPTER_GAME_NOT_FOUND', '챕터 게임을 찾을 수 없다.', 404)
  }
  const unlocked = game.unlocked || areAllLessonsCompleted(Number(mainChapterId))
  if (!unlocked) {
    throw new StudyApiError('CHAPTER_GAME_LOCKED', '아직 잠긴 챕터 게임이다.', 403)
  }
  if (!game.unlocked) game.unlocked = true
  return { data: structuredClone(game) }
}

export const getScenario = async (scenarioId) => {
  await delay()
  const row = MOCK_SCENARIOS[Number(scenarioId)]
  if (!row) {
    throw new StudyApiError('SCENARIO_NOT_FOUND', '시나리오를 찾을 수 없다.', 404)
  }
  return { data: structuredClone(row) }
}

export const submitScenarioAttempt = async (payload) => {
  await delay(120)
  const { scenarioId, mainChapterId, answers } = payload
  if (!scenarioId || !mainChapterId || !answers?.length) {
    throw new StudyApiError('INVALID_ATTEMPT', '제출 데이터가 올바르지 않다.', 400)
  }

  const scenario = MOCK_SCENARIOS[scenarioId]
  if (!scenario) {
    throw new StudyApiError('SCENARIO_NOT_FOUND', '시나리오를 찾을 수 없다.', 404)
  }

  const stepMap = new Map(scenario.content.steps.map((step) => [step.stepId, step]))
  const gradedAnswers = []
  const wrongAnswers = []
  let correctCount = 0

  for (const answer of answers) {
    const step = stepMap.get(answer.stepId)
    if (!step) {
      throw new StudyApiError('STEP_NOT_FOUND', `스텝 ${answer.stepId}를 찾을 수 없다.`, 404)
    }
    const isCorrect = answer.selectedKey === step.correctKey
    if (isCorrect) correctCount += 1
    else {
      wrongAnswers.push({
        stepId: answer.stepId,
        selectedKey: answer.selectedKey,
        correctKey: step.correctKey,
      })
    }
    gradedAnswers.push({
      stepId: answer.stepId,
      selectedKey: answer.selectedKey,
      isCorrect,
    })
  }

  const totalCount = answers.length
  const quizScore = totalCount ? Math.round((correctCount / totalCount) * 100) : 0
  let pointsGranted = correctCount * POINTS_PER_CORRECT
  if (!ALLOW_DUPLICATE_POINT_GRANT && MOCK_SCENARIO_POINT_GRANTED.has(scenarioId)) {
    pointsGranted = 0
  } else if (pointsGranted > 0) {
    MOCK_SCENARIO_POINT_GRANTED.add(scenarioId)
  }

  const game = MOCK_CHAPTER_GAMES.get(Number(mainChapterId))
  if (game) {
    const summary = game.scenarios.find((s) => s.scenarioId === scenarioId)
    if (summary) summary.completed = true
  }

  const progressItem = MOCK_LEARNING_PROGRESS.find(
    (item) => item.mainChapterId === mainChapterId && item.entryType === 'SCENARIO_QUIZ',
  )
  if (progressItem) {
    progressItem.status = 'COMPLETED'
    progressItem.quizScore = quizScore
    progressItem.completedAt = progressItem.completedAt ?? new Date().toISOString()
    progressItem.updatedAt = new Date().toISOString()
  }

  promoteNextCurriculumChapter(mainChapterId)
  recomputeContinuePosition()

  return {
    data: {
      scenarioId,
      mainChapterId,
      totalCount,
      correctCount,
      quizScore,
      rewardStar: scenario.rewardStar,
      pointsGranted,
      wrongAnswers,
      gradedAnswers,
    },
  }
}
