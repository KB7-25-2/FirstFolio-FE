import { describe, expect, it } from 'vitest'
import { mapQuizAnswerGrading } from '@/services/study/mappers/quizMapper.js'

describe('mapQuizAnswerGrading', () => {
  it('대단원 최종 채점의 수료 여부와 재도전 액션을 보존한다', () => {
    const result = mapQuizAnswerGrading({
      attempt_id: 801,
      question_id: 91,
      selected_key: '1',
      is_correct: false,
      correct_answer: { key: '2' },
      attempt: { status: 'GRADED', answered_count: 3, total_count: 3 },
      main_chapter_completed: false,
      next_action: 'RETRY_MAIN_CHAPTER_QUIZ',
    })

    expect(result.mainChapterCompleted).toBe(false)
    expect(result.nextAction).toBe('RETRY_MAIN_CHAPTER_QUIZ')
    expect(result.attempt.status).toBe('GRADED')
  })
})
