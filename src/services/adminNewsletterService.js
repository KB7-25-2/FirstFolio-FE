/**
 * 관리자 뉴스레터 검수
 * — GET /admin/newsletters?status=
 * — GET /admin/newsletters/{id}
 * — POST /admin/newsletters/{id}/publish  (REVIEW → PUBLISHED)
 * — POST /admin/newsletters/{id}/retire   (PUBLISHED → RETIRED)
 */

import { parseApiError } from '@/api/user/errorHandler.js'
import {
  getAdminNewsletterDetail,
  getAdminNewsletters,
  publishAdminNewsletter,
  retireAdminNewsletter,
} from '@/api/admin/newsletterApi.js'
import { pickField, unwrapData } from '@/utils/apiMapper.js'

/**
 * @typedef {import('@/types/adminNewsletter.js').AdminNewsletter} AdminNewsletter
 * @typedef {import('@/types/adminNewsletter.js').AdminNewsletterStatus} AdminNewsletterStatus
 * @typedef {import('@/types/adminNewsletter.js').AdminNewsletterStatusResult} AdminNewsletterStatusResult
 * @typedef {import('@/types/adminNewsletter.js').AdminNewsletterFinancialWord} AdminNewsletterFinancialWord
 * @typedef {import('@/types/adminNewsletter.js').AdminNewsletterIssue} AdminNewsletterIssue
 * @typedef {import('@/types/adminNewsletter.js').AdminNewsletterStat} AdminNewsletterStat
 * @typedef {import('@/types/adminNewsletter.js').AdminNewsletterSource} AdminNewsletterSource
 */

export const NEWSLETTER_STATUS_OPTIONS = [
  { value: 'REVIEW', label: '검수 대기' },
  { value: 'PUBLISHED', label: '게시됨' },
  { value: 'RETIRED', label: '폐기됨' },
]

export const NEWSLETTER_STATUS_LABELS = {
  REVIEW: '검수 대기',
  PUBLISHED: '게시됨',
  RETIRED: '폐기됨',
}

export const DEFAULT_NEWSLETTER_STATUS = 'REVIEW'

/** @param {unknown} raw @returns {AdminNewsletterSource} */
const mapSource = (raw) => ({
  documentId: (() => {
    const v = pickField(raw, 'documentId', 'document_id')
    return v == null ? null : Number(v)
  })(),
  chunkKey: (() => {
    const v = pickField(raw, 'chunkKey', 'chunk_key')
    return v == null ? null : String(v)
  })(),
  sourceUrl: (() => {
    const v = pickField(raw, 'sourceUrl', 'source_url')
    return v == null ? null : String(v)
  })(),
  evidenceText: (() => {
    const v = pickField(raw, 'evidenceText', 'evidence_text')
    return v == null ? null : String(v)
  })(),
})

/** @param {unknown} raw @returns {AdminNewsletterFinancialWord} */
const mapFinancialWord = (raw) => ({
  term: String(pickField(raw, 'term') ?? ''),
  definition: String(pickField(raw, 'definition') ?? ''),
})

/** @param {unknown} raw @returns {AdminNewsletterIssue} */
const mapIssue = (raw) => {
  const sources = pickField(raw, 'sources')
  return {
    title: String(pickField(raw, 'title') ?? ''),
    summary: String(pickField(raw, 'summary') ?? ''),
    relatedTerm: (() => {
      const v = pickField(raw, 'relatedTerm', 'related_term')
      return v == null ? null : String(v)
    })(),
    sources: Array.isArray(sources) ? sources.map(mapSource) : [],
  }
}

/** @param {unknown} raw @returns {AdminNewsletterStat} */
const mapStat = (raw) => ({
  label: String(pickField(raw, 'label') ?? ''),
  value: String(pickField(raw, 'value') ?? ''),
})

/** @param {unknown} raw @returns {AdminNewsletter} */
export const mapAdminNewsletter = (raw) => {
  const financialWords = pickField(raw, 'financialWordsJson', 'financial_words_json')
  // OpenAPI 스키마가 issuesJson(camel)과 stats_json(snake)을 혼용한다.
  const issues = pickField(raw, 'issuesJson', 'issues_json', 'issues')
  const stats = pickField(raw, 'statsJson', 'stats_json', 'stats')

  return {
    newsletterId: Number(pickField(raw, 'newsletterId', 'newsletter_id') ?? 0),
    weekStartDate: pickField(raw, 'weekStartDate', 'week_start_date') ?? null,
    headline: String(pickField(raw, 'headline') ?? ''),
    financialWords: Array.isArray(financialWords) ? financialWords.map(mapFinancialWord) : [],
    issues: Array.isArray(issues) ? issues.map(mapIssue) : [],
    stats: Array.isArray(stats) ? stats.map(mapStat) : [],
    status: String(pickField(raw, 'status') ?? 'REVIEW'),
    generationType: (() => {
      const v = pickField(raw, 'generationType', 'generation_type')
      return v == null ? null : String(v)
    })(),
    publishedAt: pickField(raw, 'publishedAt', 'published_at') ?? null,
    createdAt: pickField(raw, 'createdAt', 'created_at') ?? null,
  }
}

