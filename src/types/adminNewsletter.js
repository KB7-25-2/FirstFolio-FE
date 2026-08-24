/**
 * @typedef {'REVIEW' | 'PUBLISHED' | 'RETIRED'} AdminNewsletterStatus
 *
 * @typedef {object} AdminNewsletterSource
 * @property {number | null} documentId
 * @property {string | null} chunkKey
 * @property {string | null} sourceUrl
 * @property {string | null} evidenceText
 *
 * @typedef {object} AdminNewsletterFinancialWord
 * @property {string} term
 * @property {string} definition
 *
 * @typedef {object} AdminNewsletterIssue
 * @property {string} title
 * @property {string} summary
 * @property {string | null} relatedTerm
 * @property {AdminNewsletterSource[]} sources
 *
 * @typedef {object} AdminNewsletterStat
 * @property {string} label
 * @property {string} value
 *
 * @typedef {object} AdminNewsletter
 * @property {number} newsletterId
 * @property {string | null} weekStartDate
 * @property {string} headline
 * @property {AdminNewsletterFinancialWord[]} financialWords
 * @property {AdminNewsletterIssue[]} issues
 * @property {AdminNewsletterStat[]} stats
 * @property {AdminNewsletterStatus | string} status
 * @property {string | null} generationType
 * @property {string | null} publishedAt
 * @property {string | null} createdAt
 *
 * @typedef {object} AdminNewsletterStatusResult
 * @property {number} newsletterId
 * @property {string | null} weekStartDate
 * @property {AdminNewsletterStatus | string} status
 * @property {string | null} publishedAt
 */

export {}
