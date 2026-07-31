/**
 * 진행 목록에서 시간표 UI 상태(완료/진행중/다음/잠김)를 파생한다.
 * @param {import('@/types/study.js').LearningProgressItem[]} items
 * @returns {Array<import('@/types/study.js').LearningProgressItem & { scheduleStatus: import('@/types/study.js').ScheduleStatus }>}
 */
export const withScheduleStatus = (items) => {
  const sorted = items.slice().sort((a, b) => a.order - b.order)

  return sorted.map((item) => {
    /** @type {import('@/types/study.js').ScheduleStatus} */
    let scheduleStatus = null

    switch (item.status) {
      case 'COMPLETED':
        scheduleStatus = 'COMPLETED'
        break
      case 'IN_PROGRESS':
        scheduleStatus = 'IN_PROGRESS'
        break
    }
    return { ...item, scheduleStatus }
  })
}
