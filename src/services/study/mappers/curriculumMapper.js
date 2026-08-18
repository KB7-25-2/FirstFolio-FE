import { pickField } from '../studyResponseUtils.js'

/**
 * @typedef {import('@/types/study.js').CurriculumItem} CurriculumItem
 */

/**
 * @param {object} item
 * @returns {CurriculumItem & { status: string }}
 */
export const mapCurriculumItem = (item) => {
  const chapterTypeRaw = String(pickField(item, 'chapterType', 'chapter_type') ?? '')
  const chapterType = chapterTypeRaw === 'ASSET' ? 'CORE' : chapterTypeRaw
  const progressPercent = Number(pickField(item, 'progressPercent', 'progress_percent') ?? 0)
  const completedAt = pickField(item, 'completedAt', 'completed_at') ?? null
  const rawStatus = String(pickField(item, 'status') ?? '')

  /** @type {string} */
  let status
  if (rawStatus === 'REMOVED') {
    status = 'REMOVED'
  } else if (rawStatus === 'COMPLETED' || rawStatus === 'LOCKED') {
    status = rawStatus
  } else if (completedAt || progressPercent >= 100) {
    status = 'COMPLETED'
  } else {
    status = 'PENDING'
  }

  return {
    curriculumItemId: Number(pickField(item, 'curriculumItemId', 'curriculum_item_id')),
    mainChapterId: Number(pickField(item, 'mainChapterId', 'main_chapter_id')),
    title: String(pickField(item, 'title') ?? ''),
    chapterType,
    displayOrder: Number(pickField(item, 'displayOrder', 'display_order') ?? 0),
    status,
    completedAt,
    progressPercent,
  }
}

/**
 * 순차 학습용 status 정규화: 완료 → 첫 미완료 ACTIVE → 나머지 LOCKED
 * @param {Array<CurriculumItem & { status: string }>} items
 * @returns {CurriculumItem[]}
 */
export const normalizeCurriculumStatuses = (items) => {
  const sorted = items
    .filter((item) => item.status !== 'REMOVED')
    .slice()
    .sort((a, b) => a.displayOrder - b.displayOrder)

  let activeAssigned = false
  return sorted.map((item) => {
    if (item.status === 'COMPLETED') return /** @type {CurriculumItem} */ (item)
    if (!activeAssigned) {
      activeAssigned = true
      return { ...item, status: 'ACTIVE' }
    }
    return { ...item, status: 'LOCKED' }
  })
}
