/**
 * GET /leaderboard 항목
 * @typedef {object} LeaderboardItem
 * @property {number} rank
 * @property {string} nickname
 * @property {number} weeklyScore
 */

/**
 * GET /leaderboard 응답
 * @typedef {object} LeaderboardSnapshot
 * @property {string} snapshotDate
 * @property {string} weekStartDate
 * @property {LeaderboardItem[]} items
 * @property {LeaderboardItem | null} myRank
 * @property {string | null} nextCursor
 */

export {}
