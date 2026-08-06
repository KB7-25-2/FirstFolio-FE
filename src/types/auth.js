/**
 * POST /auth/signup 요청
 * @typedef {object} SignupRequest
 * @property {string} nickname
 * @property {boolean} required_terms_agreed
 */

/**
 * POST /auth/signup 응답 data
 * @typedef {object} SignupResponse
 * @property {number} userId
 * @property {string} nickname
 * @property {string} roleCode
 * @property {import('@/router/onboardingRedirect.js').OnboardingStep} onboardingStep
 */

/**
 * POST /auth/login 응답 data
 * @typedef {object} LoginResponse
 * @property {{ userId: number, nickname: string, roleCode: string }} user
 * @property {import('@/router/onboardingRedirect.js').OnboardingStep} onboardingStep
 */

export {}
