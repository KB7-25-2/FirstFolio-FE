/**
 * 관리자 커리큘럼(대단원·소단원) 서비스
 * OpenAPI: /api/admin/main-chapters, /api/admin/sub-chapters/{id}
 */

import { parseApiError } from '@/api/user/errorHandler.js'
import {
  createAdminMainChapter,
  createAdminSubChapter,
  getAdminMainChapters,
  getAdminSubChapters,
  patchAdminMainChapter,
  patchAdminSubChapter,
} from '@/api/admin/curriculumApi.js'
import { pickField, unwrapData } from '@/utils/apiMapper.js'

/**
 * @typedef {'FOUNDATION' | 'ASSET'} ChapterType
 * @typedef {'DEPOSIT_SAVINGS' | 'BOND' | 'STOCK' | 'FUND'} AssetType
 *
 * @typedef {object} AdminMainChapter
 * @property {number} mainChapterId
 * @property {ChapterType | string} chapterType
 * @property {AssetType | string | null} assetType
 * @property {string} title
 * @property {string | null} [description]
 * @property {number} displayOrder
 * @property {boolean} isRequired
 * @property {boolean} isActive
 *
 * @typedef {object} AdminSubChapter
 * @property {number} subChapterId
 * @property {number} [mainChapterId]
 * @property {string} title
 * @property {string | null} [description]
 * @property {number} displayOrder
 * @property {number | null} currentContentVersionId
 * @property {boolean} isActive
 */

/** @param {unknown} raw @returns {AdminMainChapter} */
const mapMainChapter = (raw) => ({
  mainChapterId: Number(pickField(raw, 'mainChapterId', 'main_chapter_id')),
  chapterType: String(pickField(raw, 'chapterType', 'chapter_type') ?? ''),
  assetType: pickField(raw, 'assetType', 'asset_type') ?? null,
  title: String(pickField(raw, 'title') ?? ''),
  description: pickField(raw, 'description') ?? null,
  displayOrder: Number(pickField(raw, 'displayOrder', 'display_order') ?? 0),
  isRequired: Boolean(pickField(raw, 'isRequired', 'is_required')),
  isActive: Boolean(pickField(raw, 'isActive', 'is_active')),
})

/** @param {unknown} raw @returns {AdminSubChapter} */
const mapSubChapter = (raw) => ({
  subChapterId: Number(pickField(raw, 'subChapterId', 'sub_chapter_id')),
  mainChapterId: pickField(raw, 'mainChapterId', 'main_chapter_id')
    ? Number(pickField(raw, 'mainChapterId', 'main_chapter_id'))
    : undefined,
  title: String(pickField(raw, 'title') ?? ''),
  description: pickField(raw, 'description') ?? null,
  displayOrder: Number(pickField(raw, 'displayOrder', 'display_order') ?? 0),
  currentContentVersionId: (() => {
    const v = pickField(raw, 'currentContentVersionId', 'current_content_version_id')
    return v == null ? null : Number(v)
  })(),
  isActive: Boolean(pickField(raw, 'isActive', 'is_active')),
})

const listItems = (data) => {
  if (Array.isArray(data)) return data
  if (data && typeof data === 'object' && Array.isArray(data.items)) return data.items
  return []
}

/**
 * @param {{ chapterType?: ChapterType, isActive?: boolean }} [filters]
 * @returns {Promise<AdminMainChapter[]>}
 */
export const fetchAdminMainChapters = async (filters = {}) => {
  try {
    const params = {}
    if (filters.chapterType) params.chapter_type = filters.chapterType
    if (typeof filters.isActive === 'boolean') params.is_active = filters.isActive
    const data = unwrapData(await getAdminMainChapters(params))
    return listItems(data)
      .map(mapMainChapter)
      .sort((a, b) => a.displayOrder - b.displayOrder)
  } catch (error) {
    throw parseApiError(error)
  }
}

