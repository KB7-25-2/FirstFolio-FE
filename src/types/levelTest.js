/**
 * 레벨 테스트(금융 기초 진단) 타입
 *
 * @typedef {'DEPOSIT_SAVINGS' | 'BOND' | 'STOCK' | 'FUND'} AssetType
 *
 * @typedef {'IN_PROGRESS' | 'COMPLETED'} LevelTestAttemptStatus
 *
 * @typedef {object} LevelTestChoice
 * @property {string} id
 * @property {string} text
 *
 * @typedef {object} LevelTestMainChapter
 * @property {number} mainChapterId
 * @property {AssetType} assetType
 *
 * @typedef {object} LevelTestQuestion
 * @property {number} questionId
 * @property {LevelTestMainChapter} mainChapter
 * @property {'SINGLE_CHOICE'} questionType
 * @property {string} prompt
 * @property {LevelTestChoice[]} choices
 *
 * @typedef {object} LevelTestAttempt
 * @property {number} attemptId
 * @property {LevelTestAttemptStatus} status
 * @property {LevelTestQuestion[]} questions
 */

export {}
