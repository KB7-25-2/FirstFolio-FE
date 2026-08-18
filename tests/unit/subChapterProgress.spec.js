import { describe, expect, it } from 'vitest'
import { isSubChapterFullyCompleted, needsQuizAttempt } from '@/utils/subChapterProgress.js'
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
})

describe('withScheduleStatus', () => {
  it('강좌만 완료한 소단원은 COMPLETED가 아니라 IN_PROGRESS(퀴즈 필요)', () => {
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
