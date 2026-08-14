import { describe, expect, it } from 'vitest'
import { isFoundationCompleted, shouldShowFoundationGuide } from '@/utils/foundationGuide.js'

describe('shouldShowFoundationGuide', () => {
  it('빈 목록이면 false', () => {
    expect(shouldShowFoundationGuide([])).toBe(false)
    expect(shouldShowFoundationGuide(null)).toBe(false)
    expect(shouldShowFoundationGuide(undefined)).toBe(false)
  })

  it('FOUNDATION이 ACTIVE이고 progress 0이면 true', () => {
    expect(
      shouldShowFoundationGuide([
        { chapterType: 'FOUNDATION', status: 'ACTIVE', progressPercent: 0 },
        { chapterType: 'CORE', status: 'LOCKED', progressPercent: 0 },
      ]),
    ).toBe(true)
  })

  it('FOUNDATION을 이미 시작했으면 false', () => {
    expect(
      shouldShowFoundationGuide([
        { chapterType: 'FOUNDATION', status: 'ACTIVE', progressPercent: 25 },
      ]),
    ).toBe(false)
  })

  it('FOUNDATION을 완료했으면 false', () => {
    expect(
      shouldShowFoundationGuide([
        { chapterType: 'FOUNDATION', status: 'COMPLETED', progressPercent: 100 },
        { chapterType: 'CORE', status: 'ACTIVE', progressPercent: 50 },
      ]),
    ).toBe(false)
  })

  it('FOUNDATION 아이템이 없으면 false', () => {
    expect(
      shouldShowFoundationGuide([{ chapterType: 'CORE', status: 'ACTIVE', progressPercent: 0 }]),
    ).toBe(false)
  })
})

describe('isFoundationCompleted', () => {
  it('FOUNDATION COMPLETED이면 true', () => {
    expect(
      isFoundationCompleted([
        { chapterType: 'FOUNDATION', status: 'COMPLETED' },
        { chapterType: 'CORE', status: 'ACTIVE' },
      ]),
    ).toBe(true)
  })

  it('FOUNDATION ACTIVE(미수료)이면 false', () => {
    expect(
      isFoundationCompleted([{ chapterType: 'FOUNDATION', status: 'ACTIVE', progressPercent: 0 }]),
    ).toBe(false)
  })

  it('커리큘럼이 없으면 false', () => {
    expect(isFoundationCompleted([])).toBe(false)
    expect(isFoundationCompleted(null)).toBe(false)
  })
})
