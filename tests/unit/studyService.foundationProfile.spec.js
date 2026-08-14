import { afterEach, describe, expect, it } from 'vitest'
import {
  __getMockLearningProfile,
  __setMockLearningProfile,
  getContinuePosition,
  getCurriculum,
} from '@/services/studyService.js'
import { shouldShowFoundationGuide } from '@/utils/foundationGuide.js'

describe('studyService mock learning profile', () => {
  afterEach(() => {
    __setMockLearningProfile('mid-curriculum')
  })

  it('명시적으로 mid-curriculum으로 돌릴 수 있다', () => {
    __setMockLearningProfile('mid-curriculum')
    expect(__getMockLearningProfile()).toBe('mid-curriculum')
  })

  it('mid-curriculum에서는 기초 가이드가 필요 없다', async () => {
    __setMockLearningProfile('mid-curriculum')
    const { data } = await getCurriculum()
    expect(shouldShowFoundationGuide(data.items)).toBe(false)

    const foundation = data.items.find((item) => item.chapterType === 'FOUNDATION')
    expect(foundation?.status).toBe('COMPLETED')
  })

  it('foundation-pending에서는 FOUNDATION ACTIVE·progress 0이고 가이드가 필요하다', async () => {
    __setMockLearningProfile('foundation-pending')
    expect(__getMockLearningProfile()).toBe('foundation-pending')

    const { data } = await getCurriculum()
    const foundation = data.items.find((item) => item.chapterType === 'FOUNDATION')
    expect(foundation).toMatchObject({
      chapterType: 'FOUNDATION',
      status: 'ACTIVE',
      progressPercent: 0,
    })

    for (const item of data.items) {
      if (item.chapterType !== 'FOUNDATION') {
        expect(item.status).toBe('LOCKED')
      }
    }

    expect(shouldShowFoundationGuide(data.items)).toBe(true)
  })

  it('foundation-pending의 continue 위치는 기초 대단원을 가리킨다', async () => {
    __setMockLearningProfile('foundation-pending')
    const { data } = await getContinuePosition()
    expect(data.mainChapterId).toBe(1)
    expect(data.subChapterId).toBe(11)
    expect(data.route).toContain('/learning/sub-chapters/11')
  })

  it('알 수 없는 프로필이면 에러를 던진다', () => {
    expect(() => __setMockLearningProfile('unknown')).toThrow(/Unknown mock learning profile/)
  })
})
