import { isQuizCompleted, isQuizInProgress, needsQuizAttempt } from '@/utils/subChapterProgress.js'

/**
 * StudyNote에서 현재 포커스할 소단원의 index를 반환한다.
 *
 * 퀴즈를 이미 완료한 소단원은 재응시(IN_PROGRESS attempt)가 있어도
 * 퀴즈 이어풀기 대상으로 선택하지 않는다. 강좌 자체가 진행 중이면
 * 강좌를 마칠 수 있도록 다음 우선순위에서 선택된다.
 *
 * @param {Array<import('@/types/study.js').LearningProgressItem>} items
 */
export const findStudyNoteFocusIndex = (items) => {
  let index = items.findIndex((item) => isQuizInProgress(item) && !isQuizCompleted(item))
  if (index >= 0) return index

  index = items.findIndex((item) => item.status === 'IN_PROGRESS')
  if (index >= 0) return index

  index = items.findIndex((item) => needsQuizAttempt(item))
  if (index >= 0) return index

  index = items.findIndex((item) => item.status === 'NOT_STARTED')
  return index >= 0 ? index : items.length - 1
}
