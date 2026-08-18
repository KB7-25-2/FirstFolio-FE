import { computed, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import { useStudyStore } from '@/store/studyStore.js'
import { SCORE_PER_QUESTION } from '@/constants/quizPolicy.js'

const OPTION_TONES = ['green', 'blue', 'pink', 'yellow']

export const useSubChapterQuiz = () => {
  const route = useRoute()
  const router = useRouter()
  const studyStore = useStudyStore()

  const {
    currentContent,
    quizCurrentQuestion,
    quizQuestionTotal,
    quizQuestionNumber,
    quizIsLastQuestion,
    quizIsGraded,
    quizUiStatus,
    quizSelectedKey,
    quizFinished,
    quizCorrectCount,
    quizAttemptResult,
  } = storeToRefs(studyStore)

  const isLoading = ref(false)
  const error = ref(null)
  const isCompleting = ref(false)

  const subChapterId = computed(() => Number(route.params.subChapterId))

  const isTrueFalse = computed(() => quizCurrentQuestion.value?.questionType === 'TRUE_FALSE')

  const examTitle = computed(() => '금융 기초 퀴즈 시험')
  const subject = computed(() => currentContent.value?.title || `소단원 #${subChapterId.value}`)

  const statusBadge = computed(() => {
    if (quizFinished.value) {
      return { label: '완료', class: 'border-[#3d7a4a] text-[#3d7a4a]' }
    }
    const map = {
      IN_PROGRESS: { label: '시험 중', class: 'border-[rgba(193,127,36,0.9)] text-[#c17f24]' },
      SELECTED: { label: '답 선택', class: 'border-[#c17f24] text-[#c17f24]' },
      CORRECT: { label: '정답!', class: 'border-[rgba(193,127,36,0.9)] text-[#c17f24]' },
      WRONG: { label: '오답', class: 'border-[rgba(209,46,41,0.9)] text-[#d12e29]' },
    }
    return map[quizUiStatus.value]
  })

  const CIRCLE_NUM = { 1: '①', 2: '②', 3: '③', 4: '④' }

  const feedbackHint = computed(() => {
    if (quizUiStatus.value === 'CORRECT') return '잘했어요 · 빨간 펜으로 동그라미'
    if (quizUiStatus.value === 'WRONG') {
      const key = quizCurrentQuestion.value?.correctAnswerJson?.key
      const mark = CIRCLE_NUM[key] ?? key
      return `틀린 답에 찍!  ·  정답은 ${mark}`
    }
    return ''
  })

  const optionsWithTone = computed(() => {
    const options = quizCurrentQuestion.value?.optionsJson ?? []
    return options.map((opt, i) => ({
      ...opt,
      tone: OPTION_TONES[i % OPTION_TONES.length],
    }))
  })

  const primaryLabel = computed(() => {
    if (quizIsGraded.value) return quizIsLastQuestion.value ? '결과 보기' : '다음 문항 →'
    return '정답 제출'
  })

  const primaryEnabled = computed(() => {
    if (isCompleting.value || quizFinished.value) return false
    if (quizIsGraded.value) return true
    return quizUiStatus.value === 'SELECTED'
  })

  const optionVariant = (key) => {
    if (quizUiStatus.value === 'IN_PROGRESS') return 'default'
    if (quizUiStatus.value === 'SELECTED') {
      return quizSelectedKey.value === key ? 'selected' : 'default'
    }
    if (key === quizCurrentQuestion.value?.correctAnswerJson?.key) return 'correct'
    if (quizUiStatus.value === 'WRONG' && key === quizSelectedKey.value) return 'wrong'
    return 'default'
  }

  const loadQuiz = async () => {
    isLoading.value = true
    error.value = null
    try {
      await studyStore.startSubChapterQuiz(subChapterId.value)
    } catch (err) {
      studyStore.clearQuizSession()
      if (err?.code === 'QUESTIONS_NOT_FOUND') {
        error.value = '퀴즈 문항을 찾을 수 없습니다.'
      } else if (err?.code === 'PREREQUISITE_REQUIRED') {
        error.value = '선행 학습이 필요합니다.'
      } else if (err?.code === 'SUB_CHAPTER_NOT_FOUND') {
        error.value = '공개 소단원을 찾을 수 없습니다.'
      } else {
        error.value = err?.message || '퀴즈를 불러오지 못했습니다.'
      }
    } finally {
      isLoading.value = false
    }
  }

  onMounted(loadQuiz)

  watch(subChapterId, () => {
    loadQuiz()
  })

  const selectOption = (key) => {
    studyStore.selectQuizOption(key)
  }

  const onPrimaryAction = async () => {
    if (quizFinished.value) return

    if (quizIsGraded.value) {
      const finished = studyStore.goNextQuizQuestion()
      if (finished) {
        isCompleting.value = true
        try {
          await studyStore.completeQuizAttempt()
        } catch (err) {
          error.value = err?.message || '채점 결과를 저장하지 못했습니다.'
          studyStore.quizFinished = false
        } finally {
          isCompleting.value = false
        }
      }
      return
    }

    await studyStore.submitCurrentQuizQuestion()
  }

  const goToMainChapter = async () => {
    const mainChapterId = currentContent.value?.mainChapterId
    studyStore.clearQuizSession()
    if (mainChapterId) {
      router.push({
        name: 'learning',
        query: { mainChapterId: String(mainChapterId) },
      })
      return
    }
    router.back()
  }

  const giveUp = () => {
    goToMainChapter()
  }

  return {
    subChapterId,
    isTrueFalse,
    isLoading,
    error,
    examTitle,
    subject,
    scorePerQuestion: SCORE_PER_QUESTION,
    statusBadge,
    feedbackHint,
    quizCurrentQuestion,
    quizQuestionTotal,
    quizQuestionNumber,
    quizIsGraded,
    quizUiStatus,
    quizFinished,
    quizCorrectCount,
    quizAttemptResult,
    optionsWithTone,
    primaryLabel,
    primaryEnabled,
    optionVariant,
    selectOption,
    onPrimaryAction,
    giveUp,
    goToMainChapter,
  }
}
