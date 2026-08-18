/**
 * 관리자 소단원 강좌 JSON 버전 서비스
 * OpenAPI:
 * - GET/POST /admin/sub-chapters/{id}/content-versions
 * - POST /admin/content-versions/{id}/publish
 */

import { parseApiError } from '@/api/user/errorHandler.js'
import {
  createAdminContentVersion,
  getAdminContentVersions,
  publishAdminContentVersion,
} from '@/api/admin/contentVersionApi.js'
import { pickField, unwrapData } from '@/utils/apiMapper.js'
import { validateLessonJson } from '@/utils/lessonJsonSchema.js'

/**
 * @typedef {'DRAFT' | 'REVIEW' | 'PUBLISHED' | 'RETIRED'} ContentVersionStatus
 *
 * @typedef {object} AdminContentVersion
 * @property {number} contentVersionId
 * @property {number} subChapterId
 * @property {number} versionNo
 * @property {string} schemaVersion
 * @property {ContentVersionStatus | string} status
 * @property {string | null} publishedAt
 * @property {number | null} createdBy
 * @property {string | null} createdAt
 * @property {boolean} current
 *
 * @typedef {object} AdminContentVersionCreateResult
 * @property {number} contentVersionId
 * @property {number} subChapterId
 * @property {number} versionNo
 * @property {string} schemaVersion
 * @property {ContentVersionStatus | string} status
 * @property {boolean} validated
 *
 * @typedef {object} AdminContentVersionPublishResult
 * @property {number} contentVersionId
 * @property {number} subChapterId
 * @property {ContentVersionStatus | string} status
 * @property {string | null} publishedAt
 * @property {boolean} current
 */

/** @param {unknown} raw @returns {AdminContentVersion} */
const mapContentVersion = (raw) => ({
  contentVersionId: Number(pickField(raw, 'contentVersionId', 'content_version_id')),
  subChapterId: Number(pickField(raw, 'subChapterId', 'sub_chapter_id')),
  versionNo: Number(pickField(raw, 'versionNo', 'version_no') ?? 0),
  schemaVersion: String(pickField(raw, 'schemaVersion', 'schema_version') ?? ''),
  status: String(pickField(raw, 'status') ?? ''),
  publishedAt: pickField(raw, 'publishedAt', 'published_at') ?? null,
  createdBy: (() => {
    const v = pickField(raw, 'createdBy', 'created_by')
    return v == null ? null : Number(v)
  })(),
  createdAt: pickField(raw, 'createdAt', 'created_at') ?? null,
  current: Boolean(pickField(raw, 'current')),
})

const listItems = (data) => {
  if (Array.isArray(data)) return data
  if (data && typeof data === 'object' && Array.isArray(data.items)) return data.items
  return []
}

/**
 * @param {number} subChapterId
 * @returns {Promise<AdminContentVersion[]>}
 */
export const fetchContentVersions = async (subChapterId) => {
  try {
    const raw = unwrapData(await getAdminContentVersions(subChapterId))
    return listItems(raw)
      .map(mapContentVersion)
      .sort((a, b) => b.versionNo - a.versionNo || b.contentVersionId - a.contentVersionId)
  } catch (error) {
    throw parseApiError(error)
  }
}

/**
 * @param {number} subChapterId
 * @param {{ versionNo: number, lesson: unknown }} payload
 * @returns {Promise<AdminContentVersionCreateResult>}
 */
export const uploadContentVersion = async (subChapterId, payload) => {
  const validation = validateLessonJson(payload.lesson)
  if (!validation.ok) {
    const err = new Error(validation.errors.join('\n'))
    err.code = 'LESSON_JSON_INVALID'
    err.errors = validation.errors
    throw err
  }

  try {
    /** BE body: { version_no, lesson } — lesson 내부는 schemaVersion 등 camelCase */
    const body = {
      version_no: Number(payload.versionNo),
      lesson: validation.lesson,
    }
    const raw = unwrapData(await createAdminContentVersion(subChapterId, body))
    return {
      contentVersionId: Number(pickField(raw, 'contentVersionId', 'content_version_id')),
      subChapterId: Number(pickField(raw, 'subChapterId', 'sub_chapter_id') ?? subChapterId),
      versionNo: Number(pickField(raw, 'versionNo', 'version_no') ?? payload.versionNo),
      schemaVersion: String(pickField(raw, 'schemaVersion', 'schema_version') ?? ''),
      status: String(pickField(raw, 'status') ?? 'DRAFT'),
      validated: Boolean(pickField(raw, 'validated') ?? true),
    }
  } catch (error) {
    throw parseApiError(error)
  }
}

/**
 * @param {number} contentVersionId
 * @returns {Promise<AdminContentVersionPublishResult>}
 */
export const publishContentVersion = async (contentVersionId) => {
  try {
    const raw = unwrapData(await publishAdminContentVersion(contentVersionId))
    return {
      contentVersionId: Number(
        pickField(raw, 'contentVersionId', 'content_version_id') ?? contentVersionId,
      ),
      subChapterId: Number(pickField(raw, 'subChapterId', 'sub_chapter_id') ?? 0),
      status: String(pickField(raw, 'status') ?? 'PUBLISHED'),
      publishedAt: pickField(raw, 'publishedAt', 'published_at') ?? null,
      current: Boolean(pickField(raw, 'current') ?? true),
    }
  } catch (error) {
    throw parseApiError(error)
  }
}

/** @param {AdminContentVersion[]} versions */
export const suggestNextVersionNo = (versions) => {
  if (!versions?.length) return 1
  return Math.max(...versions.map((v) => Number(v.versionNo) || 0)) + 1
}

export const CONTENT_VERSION_STATUS_LABELS = {
  DRAFT: '초안',
  REVIEW: '검수',
  PUBLISHED: '게시됨',
  RETIRED: '폐기',
}

export const ADMIN_CONTENT_VERSION_ERROR_MESSAGES = {
  LESSON_JSON_INVALID: '강좌 JSON 스키마가 올바르지 않습니다.',
  CONTENT_VERSION_NOT_FOUND: '콘텐츠 버전을 찾을 수 없습니다.',
  SUB_CHAPTER_NOT_FOUND: '소단원을 찾을 수 없습니다.',
  QUESTION_NOT_FOUND: '참조한 퀴즈 문항이 없거나 게시 상태가 아닙니다.',
  INVALID_QUESTION_REF: '참조한 퀴즈 문항이 없거나 이 소단원에 속하지 않습니다.',
  VALIDATION_ERROR: '요청 값이 올바르지 않습니다.',
  VERSION_NO_CONFLICT: '같은 버전 번호가 이미 존재합니다.',
}

export const formatAdminContentVersionError = (error) => {
  if (error?.code === 'LESSON_JSON_INVALID' && Array.isArray(error.errors) && error.errors.length) {
    return error.errors.join('\n')
  }
  if (error?.code && ADMIN_CONTENT_VERSION_ERROR_MESSAGES[error.code]) {
    return ADMIN_CONTENT_VERSION_ERROR_MESSAGES[error.code]
  }
  return error?.message || '요청에 실패했습니다.'
}
