import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/api/admin/quizApi.js', () => ({
  getAdminQuizQuestions: vi.fn(),
  createAdminQuizQuestion: vi.fn(),
  createAdminQuizQuestionVersion: vi.fn(),
  patchAdminQuizQuestion: vi.fn(),
  publishAdminQuizQuestion: vi.fn(),
}))

import { createAdminQuizQuestion } from '@/api/admin/quizApi.js'
import {
  createQuizQuestion,
  defaultOptionsForType,
  formatAdminQuizError,
} from '@/services/adminQuizService.js'

describe('adminQuizService helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
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

  it('문항 등록 body는 live DTO snake_case다', async () => {
    createAdminQuizQuestion.mockResolvedValue({
      data: {
        data: {
          question_id: 1201,
          question_key: 'deposit-basic-001',
          version_no: 1,
          generation_type: 'HUMAN',
          status: 'DRAFT',
        },
      },
    })

    await createQuizQuestion({
      questionKey: 'deposit-basic-001',
      usageType: 'SUB_CHAPTER',
      mainChapterId: 2,
      subChapterId: 101,
      questionType: 'SINGLE_CHOICE',
      difficulty: 'EASY',
      prompt: '예금에 대한 설명으로 올바른 것은?',
      optionsJson: [
        { key: '1', label: '보기1', description: null },
        { key: '2', label: '보기2' },
      ],
      correctAnswerJson: { key: '1' },
      explanation: '해설',
      generationType: 'HUMAN',
    })

    expect(createAdminQuizQuestion).toHaveBeenCalledWith({
      question_key: 'deposit-basic-001',
      usage_type: 'SUB_CHAPTER',
      question_type: 'SINGLE_CHOICE',
      prompt: '예금에 대한 설명으로 올바른 것은?',
      options_json: [
        { key: '1', label: '보기1' },
        { key: '2', label: '보기2' },
      ],
      correct_answer_json: { key: '1' },
      explanation: '해설',
      difficulty: 'EASY',
      main_chapter_id: 2,
      sub_chapter_id: 101,
    })
  })
})
