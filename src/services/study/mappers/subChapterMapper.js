import { pickField } from '../studyResponseUtils.js'

/**
 * @typedef {import('@/types/study.js').SubChapterContent} SubChapterContent
 * @typedef {import('@/types/study.js').LearningProgressItem} LearningProgressItem
 * @typedef {import('@/types/study.js').LearningProgressStatus} LearningProgressStatus
 */

/**
 * GET /learning/sub-chapters/{id}/progress — quiz 필드
 * @param {object | null | undefined} raw
 */
export const mapQuizProgress = (raw) => {
  if (!raw) return null
  return {
    completed: Boolean(pickField(raw, 'completed')),
    activeAttemptId: pickField(raw, 'activeAttemptId', 'active_attempt_id') ?? null,
    answeredCount: Number(pickField(raw, 'answeredCount', 'answered_count') ?? 0),
    totalCount: Number(pickField(raw, 'totalCount', 'total_count') ?? 0),
  }
}

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
  quiz: mapQuizProgress(raw.quiz),
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
    quiz: progress.quiz,
  }
}

/**
 * @param {object} raw
 * @returns {SubChapterContent}
 */
export const mapSubChapterContent = (raw, progressRaw = null) => {
  const progressMapped = progressRaw ? mapSubChapterProgress(progressRaw) : null
  const progress = progressMapped ?? raw.progress ?? {}
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
      status: progress.status ?? pickField(progress, 'status') ?? 'NOT_STARTED',
      lastPageId: progress.lastPageId ?? pickField(progress, 'lastPageId', 'last_page_id') ?? null,
      completedAt:
        progress.completedAt ?? pickField(progress, 'completedAt', 'completed_at') ?? null,
      quiz: progress.quiz ?? mapQuizProgress(progress.quiz),
    },
  }
}

/** @param {{ status?: LearningProgressStatus, quiz?: ReturnType<typeof mapQuizProgress> | null } | null | undefined} progress */
export const isLessonCompleted = (progress) => progress?.status === 'COMPLETED'

/** @param {{ quiz?: ReturnType<typeof mapQuizProgress> | null } | null | undefined} progress */
export const isQuizCompleted = (progress) => Boolean(progress?.quiz?.completed)

/** @param {{ status?: LearningProgressStatus, quiz?: ReturnType<typeof mapQuizProgress> | null } | null | undefined} progress */
export const needsQuizAttempt = (progress) =>
  isLessonCompleted(progress) && !isQuizCompleted(progress)

/**
 * 로드맵 period — 강좌는 COMPLETED인데 소단원 schedule은 미완료
 * @param {{ status?: LearningProgressStatus, scheduleStatus?: string } | null | undefined} period
 */
export const isPeriodQuizDue = (period) =>
  period?.status === 'COMPLETED' && period?.scheduleStatus !== 'COMPLETED'

/** @param {{ quiz?: object, quizProgress?: object, progress?: { quiz?: object }, quizScore?: number | null } | null | undefined} item */
export const resolveItemQuizProgress = (item) => {
  if (!item) return null
  if (item.quiz) return item.quiz
  if (item.quizProgress) return item.quizProgress
  if (item.progress?.quiz) return item.progress.quiz
  return null
}

/** @param {{ quiz?: object, quizProgress?: object, progress?: { quiz?: object }, quizScore?: number | null } | null | undefined} item */
export const isQuizCompletedFromItem = (item) => {
  const quiz = resolveItemQuizProgress(item)
  if (quiz) return Boolean(quiz.completed)
  return item?.quizScore != null
}

/** @param {{ quiz?: object, quizProgress?: object, progress?: { quiz?: object } } | null | undefined} item */
export const isQuizInProgressFromItem = (item) =>
  resolveItemQuizProgress(item)?.activeAttemptId != null

/** @param {{ entryType?: string, status?: LearningProgressStatus, quiz?: object, quizProgress?: object, progress?: { quiz?: object }, quizScore?: number | null } | null | undefined} item */
export const needsQuizAttemptFromItem = (item) =>
  item?.entryType !== 'SCENARIO_QUIZ' && isLessonCompleted(item) && !isQuizCompletedFromItem(item)

/** @param {{ entryType?: string, status?: LearningProgressStatus, quiz?: object, quizProgress?: object, progress?: { quiz?: object }, quizScore?: number | null } | null | undefined} item */
export const isSubChapterFullyCompletedFromItem = (item) => {
  if (!item) return false
  if (item.entryType === 'SCENARIO_QUIZ') return item.status === 'COMPLETED'
  return isLessonCompleted(item) && isQuizCompletedFromItem(item)
}
