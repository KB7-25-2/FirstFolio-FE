/**
 * 관리자 금융 뉴스 검수
 * — GET /financial-news (사용자 공개 목록, 변경 없음)
 * — PATCH /admin/financial-news/{id} (전달한 필드만 수정)
 * — DELETE /admin/financial-news/{id} (행 삭제)
 */

import { parseApiError } from '@/api/user/errorHandler.js'
import { getFinancialNews as getFinancialNewsApi } from '@/api/user/newsApi.js'
import { deleteAdminFinancialNews, patchAdminFinancialNews } from '@/api/admin/newsApi.js'
import { pickField, unwrapData } from '@/utils/apiMapper.js'

/**
 * @typedef {import('@/types/adminNews.js').AdminNewsItem} AdminNewsItem
 * @typedef {import('@/types/adminNews.js').AdminNewsPatchPayload} AdminNewsPatchPayload
 * @typedef {import('@/types/adminNews.js').AdminNewsDeleteResult} AdminNewsDeleteResult
 */

export const ADMIN_NEWS_LIST_LIMIT = 10

/** @param {unknown} raw @returns {AdminNewsItem} */
export const mapAdminNewsItem = (raw) => {
  const knowledgeId = pickField(raw, 'knowledgeContentId', 'knowledge_content_id')
  return {
    financialNewsId: Number(pickField(raw, 'financialNewsId', 'financial_news_id') ?? 0),
    knowledgeContentId: knowledgeId == null ? null : Number(knowledgeId),
    title: String(pickField(raw, 'title') ?? ''),
    summary: String(pickField(raw, 'summary') ?? ''),
    imageUrl: (() => {
      if (raw && typeof raw === 'object') {
        if ('image_url' in raw) return raw.image_url == null ? null : String(raw.image_url)
        if ('imageUrl' in raw) return raw.imageUrl == null ? null : String(raw.imageUrl)
      }
      return null
    })(),
    sourceName: String(pickField(raw, 'sourceName', 'source_name') ?? ''),
    sourceUrl: String(pickField(raw, 'sourceUrl', 'source_url') ?? ''),
    sourcePublishedAt: pickField(raw, 'sourcePublishedAt', 'source_published_at') ?? null,
    collectedAt: pickField(raw, 'collectedAt', 'collected_at') ?? null,
    publishedAt: pickField(raw, 'publishedAt', 'published_at') ?? null,
  }
}

/** @param {unknown} data @returns {AdminNewsItem[]} */
const mapList = (data) => {
  const root = data && typeof data === 'object' ? data : {}
  const items = Array.isArray(root.items) ? root.items : Array.isArray(root) ? root : []
  return items.map(mapAdminNewsItem)
}

const invalidRequest = (message) => {
  const error = new Error(message)
  error.code = 'INVALID_REQUEST'
  error.status = 400
  return error
}

/**
 * GET /financial-news?limit=
 * @param {{ limit?: number }} [params]
 * @returns {Promise<AdminNewsItem[]>}
 */
export const fetchAdminNews = async (params = {}) => {
  const limit = params.limit ?? ADMIN_NEWS_LIST_LIMIT
  try {
    const response = await getFinancialNewsApi({ limit })
    return mapList(unwrapData(response))
  } catch (error) {
    throw parseApiError(error)
  }
}

/**
 * NewsPatchRequest — 본문에 포함한 필드만 변경한다.
 * @param {AdminNewsPatchPayload} payload
 * @returns {{ title?: string, summary?: string, image_url?: string | null }}
 */
export const buildNewsPatchBody = (payload = {}) => {
  const body = {}
  if (payload.title !== undefined) {
    const title = String(payload.title).trim()
    if (!title) throw invalidRequest('title은 비울 수 없습니다.')
    body.title = title
  }
  if (payload.summary !== undefined) {
    const summary = String(payload.summary).trim()
    if (!summary) throw invalidRequest('summary는 비울 수 없습니다.')
    body.summary = summary
  }
  if (payload.imageUrl !== undefined) {
    body.image_url = payload.imageUrl == null ? null : String(payload.imageUrl).trim() || null
  }
  if (!Object.keys(body).length) {
    throw invalidRequest('수정할 필드가 없습니다.')
  }
  return body
}

/**
 * PATCH /admin/financial-news/{id} — 전달한 필드만 수정. source_url은 변경하지 않는다.
 * @param {number} financialNewsId
 * @param {AdminNewsPatchPayload} payload
 * @returns {Promise<AdminNewsItem>}
 */
export const updateAdminNewsContent = async (financialNewsId, payload) => {
  const body = buildNewsPatchBody(payload)
  try {
    const response = await patchAdminFinancialNews(financialNewsId, body)
    return mapAdminNewsItem(unwrapData(response))
  } catch (error) {
    throw parseApiError(error)
  }
}

/** @param {unknown} raw @returns {AdminNewsDeleteResult} */
export const mapDeleteResult = (raw) => ({
  financialNewsId: Number(pickField(raw, 'financialNewsId', 'financial_news_id') ?? 0),
})

/**
 * DELETE /admin/financial-news/{id}
 * @param {number} financialNewsId
 * @returns {Promise<AdminNewsDeleteResult>}
 */
export const removeAdminNews = async (financialNewsId) => {
  try {
    const response = await deleteAdminFinancialNews(financialNewsId)
    return mapDeleteResult(unwrapData(response))
  } catch (error) {
    throw parseApiError(error)
  }
}

export const ADMIN_NEWS_ERROR_MESSAGES = {
  ADMIN_REQUIRED: '관리자 권한이 필요합니다.',
  FINANCIAL_NEWS_NOT_FOUND: '금융 뉴스를 찾을 수 없습니다.',
  INVALID_REQUEST: '수정할 필드가 없거나 값이 올바르지 않습니다.',
}

export const formatAdminNewsError = (error) => {
  const beMessage = error?.message || error?.data?.error?.message
  if (error?.code === 'INVALID_REQUEST' && beMessage) return beMessage
  if (error?.code && ADMIN_NEWS_ERROR_MESSAGES[error.code]) {
    return ADMIN_NEWS_ERROR_MESSAGES[error.code]
  }
  return beMessage || '요청에 실패했습니다.'
}
