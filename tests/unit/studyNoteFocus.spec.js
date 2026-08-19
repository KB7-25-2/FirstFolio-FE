import { describe, expect, it } from 'vitest'
import { findStudyNoteFocusIndex } from '@/utils/studyNoteFocus.js'

describe('findStudyNoteFocusIndex', () => {
  it('완료된 퀴즈의 재응시는 건너뛰고 진행해야 할 다음 소단원에 포커스한다', () => {
    const items = [
      {
        entryType: 'LESSON',
        status: 'COMPLETED',
        quiz: { completed: true, activeAttemptId: 3002 },
      },
      {
        entryType: 'LESSON',
        status: 'COMPLETED',
        quiz: { completed: false, activeAttemptId: null },
      },
      { entryType: 'LESSON', status: 'NOT_STARTED', quiz: null },
    ]

    expect(findStudyNoteFocusIndex(items)).toBe(1)
  })

  it('퀴즈 완료 후에도 강좌가 진행 중이면 해당 강좌에 포커스한다', () => {
    const items = [
      {
        entryType: 'LESSON',
        status: 'IN_PROGRESS',
        quiz: { completed: true, activeAttemptId: null },
      },
      { entryType: 'LESSON', status: 'NOT_STARTED', quiz: null },
    ]

    expect(findStudyNoteFocusIndex(items)).toBe(0)
  })
})
