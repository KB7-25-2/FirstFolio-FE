/**
 * GET /users/me 프로필
 * @typedef {object} UserProfile
 * @property {number} userId
 * @property {string} email
 * @property {string} nickname
 * @property {string} roleCode
 * @property {boolean} newsletterOptIn
 * @property {number} pointBalance
 * @property {string} createdAt
 */

/**
 * PATCH /users/me 요청 (camelCase — 서비스 입력)
 * @typedef {object} UpdateUserProfileInput
 * @property {string} [nickname]
 * @property {boolean} [newsletterOptIn]
 */

/**
 * PATCH /users/me 응답 data
 * @typedef {object} UpdateUserProfileResult
 * @property {number} userId
 * @property {string} nickname
 * @property {boolean} newsletterOptIn
 * @property {string} updatedAt
 */

export {}
