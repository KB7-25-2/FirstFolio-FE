/**
 * 레벨 테스트(금융 기초 진단) 타입
 * 문항 UI 필드는 소단원/대단원 퀴즈(QuizQuestion)와 동일하게 optionsJson 사용
 * 응시 문항·채점 결과는 단원당 개수와 무관한 리스트로 다룬다
 *
 * @typedef {import('@/types/study.js').QuizOption} QuizOption
 * @typedef {import('@/types/study.js').QuizQuestionType} QuizQuestionType
 *
 * @typedef {'DEPOSIT_SAVINGS' | 'BOND' | 'STOCK' | 'FUND'} AssetType
 *
 * @typedef {'IN_PROGRESS' | 'GRADED'} LevelTestAttemptStatus
 *
 * @typedef {object} LevelTestQuestion
 * @property {number} questionId
 * @property {string} questionKey
 * @property {QuizQuestionType} questionType
 * @property {string} prompt
 * @property {QuizOption[]} optionsJson
 * @property {number} mainChapterId
 * @property {AssetType} assetType
 * @property {number} displayOrder
 *
 * @typedef {object} LevelTestAttempt
 * @property {number} attemptId
 * @property {LevelTestAttemptStatus} status
 * @property {LevelTestQuestion[]} questions
 * @property {LevelTestAnswerItem[]} savedAnswers
 * @property {string | null} updatedAt
 *
 * @typedef {object} LevelTestAnswerItem
 * @property {number} questionId
 * @property {string[]} selectedChoiceIds
 *
 * @typedef {object} LevelTestSaveAnswersResult
 * @property {number} attemptId
 * @property {number} savedAnswerCount
 * @property {LevelTestAttemptStatus} status
 * @property {string} updatedAt
 *
 * @typedef {object} LevelTestQuestionResult
 * @property {number} questionId
 * @property {number} mainChapterId
 * @property {AssetType} assetType
 * @property {boolean} isCorrect
 *
 * @typedef {object} LevelTestRecommendation
 * @property {number} mainChapterId
 * @property {'LEVEL_TEST_WRONG'} sourceType
 *
 * @typedef {object} LevelTestCartCandidate
 * @property {number} mainChapterId
 * @property {AssetType} assetType
 *
 * @typedef {object} LevelTestSubmitResult
 * @property {number} attemptId
 * @property {'GRADED'} status
 * @property {{mainChapterId: number, assetType: AssetType, totalCount: number, correctCount: number, allCorrect: boolean}[]} chapterResults
 * @property {LevelTestQuestionResult[]} results
 * @property {LevelTestRecommendation[]} recommendations
 * @property {LevelTestCartCandidate[]} cartCandidates
 */

export {}
