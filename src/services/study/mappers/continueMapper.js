import { pickField } from '../studyResponseUtils.js'

/**
 * @typedef {import('@/types/study.js').ContinuePosition} ContinuePosition
 */

/**
 * @param {object} raw
 * @returns {ContinuePosition}
 */
export const mapContinuePosition = (raw) => ({
  curriculumItemId: pickField(raw, 'curriculumItemId', 'curriculum_item_id'),
  mainChapterId: pickField(raw, 'mainChapterId', 'main_chapter_id'),
  subChapterId: pickField(raw, 'subChapterId', 'sub_chapter_id'),
  contentVersionId: pickField(raw, 'contentVersionId', 'content_version_id'),
  lastPageId: pickField(raw, 'lastPageId', 'last_page_id'),
  progressPercent: pickField(raw, 'progressPercent', 'progress_percent'),
  route: raw.route,
})