/** @param {unknown} data @returns {AdminNewsletter[]} */
const mapList = (data) => {
  const root = data && typeof data === 'object' ? data : {}
  const items = Array.isArray(root.items) ? root.items : Array.isArray(root) ? root : []
  return items.map(mapAdminNewsletter)
}

/** @param {unknown} raw @returns {AdminNewsletterStatusResult} */
export const mapNewsletterStatusResult = (raw) => ({
  newsletterId: Number(pickField(raw, 'newsletterId', 'newsletter_id') ?? 0),
  weekStartDate: pickField(raw, 'weekStartDate', 'week_start_date') ?? null,
  status: String(pickField(raw, 'status') ?? ''),
  publishedAt: pickField(raw, 'publishedAt', 'published_at') ?? null,
})

/**
 * GET /admin/newsletters — status는 필수 (REVIEW | PUBLISHED | RETIRED). 전체 조회 API 없음.
 * @param {{ status: AdminNewsletterStatus }} params
 * @returns {Promise<AdminNewsletter[]>}
 */
export const fetchAdminNewsletters = async (params = {}) => {
  const status = params.status || DEFAULT_NEWSLETTER_STATUS
  if (!NEWSLETTER_STATUS_LABELS[status]) {
    const error = new Error('status는 REVIEW, PUBLISHED, RETIRED 중 하나여야 합니다.')
    error.code = 'INVALID_REQUEST'
    error.status = 400
    throw error
  }
  try {
    const response = await getAdminNewsletters({ status })
    return mapList(unwrapData(response))
  } catch (error) {
    throw parseApiError(error)
  }
}

/**
 * GET /admin/newsletters/{id}
 * @param {number} newsletterId
 * @returns {Promise<AdminNewsletter>}
 */
export const fetchAdminNewsletterDetail = async (newsletterId) => {
  try {
    const response = await getAdminNewsletterDetail(newsletterId)
    return mapAdminNewsletter(unwrapData(response))
  } catch (error) {
    throw parseApiError(error)
  }
}

/**
 * POST /admin/newsletters/{id}/publish
 * @param {number} newsletterId
 * @returns {Promise<AdminNewsletterStatusResult>}
 */
export const publishAdminNewsletterService = async (newsletterId) => {
  try {
    const response = await publishAdminNewsletter(newsletterId)
    return mapNewsletterStatusResult(unwrapData(response))
  } catch (error) {
    throw parseApiError(error)
  }
}

/**
 * POST /admin/newsletters/{id}/retire
 * @param {number} newsletterId
 * @returns {Promise<AdminNewsletterStatusResult>}
 */
export const retireAdminNewsletterService = async (newsletterId) => {
  try {
    const response = await retireAdminNewsletter(newsletterId)
    return mapNewsletterStatusResult(unwrapData(response))
  } catch (error) {
    throw parseApiError(error)
  }
}

export const ADMIN_NEWSLETTER_ERROR_MESSAGES = {
  ADMIN_REQUIRED: '관리자 권한이 필요합니다.',
  NEWSLETTER_NOT_FOUND: '뉴스레터를 찾을 수 없습니다.',
  NEWSLETTER_NOT_PUBLISHABLE: '검수 대기(REVIEW) 상태가 아니어서 게시할 수 없습니다.',
  NEWSLETTER_NOT_RETIRABLE: '게시됨(PUBLISHED) 상태가 아니어서 폐기할 수 없습니다.',
  INVALID_REQUEST: 'status 값이 올바르지 않습니다.',
}

export const formatAdminNewsletterError = (error) => {
  const beMessage = error?.message || error?.data?.error?.message
  if (error?.code === 'INVALID_REQUEST' && beMessage) return beMessage
  if (error?.code && ADMIN_NEWSLETTER_ERROR_MESSAGES[error.code]) {
    return ADMIN_NEWSLETTER_ERROR_MESSAGES[error.code]
  }
  return beMessage || '요청에 실패했습니다.'
}
