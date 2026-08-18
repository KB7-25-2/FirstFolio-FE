import { pickField } from '../studyResponseUtils.js'

/**
 * @typedef {import('@/types/study.js').QuizQuestion} QuizQuestion
 */

/**
 * OpenAPI QuizAttemptQuestionResponse → QuizQuestion (정답·해설 제외)
 * @param {object} raw
 * @returns {QuizQuestion}
 */
export const mapQuizAttemptQuestion = (raw) => {
  const answered = Boolean(pickField(raw, 'answered'))
  const selectedKey = pickField(raw, 'selectedKey', 'selected_key') ?? null
  const isCorrect = pickField(raw, 'isCorrect', 'is_correct')
  const correctRaw = raw.correctAnswer ?? raw.correct_answer
  const correctKey = correctRaw ? pickField(correctRaw, 'key') : null

  return {
    questionId: pickField(raw, 'questionId', 'question_id'),
    questionKey: String(pickField(raw, 'questionId', 'question_id') ?? ''),
    questionType: pickField(raw, 'questionType', 'question_type'),
    generationType: pickField(raw, 'generationType', 'generation_type'),
    prompt: raw.prompt,
    scenarioJson: raw.scenario ?? null,
    optionsJson: (raw.choices ?? []).map((choice) => ({
      key: pickField(choice, 'key', 'id'),
      label: pickField(choice, 'label', 'text'),
    })),
    correctAnswerJson: answered && correctKey != null ? { key: correctKey } : null,
    explanation: answered ? (raw.explanation ?? null) : null,
    status: 'PUBLISHED',
    displayOrder: pickField(raw, 'displayOrder', 'display_order'),
    answered,
    selectedKey,
    isCorrect: isCorrect ?? null,
  }
}

/**
 * @param {object} raw
 */
export const mapQuizAttemptStart = (raw) => ({
  attemptId: pickField(raw, 'attemptId', 'attempt_id'),
  quizType: pickField(raw, 'quizType', 'quiz_type'),
  mainChapterId: pickField(raw, 'mainChapterId', 'main_chapter_id'),
  subChapterId: pickField(raw, 'subChapterId', 'sub_chapter_id'),
  contentVersionId: pickField(raw, 'contentVersionId', 'content_version_id'),
  status: raw.status,
  questionCount: pickField(raw, 'questionCount', 'question_count'),
  questions: (raw.questions ?? []).map(mapQuizAttemptQuestion),
})

/**
 * @param {object} raw
 */
export const mapQuizAnswerGrading = (raw) => ({
  attemptId: pickField(raw, 'attemptId', 'attempt_id'),
  questionId: pickField(raw, 'questionId', 'question_id'),
  generationType: pickField(raw, 'generationType', 'generation_type'),
  selectedKey: pickField(raw, 'selectedKey', 'selected_key'),
  isCorrect: pickField(raw, 'isCorrect', 'is_correct'),
  correctAnswer: {
    key: pickField(raw.correctAnswer ?? raw.correct_answer ?? {}, 'key'),
  },
  explanation: raw.explanation ?? null,
  attempt: {
    status: raw.attempt?.status,
    answeredCount: pickField(raw.attempt ?? {}, 'answeredCount', 'answered_count'),
    totalCount: pickField(raw.attempt ?? {}, 'totalCount', 'total_count'),
    correctCount: pickField(raw.attempt ?? {}, 'correctCount', 'correct_count'),
    score: raw.attempt?.score ?? null,
    completed: raw.attempt?.completed ?? false,
  },
  reward: raw.reward
    ? {
        points: raw.reward.points ?? 0,
        pointTransactionId: pickField(raw.reward, 'pointTransactionId', 'point_transaction_id'),
      }
    : null,
  mainChapterCompleted: pickField(raw, 'mainChapterCompleted', 'main_chapter_completed'),
  nextAction: pickField(raw, 'nextAction', 'next_action'),
})
