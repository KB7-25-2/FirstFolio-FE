/**
 * GET /daily-quests/leaderboard 항목
 * @typedef {object} LeaderboardItem
 * @property {number} rank
 * @property {string} nickname
 * @property {number} score
 */

/**
 * GET /daily-quests/leaderboard 응답
 * @typedef {object} DailyQuestLeaderboard
 * @property {string} questDate
 * @property {string} calculatedAt
 * @property {LeaderboardItem[]} items
 * @property {{ rank: number, score: number } | null} myRank
 * @property {string | null} nextCursor
 */

export {}
