import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/api/admin/quizApi.js', () => ({
  getAdminQuizQuestions: vi.fn(),
  createAdminQuizQuestion: vi.fn(),
  createAdminQuizQuestionVersion: vi.fn(),
  patchAdminQuizQuestion: vi.fn(),
  publishAdminQuizQuestion: vi.fn(),
}))

import { defaultOptionsForType, formatAdminQuizError } from '@/services/adminQuizService.js'

describe('adminQuizService helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('TRUE_FALSE 기본 선택지는 O/X다', () => {
    expect(defaultOptionsForType('TRUE_FALSE').map((o) => o.key)).toEqual(['O', 'X'])
  })

  it('SINGLE_CHOICE 기본 선택지는 2개다', () => {
    expect(defaultOptionsForType('SINGLE_CHOICE')).toHaveLength(2)
  })

  it('검증 오류 메시지를 합친다', () => {
    const err = new Error('x')
    err.code = 'QUIZ_VALIDATION_ERROR'
    err.errors = ['a', 'b']
    expect(formatAdminQuizError(err)).toBe('a\nb')
  })
})
