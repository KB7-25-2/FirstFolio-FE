/**
 * @typedef {object} AdminNewsItem
 * @property {number} financialNewsId
 * @property {number | null} knowledgeContentId
 * @property {string} title
 * @property {string} summary
 * @property {string | null} imageUrl
 * @property {string} sourceName
 * @property {string} sourceUrl
 * @property {string | null} sourcePublishedAt
 * @property {string | null} collectedAt
 * @property {string | null} publishedAt
 *
 * @typedef {object} AdminNewsPatchPayload
 * @property {string} [title]
 * @property {string} [summary]
 * @property {string | null} [imageUrl]
 *
 * @typedef {object} AdminNewsDeleteResult
 * @property {number} financialNewsId
 */

export {}
