/**
 * 확정 커리큘럼 밖의 미수료 대단원 후보를 고른다.
 *
 * @param {{
 *   curriculumItems?: Array<{ mainChapterId: number, status?: string }>,
 *   recommendationCandidates?: Array<{ mainChapterId: number, title?: string }>,
 *   cartCandidates?: Array<{ mainChapterId: number, title?: string }>,
 * }} options
 * @returns {Array<{ mainChapterId: number, title: string }>}
 */
export const findRecommendableOutsideCurriculum = ({
  curriculumItems = [],
  recommendationCandidates = [],
  cartCandidates = [],
} = {}) => {
  const inCurriculum = new Set(
    curriculumItems
      .filter((item) => item.status !== 'REMOVED')
      .map((item) => Number(item.mainChapterId)),
  )
  const completed = new Set(
    curriculumItems
      .filter((item) => item.status === 'COMPLETED')
      .map((item) => Number(item.mainChapterId)),
  )

  const seen = new Set()
  /** @type {Array<{ mainChapterId: number, title: string }>} */
  const result = []

  for (const item of [...recommendationCandidates, ...cartCandidates]) {
    const mainChapterId = Number(item?.mainChapterId)
    if (!Number.isFinite(mainChapterId)) continue
    if (
      seen.has(mainChapterId) ||
      inCurriculum.has(mainChapterId) ||
      completed.has(mainChapterId)
    ) {
      continue
    }
    seen.add(mainChapterId)
    result.push({
      mainChapterId,
      title: item.title || `대단원 ${mainChapterId}`,
    })
  }

  return result
}