/**
 * @param {{
 *   chapterType: ChapterType,
 *   assetType?: AssetType | null,
 *   title: string,
 *   description?: string,
 *   displayOrder: number,
 *   isRequired?: boolean,
 * }} payload
 * @returns {Promise<AdminMainChapter>}
 */
export const createMainChapter = async (payload) => {
  try {
    /** OpenAPI MainChapterCreateRequest — camelCase + is_required */
    const body = {
      chapterType: payload.chapterType,
      title: payload.title,
      description: payload.description || undefined,
      displayOrder: payload.displayOrder,
      is_required: Boolean(payload.isRequired),
    }
    if (payload.chapterType === 'ASSET' && payload.assetType) {
      body.assetType = payload.assetType
    }
    const raw = unwrapData(await createAdminMainChapter(body))
    return mapMainChapter(raw)
  } catch (error) {
    throw parseApiError(error)
  }
}

/**
 * @param {number} mainChapterId
 * @param {{ title?: string, description?: string, displayOrder?: number, isActive?: boolean }} payload
 * @returns {Promise<AdminMainChapter>}
 */
export const updateMainChapter = async (mainChapterId, payload) => {
  try {
    /** OpenAPI MainChapterPatchRequest — snake_case for order/active */
    const body = {}
    if (payload.title !== undefined) body.title = payload.title
    if (payload.description !== undefined) body.description = payload.description
    if (payload.displayOrder !== undefined) body.display_order = payload.displayOrder
    if (payload.isActive !== undefined) body.is_active = payload.isActive
    const raw = unwrapData(await patchAdminMainChapter(mainChapterId, body))
    return mapMainChapter({ ...raw, mainChapterId })
  } catch (error) {
    throw parseApiError(error)
  }
}

/**
 * @param {number} mainChapterId
 * @returns {Promise<AdminSubChapter[]>}
 */
export const fetchAdminSubChapters = async (mainChapterId) => {
  try {
    const data = unwrapData(await getAdminSubChapters(mainChapterId))
    return listItems(data)
      .map((item) => mapSubChapter({ ...item, mainChapterId }))
      .sort((a, b) => a.displayOrder - b.displayOrder)
  } catch (error) {
    throw parseApiError(error)
  }
}

/**
 * @param {number} mainChapterId
 * @param {{ title: string, description?: string, displayOrder: number }} payload
 * @returns {Promise<AdminSubChapter>}
 */
export const createSubChapter = async (mainChapterId, payload) => {
  try {
    const body = {
      title: payload.title,
      description: payload.description || undefined,
      displayOrder: payload.displayOrder,
    }
    const raw = unwrapData(await createAdminSubChapter(mainChapterId, body))
    return mapSubChapter({ ...raw, mainChapterId })
  } catch (error) {
    throw parseApiError(error)
  }
}

/**
 * @param {number} subChapterId
 * @param {{ title?: string, description?: string, displayOrder?: number, isActive?: boolean }} payload
 * @returns {Promise<AdminSubChapter>}
 */
export const updateSubChapter = async (subChapterId, payload) => {
  try {
    const body = {}
    if (payload.title !== undefined) body.title = payload.title
    if (payload.description !== undefined) body.description = payload.description
    if (payload.displayOrder !== undefined) body.display_order = payload.displayOrder
    if (payload.isActive !== undefined) body.is_active = payload.isActive
    const raw = unwrapData(await patchAdminSubChapter(subChapterId, body))
    return mapSubChapter({ ...raw, subChapterId })
  } catch (error) {
    throw parseApiError(error)
  }
}

export const CHAPTER_TYPE_LABELS = {
  FOUNDATION: '기초 과정',
  ASSET: '자산군',
}

export const ASSET_TYPE_OPTIONS = [
  { value: 'DEPOSIT_SAVINGS', label: '예·적금' },
  { value: 'BOND', label: '채권' },
  { value: 'STOCK', label: '주식' },
  { value: 'FUND', label: '펀드' },
]

export const assetTypeLabel = (assetType) =>
  ASSET_TYPE_OPTIONS.find((o) => o.value === assetType)?.label ?? assetType ?? '—'
