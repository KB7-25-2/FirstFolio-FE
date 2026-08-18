import { pickField } from '../studyResponseUtils.js'
import { isSubChapterFullyCompletedFromItem } from './subChapterMapper.js'

/**
 * @typedef {import('@/types/study.js').CurriculumItem} CurriculumItem
 * @typedef {import('@/types/study.js').LearningProgressItem} LearningProgressItem
 * @typedef {import('@/types/study.js').LearningProgressStatus} LearningProgressStatus
 */

/**
 * 로드맵 API 대단원 status → UI status
 * @param {string | undefined} rawStatus
 */
const mapRoadmapChapterStatus = (rawStatus) => {
  if (rawStatus === 'COMPLETED') return 'COMPLETED'
  if (rawStatus === 'LOCKED') return 'LOCKED'
  if (rawStatus === 'IN_PROGRESS' || rawStatus === 'ACTIVE') return 'ACTIVE'
  return 'LOCKED'
}

/**
 * @param {object} raw
 * @returns {CurriculumItem & { description?: string }}
 */
export const mapRoadmapChapterItem = (raw) => {
  const chapterTypeRaw = String(pickField(raw, 'chapterType', 'chapter_type') ?? '')
  const chapterType = chapterTypeRaw === 'ASSET' ? 'CORE' : chapterTypeRaw

  return {
    curriculumItemId: Number(pickField(raw, 'curriculumItemId', 'curriculum_item_id')),
    mainChapterId: Number(pickField(raw, 'mainChapterId', 'main_chapter_id')),
    title: String(pickField(raw, 'title') ?? ''),
    description: String(pickField(raw, 'description') ?? ''),
    chapterType,
    displayOrder: Number(pickField(raw, 'displayOrder', 'display_order') ?? 0),
    status: mapRoadmapChapterStatus(pickField(raw, 'status')),
    completedAt: pickField(raw, 'completedAt', 'completed_at') ?? null,
    progressPercent: Number(pickField(raw, 'progressPercent', 'progress_percent') ?? 0),
  }
}

/**
 * @param {object} raw
 * @param {number} mainChapterId
 * @returns {LearningProgressItem & { scheduleStatus: import('@/types/study.js').ScheduleStatus, contentAvailable?: boolean }}
 */
export const mapRoadmapSubChapter = (raw, mainChapterId) => {
  const order = Number(pickField(raw, 'displayOrder', 'display_order') ?? 0)
  const title = String(raw.title ?? '')
  const description = raw.description != null ? String(raw.description) : ''
  const subChapterId = Number(pickField(raw, 'subChapterId', 'sub_chapter_id'))
  const status = /** @type {LearningProgressStatus} */ (
    pickField(raw, 'progressStatus', 'progress_status') ?? 'NOT_STARTED'
  )
  const scheduleStatus = /** @type {import('@/types/study.js').ScheduleStatus} */ (
    pickField(raw, 'scheduleStatus', 'schedule_status') ?? 'LOCKED'
  )

  return {
    progressId: Number(pickField(raw, 'progressId', 'progress_id') ?? subChapterId),
    userId: 0,
    mainChapterId: Number(mainChapterId),
    subChapterId,
    contentVersionId:
      pickField(raw, 'progressContentVersionId', 'progress_content_version_id') ??
      pickField(raw, 'currentContentVersionId', 'current_content_version_id') ??
      null,
    lastPageId: pickField(raw, 'lastPageId', 'last_page_id') ?? null,
    status,
    startedAt: pickField(raw, 'startedAt', 'started_at') ?? null,
    completedAt: pickField(raw, 'completedAt', 'completed_at') ?? null,
    updatedAt: pickField(raw, 'updatedAt', 'updated_at') ?? '',
    order,
    title,
    shortLabel: title.slice(0, 8) || `${order}교시`,
    periodSubtitle: description || `${order}교시`,
    entryType: 'LESSON',
    quizScore: null,
    contentAvailable: Boolean(pickField(raw, 'contentAvailable', 'content_available') ?? true),
    scheduleStatus,
  }
}

/**
 * @param {CurriculumItem & { description?: string, accent?: string, icon?: string }} chapter
 * @param {Array<LearningProgressItem & { scheduleStatus?: import('@/types/study.js').ScheduleStatus }>} subChapters
 * @param {object | null | undefined} mainChapterQuiz
 */
export const buildRoadmapStage = (chapter, subChapters, mainChapterQuiz = null) => {
  let periods = subChapters
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((row) => ({
      ...row,
      entryType: row.entryType ?? 'LESSON',
      scheduleStatus: row.scheduleStatus ?? 'LOCKED',
    }))

  if (chapter.status === 'LOCKED') {
    periods = periods.map((row) => ({ ...row, scheduleStatus: 'LOCKED' }))
  }

  const lessonPeriods = periods.filter((row) => row.entryType !== 'SCENARIO_QUIZ')
  const lessonsDone =
    chapter.status !== 'LOCKED' &&
    lessonPeriods.length > 0 &&
    lessonPeriods.every(isSubChapterFullyCompletedFromItem)

  const quiz = mainChapterQuiz ?? {}
  const quizStatus = pickField(quiz, 'status')
  const scenarioReady =
    lessonsDone && Boolean(pickField(quiz, 'available')) && quizStatus !== 'COMPLETED'

  return {
    mainChapterId: chapter.mainChapterId,
    curriculumItemId: chapter.curriculumItemId,
    title: chapter.title,
    status: chapter.status,
    progressPercent: chapter.progressPercent ?? 0,
    description: chapter.description ?? '',
    accent: chapter.accent,
    icon: chapter.icon,
    chapterType: chapter.chapterType,
    displayOrder: chapter.displayOrder,
    periods,
    scenarioReady,
    scenarioTitle: '대단원 실전 퀴즈',
    scenarioSubtitle: '배운 내용을 실전 상황에서 점검해요',
  }
}
