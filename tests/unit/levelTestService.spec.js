import { beforeEach, describe, expect, it, vi } from 'vitest'

const { startLevelTestAttempt, saveLevelTestAttemptAnswers, submitLevelTestAttempt } = vi.hoisted(
  () => ({
    startLevelTestAttempt: vi.fn(),
    saveLevelTestAttemptAnswers: vi.fn(),
    submitLevelTestAttempt: vi.fn(),
  }),
)

vi.mock('@/api/user/levelTestApi.js', () => ({
  startLevelTestAttempt,
  saveLevelTestAttemptAnswers,
  submitLevelTestAttempt,
}))

import {
  getStoredLevelTestSession,
  saveLevelTestAnswers,
  startLevelTest,
  submitLevelTest,
} from '@/services/levelTestService.js'

describe('levelTestService', () => {
  beforeEach(() => {
    sessionStorage.clear()
    vi.clearAllMocks()
  })

  it('응시 시작 응답의 문항과 저장 답안을 화면 모델로 변환한다', async () => {
    startLevelTestAttempt.mockResolvedValue({
      data: {
        data: {
          attempt_id: 2001,
          status: 'IN_PROGRESS',
          question_count: 1,
          questions: [
            {
              question_id: 1001,
              display_order: 1,
              main_chapter: { main_chapter_id: 2, asset_type: 'DEPOSIT_SAVINGS' },
              question_type: 'SINGLE_CHOICE',
              generation_type: 'HUMAN',
              prompt: '금리가 오르면 예금 이자는?',
              scenario: null,
              choices: [
                { key: 'A', label: '대체로 늘어난다' },
                { key: 'B', label: '대체로 줄어든다' },
              ],
            },
          ],
          answers: [{ question_id: 1001, answer: { key: 'A' } }],
        },
      },
    })

    const { data } = await startLevelTest()

    expect(data.questions[0]).toMatchObject({
      questionId: 1001,
      mainChapterId: 2,
      assetType: 'DEPOSIT_SAVINGS',
      optionsJson: [
        { key: 'A', label: '대체로 늘어난다' },
        { key: 'B', label: '대체로 줄어든다' },
      ],
    })
    expect(data.savedAnswers).toEqual([{ questionId: 1001, selectedChoiceIds: ['A'] }])
    expect(getStoredLevelTestSession().answers).toEqual({ 1001: ['A'] })
  })

  it('응시 시작 응답의 camelCase 문항도 매핑한다', async () => {
    startLevelTestAttempt.mockResolvedValue({
      data: {
        data: {
          attemptId: 2002,
          status: 'IN_PROGRESS',
          questionCount: 1,
          questions: [
            {
              questionId: 1002,
              displayOrder: 1,
              questionType: 'SINGLE_CHOICE',
              generationType: 'HUMAN',
              prompt: '질문',
              scenario: null,
              choices: [{ key: 'A', label: '예' }],
              savedAnswer: { key: 'A' },
            },
          ],
          answers: [],
        },
      },
    })

    const { data } = await startLevelTest()
    expect(data.attemptId).toBe(2002)
    expect(data.questions[0].optionsJson[0]).toEqual({ key: 'A', label: '예' })
    expect(data.savedAnswers).toEqual([{ questionId: 1002, selectedChoiceIds: ['A'] }])
  })

  it('답안을 실제 API 계약의 answer.key 형식으로 저장한다', async () => {
    saveLevelTestAttemptAnswers.mockResolvedValue({
      data: {
        data: {
          attempt_id: 2001,
          saved_answer_count: 1,
          answered_count: 1,
          total_count: 8,
          status: 'IN_PROGRESS',
          updated_at: '2026-08-12T05:00:00Z',
        },
      },
    })

    await saveLevelTestAnswers(2001, {
      answers: [{ questionId: 1001, selectedChoiceIds: ['B'] }],
    })

    expect(saveLevelTestAttemptAnswers).toHaveBeenCalledWith(2001, {
      answers: [{ question_id: 1001, answer: { key: 'B' } }],
    })
  })

  it('최종 제출의 문항·대단원 결과를 변환하고 세션에 보관한다', async () => {
    submitLevelTestAttempt.mockResolvedValue({
      data: {
        data: {
          attempt_id: 2001,
          status: 'GRADED',
          question_results: [
            {
              question_id: 1001,
              main_chapter_id: 2,
              asset_type: 'DEPOSIT_SAVINGS',
              is_correct: false,
            },
          ],
          chapter_results: [
            {
              main_chapter_id: 2,
              asset_type: 'DEPOSIT_SAVINGS',
              total_count: 1,
              correct_count: 0,
              all_correct: false,
            },
          ],
          recommendations: [{ main_chapter_id: 2, source_type: 'LEVEL_TEST_WRONG' }],
          cart_candidates: [],
        },
      },
    })

    const { data } = await submitLevelTest(2001)

    expect(data.status).toBe('GRADED')
    expect(data.results[0].isCorrect).toBe(false)
    expect(data.chapterResults[0].correctCount).toBe(0)
    expect(getStoredLevelTestSession().submitResult).toEqual(data)
  })
})
