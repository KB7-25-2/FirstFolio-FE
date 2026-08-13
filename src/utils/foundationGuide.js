/**
 * 홈 포트폴리오 기초 과정 가이드 노출 여부
 * FOUNDATION이 ACTIVE이고 진도 0%일 때만 true (시작·완료 시 미노출)
 *
 * @param {Array<{ chapterType?: string, status?: string, progressPercent?: number }> | null | undefined} curriculumItems
 * @returns {boolean}
 */
export const shouldShowFoundationGuide = (curriculumItems) => {
  if (!Array.isArray(curriculumItems) || !curriculumItems.length) return false

  const foundation = curriculumItems.find((item) => item.chapterType === 'FOUNDATION')
  if (!foundation) return false

  return foundation.status === 'ACTIVE' && (foundation.progressPercent ?? 0) === 0
}

/**
 * 포트폴리오 기초 과정 수료 여부 (포트폴리오 탭 개방 조건)
 *
 * @param {Array<{ chapterType?: string, status?: string }> | null | undefined} curriculumItems
 * @returns {boolean}
 */
export const isFoundationCompleted = (curriculumItems) => {
  if (!Array.isArray(curriculumItems) || !curriculumItems.length) return false

  const foundation = curriculumItems.find((item) => item.chapterType === 'FOUNDATION')
  return foundation?.status === 'COMPLETED'
}

export const PORTFOLIO_LOCKED_MESSAGE = '포트폴리오 기초 과정을 먼저 수료해 주세요.'
