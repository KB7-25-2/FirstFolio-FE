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
  getLearningMainChapters,
  getLearningSubChapters,
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

/** @type {Map<number, string>} */
const mainChapterDescriptionCache = new Map()
/** @type {Map<number, string>} */
const subChapterDescriptionCache = new Map()

const rememberDescription = (cache, id, description) => {
  if (id == null || description == null) return
  const text = String(description).trim()
  if (text) cache.set(Number(id), text)
}

const descriptionById = (items, ...idKeys) => {
  const map = new Map()
  for (const item of items) {
    const id = Number(pickField(item, ...idKeys))
    const description = pickField(item, 'description')
    if (id && description != null && String(description).trim()) {
      map.set(id, String(description).trim())
    }
  }
  return map
}

const mergeDescriptions = (chapters, idKey, learningItems, cache) => {
  const idKeys =
    idKey === 'mainChapterId'
      ? ['mainChapterId', 'main_chapter_id']
      : ['subChapterId', 'sub_chapter_id']
  const fromLearning = descriptionById(learningItems, ...idKeys)
  return chapters.map((chapter) => {
    const id = chapter[idKey]
    const description = chapter.description ?? fromLearning.get(id) ?? cache.get(id) ?? null
    return description === chapter.description ? chapter : { ...chapter, description }
  })
}

const fetchLearningMainChapterDescriptions = async () => {
  try {
    return listItems(unwrapData(await getLearningMainChapters()))
  } catch {
    return []
  }
}

const fetchLearningSubChapterDescriptions = async (mainChapterId) => {
  try {
    return listItems(unwrapData(await getLearningSubChapters(mainChapterId)))
  } catch {
    return []
  }
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
    const [adminData, learningItems] = await Promise.all([
      getAdminMainChapters(params),
      fetchLearningMainChapterDescriptions(),
    ])
    const chapters = listItems(unwrapData(adminData))
      .map(mapMainChapter)
      .sort((a, b) => a.displayOrder - b.displayOrder)
    return mergeDescriptions(chapters, 'mainChapterId', learningItems, mainChapterDescriptionCache)
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
    const chapter = mapMainChapter({
      ...raw,
      description: payload.description?.trim() || pickField(raw, 'description'),
    })
    rememberDescription(mainChapterDescriptionCache, chapter.mainChapterId, chapter.description)
    return chapter
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
    const chapter = mapMainChapter({
      ...raw,
      mainChapterId,
      description: payload.description ?? pickField(raw, 'description'),
    })
    rememberDescription(mainChapterDescriptionCache, chapter.mainChapterId, chapter.description)
    return chapter
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
    const [adminData, learningItems] = await Promise.all([
      getAdminSubChapters(mainChapterId),
      fetchLearningSubChapterDescriptions(mainChapterId),
    ])
    const chapters = listItems(unwrapData(adminData))
      .map((item) => mapSubChapter({ ...item, mainChapterId }))
      .sort((a, b) => a.displayOrder - b.displayOrder)
    return mergeDescriptions(chapters, 'subChapterId', learningItems, subChapterDescriptionCache)
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
    /** POST .../sub-chapters — body snake_case (display_order) */
    const body = {
      title: payload.title,
      display_order: payload.displayOrder,
    }
    if (payload.description?.trim()) body.description = payload.description.trim()
    const raw = unwrapData(await createAdminSubChapter(mainChapterId, body))
    const chapter = mapSubChapter({
      ...raw,
      mainChapterId,
      description: payload.description?.trim() || pickField(raw, 'description'),
    })
    rememberDescription(subChapterDescriptionCache, chapter.subChapterId, chapter.description)
    return chapter
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
    const chapter = mapSubChapter({
      ...raw,
      subChapterId,
      description: payload.description ?? pickField(raw, 'description'),
    })
    rememberDescription(subChapterDescriptionCache, chapter.subChapterId, chapter.description)
    return chapter
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

/** 관리자 API 비즈니스 오류 — UI 메시지 */
export const ADMIN_CURRICULUM_ERROR_MESSAGES = {
  SUB_CHAPTER_ORDER_CONFLICT:
    '같은 순서의 소단원이 이미 있습니다. 다른 display_order를 입력해 주세요.',
  MAIN_CHAPTER_NOT_FOUND: '대단원을 찾을 수 없습니다.',
  SUB_CHAPTER_NOT_FOUND: '소단원을 찾을 수 없습니다.',
}

export const formatAdminCurriculumError = (error) => {
  if (error?.code && ADMIN_CURRICULUM_ERROR_MESSAGES[error.code]) {
    return ADMIN_CURRICULUM_ERROR_MESSAGES[error.code]
  }
  return error?.message || '요청에 실패했습니다.'
}
