import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useLevelTestStore } from '@/store/levelTestStore.js'

const OPTION_TONES = ['green', 'blue', 'pink', 'yellow']

/** @type {Record<import('@/types/levelTest.js').AssetType, string>} */
const ASSET_LABELS = {
  DEPOSIT_SAVINGS: '예·적금',
  BOND: '채권',
  STOCK: '주식',
  FUND: '펀드',
}

/**
 * 레벨 테스트(금융 기초 진단) 퀴즈 UI
 * — 소단원 퀴즈와 동일 컴포넌트, 문항별 채점 없이 선택·저장 후 최종 제출
 */
export const useLevelTestQuiz = () => {
  const levelTestStore = useLevelTestStore()

  const {
    currentQuestion,
    questionTotal,
    questionNumber,
    isLastQuestion,
    isFirstQuestion,
    currentSelectedKey,
    allAnswersReady,
    isSaving,
    isSubmitting,
    error,
  } = storeToRefs(levelTestStore)

  const actionError = ref('')

  const examTitle = computed(() => '금융 기초 진단 시험')

  const subject = computed(() => {
    const asset = currentQuestion.value?.assetType
    return asset ? (ASSET_LABELS[asset] ?? asset) : '기초 진단'
  })

  /** @type {import('vue').ComputedRef<'IN_PROGRESS' | 'SELECTED'>} */
  const quizUiStatus = computed(() => (currentSelectedKey.value ? 'SELECTED' : 'IN_PROGRESS'))

  const statusBadge = computed(() => {
    if (quizUiStatus.value === 'SELECTED') {
      return { label: '답 선택', class: 'border-[#c17f24] text-[#c17f24]' }
    }
    return { label: '시험 중', class: 'border-[rgba(193,127,36,0.9)] text-[#c17f24]' }
  })

  const optionsWithTone = computed(() => {
    const options = currentQuestion.value?.optionsJson ?? []
    return options.map((opt, i) => ({
      ...opt,
      tone: OPTION_TONES[i % OPTION_TONES.length],
    }))
  })

  const primaryLabel = computed(() => {
    if (isSubmitting.value) return '제출 중…'
    if (isSaving.value) return '저장 중…'
    if (isLastQuestion.value) return '결과 제출하기'
    return '다음 문항 →'
  })

  const primaryEnabled = computed(() => {
    if (isSaving.value || isSubmitting.value) return false
    if (isLastQuestion.value) return allAnswersReady.value || !!currentSelectedKey.value
    return quizUiStatus.value === 'SELECTED'
  })

  const optionVariant = (key) => {
    if (quizUiStatus.value === 'SELECTED' && currentSelectedKey.value === key) return 'selected'
    return 'default'
  }

  const selectOption = (key) => {
    actionError.value = ''
    levelTestStore.selectChoice(key)
  }

  const onPrimaryAction = async () => {
    actionError.value = ''
    if (!currentSelectedKey.value) return

    try {
      await levelTestStore.saveAnswers()
      if (isLastQuestion.value) {
        await levelTestStore.submit()
        return 'submitted'
      }
      levelTestStore.goNextQuestion()
      return 'next'
    } catch (err) {
      actionError.value = err?.message || '처리에 실패했습니다.'
      return 'error'
    }
  }

  const goPrev = () => {
    actionError.value = ''
    levelTestStore.goPrevQuestion()
  }

  return {
    currentQuestion,
    questionTotal,
    questionNumber,
    isLastQuestion,
    isFirstQuestion,
    currentSelectedKey,
    allAnswersReady,
    isSaving,
    isSubmitting,
    storeError: error,
    actionError,
    examTitle,
    subject,
    quizUiStatus,
    statusBadge,
    optionsWithTone,
    primaryLabel,
    primaryEnabled,
    optionVariant,
    selectOption,
    onPrimaryAction,
    goPrev,
  }
}
