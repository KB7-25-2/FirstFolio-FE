/**
 * 커리큘럼 초안(온보딩 담기) 타입
 *
 * @typedef {'REQUIRED' | 'LEVEL_TEST_WRONG' | 'CART'} CurriculumDraftSourceType
 *
 * @typedef {object} CurriculumDraftItem
 * @property {number} mainChapterId
 * @property {string} title
 * @property {CurriculumDraftSourceType} sourceType
 * @property {number} displayOrder
 * @property {boolean} removable
 *
 * @typedef {object} CurriculumCartCandidate
 * @property {number} mainChapterId
 * @property {string} title
 *
 * @typedef {object} CurriculumDraft
 * @property {CurriculumDraftItem[]} items
 * @property {CurriculumCartCandidate[]} cartCandidates
 * @property {CurriculumCartCandidate[]} [recommendationCandidates]
 *
 * @typedef {object} CurriculumConfirmItem
 * @property {number} mainChapterId
 * @property {string} title
 * @property {CurriculumDraftSourceType} sourceType
 * @property {number} displayOrder
 *
 * @typedef {object} CurriculumConfirmResult
 * @property {'CONFIRMED'} status
 * @property {CurriculumConfirmItem[]} items
 * @property {string} confirmedAt
 */

export {}
