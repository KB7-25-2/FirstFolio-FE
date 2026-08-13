import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/store/authStore.js'
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
 */
export const useLevelTestQuiz = () => {
  const router = useRouter()
  const authStore = useAuthStore()
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

  onMounted(async () => {
    const existing = levelTestStore.attempt
    const options = levelTestStore.currentQuestion?.optionsJson ?? []
    const optionsBroken =
      existing?.status === 'IN_PROGRESS' &&
      (options.length === 0 || options.some((o) => !o?.key || !o?.label))

    // 이전 매핑 버그(id/text)로 저장된 세션이면 재시작
    if (existing?.status === 'IN_PROGRESS' && !optionsBroken) return

    try {
      await levelTestStore.start()
    } catch (err) {
      actionError.value = err?.message || '퀴즈를 불러오지 못했습니다.'
    }
  })

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
    if (isLastQuestion.value) return allAnswersReady.value
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
      await levelTestStore.saveAnswers([
        {
          questionId: currentQuestion.value.questionId,
          selectedChoiceIds: [currentSelectedKey.value],
        },
      ])
      if (isLastQuestion.value) {
        await levelTestStore.submit()
        authStore.setOnboardingStep('CURRICULUM')
        await router.push({ name: 'onboarding-result' })
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

  const goIntro = () => {
    router.push({ name: 'onboarding-intro' })
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
    goIntro,
  }
}
