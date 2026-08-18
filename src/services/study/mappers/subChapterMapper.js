import { pickField } from '../studyResponseUtils.js'

/**
 * @typedef {import('@/types/study.js').SubChapterContent} SubChapterContent
 * @typedef {import('@/types/study.js').LearningProgressItem} LearningProgressItem
 * @typedef {import('@/types/study.js').LearningProgressStatus} LearningProgressStatus
 */

/**
 * GET /learning/sub-chapters/{id}/progress 응답 매핑
 * @param {object} raw
 */
export const mapSubChapterProgress = (raw) => ({
  subChapterId: Number(pickField(raw, 'subChapterId', 'sub_chapter_id')),
  contentVersionId: pickField(raw, 'contentVersionId', 'content_version_id') ?? null,
  lastPageId: pickField(raw, 'lastPageId', 'last_page_id') ?? null,
  status: /** @type {LearningProgressStatus} */ (pickField(raw, 'status') ?? 'NOT_STARTED'),
  startedAt: pickField(raw, 'startedAt', 'started_at') ?? null,
  completedAt: pickField(raw, 'completedAt', 'completed_at') ?? null,
  updated: pickField(raw, 'updated') ?? null,
})

/**
 * PUT /learning/sub-chapters/{id}/progress 요청 status 정규화
 * @param {LearningProgressStatus | undefined} status
 */
export const normalizePutProgressStatus = (status) => {
  if (status === 'COMPLETED') return 'COMPLETED'
  return 'IN_PROGRESS'
}

/**
 * @param {object} raw
 * @param {{ lastPageId: string | null, status: LearningProgressStatus }} fallback
 */
export const mapSaveProgressResponse = (raw, fallback) => {
  const progress = mapSubChapterProgress(raw)
  return {
    subChapterId: progress.subChapterId,
    contentVersionId: progress.contentVersionId,
    lastPageId: progress.lastPageId ?? fallback.lastPageId,
    status: progress.status ?? fallback.status,
    startedAt: progress.startedAt,
    completedAt: progress.completedAt,
    updated: progress.updated ?? true,
  }
}

/**
 * GET /learning/main-chapters/{id}/sub-chapters → LearningProgressItem
 * @param {object} raw
 * @param {number} mainChapterId
 * @param {number} index
 * @returns {LearningProgressItem & { contentAvailable?: boolean, description?: string }}
 */
export const mapSubChapterListItem = (raw, mainChapterId, index) => {
  const order = Number(pickField(raw, 'displayOrder', 'display_order') ?? index + 1)
  const title = String(raw.title ?? '')
  const description = raw.description != null ? String(raw.description) : ''
  const subChapterId = Number(pickField(raw, 'subChapterId', 'sub_chapter_id'))
  const contentAvailable = Boolean(pickField(raw, 'contentAvailable', 'content_available') ?? true)

  return {
    progressId: subChapterId,
    userId: 0,
    mainChapterId: Number(mainChapterId),
    subChapterId,
    contentVersionId: null,
    lastPageId: null,
    status: 'NOT_STARTED',
    startedAt: null,
    completedAt: null,
    updatedAt: '',
    order,
    title,
    shortLabel: title.slice(0, 8) || `${order}교시`,
    periodSubtitle: description || `${order}교시`,
    entryType: 'LESSON',
    quizScore: null,
    contentAvailable,
    description,
  }
}

/**
 * @param {LearningProgressItem & { contentAvailable?: boolean, description?: string }} item
 * @param {object | null} progressRaw
 */
export const mergeProgressIntoItem = (item, progressRaw) => {
  if (!progressRaw) return item
  const progress = mapSubChapterProgress(progressRaw)
  return {
    ...item,
    contentVersionId: progress.contentVersionId,
    lastPageId: progress.lastPageId,
    status: progress.status,
    startedAt: progress.startedAt,
    completedAt: progress.completedAt,
    updatedAt: progress.completedAt ?? progress.startedAt ?? item.updatedAt,
  }
}

/**
 * @param {object} raw
 * @returns {SubChapterContent}
 */
export const mapSubChapterContent = (raw, progressRaw = null) => {
  const progress = progressRaw ?? raw.progress ?? {}
  const lesson = raw.lesson ?? null
  return {
    subChapterId: pickField(raw, 'subChapterId', 'sub_chapter_id'),
    mainChapterId: pickField(raw, 'mainChapterId', 'main_chapter_id'),
    title: raw.title,
    contentVersionId: pickField(raw, 'contentVersionId', 'content_version_id'),
    schemaVersion: pickField(raw, 'schemaVersion', 'schema_version'),
    contentUrl: pickField(raw, 'contentUrl', 'content_url') ?? null,
    expiresAt: pickField(raw, 'expiresAt', 'expires_at') ?? null,
    lesson,
    progress: {
      status: pickField(progress, 'status') ?? 'NOT_STARTED',
      lastPageId: pickField(progress, 'lastPageId', 'last_page_id') ?? null,
      completedAt: pickField(progress, 'completedAt', 'completed_at') ?? null,
    },
  }
}
