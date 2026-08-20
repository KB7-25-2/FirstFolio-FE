import { describe, expect, it } from 'vitest'
import { findFocusedMainChapterId } from '@/utils/studyFocus.js'

describe('findFocusedMainChapterId', () => {
  const stages = [
    { mainChapterId: 2, status: 'ACTIVE', periods: [{ status: 'COMPLETED' }] },
    { mainChapterId: 3, status: 'ACTIVE', periods: [{ status: 'NOT_STARTED' }] },
  ]

  it('진행 중인 소단원의 이어하기 대단원을 ACTIVE 대단원보다 우선한다', () => {
    expect(
      findFocusedMainChapterId({
        continuePosition: { mainChapterId: 2, subChapterId: 101 },
        stages,
        curriculumItems: [{ mainChapterId: 3, status: 'ACTIVE' }],
      }),
    ).toBe(2)
  })

  it('진행 중인 시나리오의 이어하기 대단원을 우선한다', () => {
    expect(
      findFocusedMainChapterId({
        continuePosition: { mainChapterId: 2, subChapterId: null },
        stages,
        curriculumItems: [{ mainChapterId: 3, status: 'ACTIVE' }],
      }),
    ).toBe(2)
  })

  it('이어하기 정보가 없으면 로드맵의 진행 중 상태를 사용한다', () => {
    expect(
      findFocusedMainChapterId({
        stages: [
          { mainChapterId: 2, status: 'ACTIVE', periods: [{ status: 'IN_PROGRESS' }] },
          { mainChapterId: 3, status: 'ACTIVE', periods: [{ status: 'NOT_STARTED' }] },
        ],
        curriculumItems: [{ mainChapterId: 3, status: 'ACTIVE' }],
      }),
    ).toBe(2)
  })
})
