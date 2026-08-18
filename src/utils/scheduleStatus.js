import { isSubChapterFullyCompleted, needsQuizAttempt } from '@/utils/subChapterProgress.js'

/**
 * 진행 목록에서 시간표 UI 상태(완료/진행중/다음/잠김)를 파생한다.
 * SCENARIO_QUIZ는 모든 LESSON 수료 후에만 NEXT, 아니면 LOCKED.
 * @param {import('@/types/study.js').LearningProgressItem[]} items
 * @returns {Array<import('@/types/study.js').LearningProgressItem & { scheduleStatus: import('@/types/study.js').ScheduleStatus }>}
 */
export const withScheduleStatus = (items) => {
  const sorted = items.slice().sort((a, b) => a.order - b.order)
  const lessons = sorted.filter((item) => item.entryType !== 'SCENARIO_QUIZ')
  const allLessonsCompleted = lessons.length > 0 && lessons.every(isSubChapterFullyCompleted)

  let nextAssigned = false

  return sorted.map((item) => {
    /** @type {import('@/types/study.js').ScheduleStatus} */
    let scheduleStatus

    if (isSubChapterFullyCompleted(item)) {
      scheduleStatus = 'COMPLETED'
    } else if (needsQuizAttempt(item)) {
      scheduleStatus = 'IN_PROGRESS'
      nextAssigned = true
    } else if (item.status === 'IN_PROGRESS') {
      scheduleStatus = 'IN_PROGRESS'
      nextAssigned = true
    } else if (item.entryType === 'SCENARIO_QUIZ') {
      if (allLessonsCompleted && !nextAssigned) {
        scheduleStatus = 'NEXT'
        nextAssigned = true
      } else {
        scheduleStatus = 'LOCKED'
      }
    } else if (!nextAssigned) {
      scheduleStatus = 'NEXT'
      nextAssigned = true
    } else {
      scheduleStatus = 'LOCKED'
    }

    return { ...item, scheduleStatus }
  })
}
