import { describe, expect, it } from 'vitest'
import {
  isQuizInProgress,
  isSubChapterFullyCompleted,
  needsQuizAttempt,
} from '@/utils/subChapterProgress.js'
import { withScheduleStatus } from '@/utils/scheduleStatus.js'

describe('subChapterProgress', () => {
  it('needsQuizAttempt은 강좌 COMPLETED + quiz 미완료일 때 true', () => {
    expect(
      needsQuizAttempt({
        entryType: 'LESSON',
        status: 'COMPLETED',
        quiz: { completed: false, answeredCount: 0, totalCount: 3 },
      }),
    ).toBe(true)
  })

  it('isQuizCompleted는 progress.quiz.completed를 우선한다', () => {
    expect(
      isSubChapterFullyCompleted({
        entryType: 'LESSON',
        status: 'COMPLETED',
        quiz: { completed: true, answeredCount: 3, totalCount: 3 },
      }),
    ).toBe(true)
    expect(
      isSubChapterFullyCompleted({
        entryType: 'LESSON',
        status: 'COMPLETED',
        quiz: { completed: false, answeredCount: 1, totalCount: 3 },
      }),
    ).toBe(false)
  })

  it('activeAttemptId가 있으면 이전 완료 여부와 무관하게 퀴즈 진행 중이다', () => {
    expect(isQuizInProgress({ quiz: { completed: false, activeAttemptId: 3001 } })).toBe(true)
    expect(isQuizInProgress({ quiz: { completed: true, activeAttemptId: 3002 } })).toBe(true)
    expect(isQuizInProgress({ quiz: { completed: false, activeAttemptId: null } })).toBe(false)
  })

  it('소단원 완전 완료는 강좌와 퀴즈가 모두 완료되어야 한다', () => {
    expect(
      isSubChapterFullyCompleted({
        entryType: 'LESSON',
        status: 'IN_PROGRESS',
        quiz: { completed: true, activeAttemptId: null },
      }),
    ).toBe(false)
  })
})

describe('withScheduleStatus', () => {
  it('강좌만 완료한 소단원은 COMPLETED가 아니라 IN_PROGRESS(퀴즈 진행중)', () => {
    const [result] = withScheduleStatus([
      {
        order: 1,
        entryType: 'LESSON',
        status: 'COMPLETED',
        quiz: { completed: false, answeredCount: 0, totalCount: 3 },
      },
    ])
    expect(result.scheduleStatus).toBe('IN_PROGRESS')
  })

  it('퀴즈까지 완료한 소단원은 COMPLETED', () => {
    const [result] = withScheduleStatus([
      {
        order: 1,
        entryType: 'LESSON',
        status: 'COMPLETED',
        quiz: { completed: true, answeredCount: 3, totalCount: 3 },
      },
    ])
    expect(result.scheduleStatus).toBe('COMPLETED')
  })
})
