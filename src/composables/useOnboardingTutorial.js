import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/store/authStore.js'
import { useLevelTestStore } from '@/store/levelTestStore.js'

export const TUTORIAL_STEPS = [
  {
    key: 'questions',
    title: '기초 질문 풀기',
    description: '지금 알고 있는 만큼 편하게 답해요',
    toneClass: 'bg-[#e5f2e0]',
  },
  {
    key: 'recommend',
    title: '진단 결과로 추천 구성하기',
    description: '오답은 자동 포함, 정답은 장바구니',
    toneClass: 'bg-[#e0edf7]',
  },
  {
    key: 'adjust',
    title: '내 마음대로 조정하기',
    description: '필수 기초는 고정, 순서는 직접 조정',
    toneClass: 'bg-[#f5e5ed]',
  },
  {
    key: 'start',
    title: '바로 학습 시작하기',
    description: '완성된 시간표는 학습 탭에 저장돼요',
    toneClass: 'bg-[#faf2db]',
  },
]

export const DIAGNOSIS_PERIODS = [
  {
    order: 1,
    title: '예·적금',
    periodSubtitle: '기초 진단',
    scheduleStatus: 'NEXT',
  },
  {
    order: 2,
    title: '채권',
    periodSubtitle: '기초 진단',
    scheduleStatus: 'NEXT',
  },
  {
    order: 3,
    title: '주식',
    periodSubtitle: '기초 진단',
    scheduleStatus: 'NEXT',
  },
  {
    order: 4,
    title: '펀드',
    periodSubtitle: '기초 진단',
    scheduleStatus: 'NEXT',
  },
]

/** 안내 화면 (튜토리얼 → 진단 안내) */
export const useOnboardingIntro = () => {
  const router = useRouter()
  const authStore = useAuthStore()
  const levelTestStore = useLevelTestStore()

  /** @type {import('vue').Ref<'tutorial' | 'diagnosisIntro'>} */
  const step = ref('tutorial')
  const startError = ref('')
  const isStarting = ref(false)

  const tutorialRuledOffsets = computed(() =>
    Array.from({ length: 16 }, (_, index) => 52 + index * 22),
  )
  const tipRuledOffsets = computed(() => Array.from({ length: 4 }, (_, index) => 28 + index * 20))

  const onLater = () => {
    authStore.logout()
  }

  const goTutorial = () => {
    startError.value = ''
    step.value = 'tutorial'
  }

  const onTutorialStart = () => {
    startError.value = ''
    step.value = 'diagnosisIntro'
  }

  const onDiagnosisStart = async () => {
    startError.value = ''
    isStarting.value = true
    try {
      if (levelTestStore.attempt?.status !== 'IN_PROGRESS') {
        await levelTestStore.start()
      }
      await router.push({ name: 'onboarding-quiz' })
    } catch (err) {
      startError.value = err?.message || '레벨 테스트를 시작할 수 없습니다.'
    } finally {
      isStarting.value = false
    }
  }

  return {
    step,
    startError,
    isStarting,
    tutorialSteps: TUTORIAL_STEPS,
    diagnosisPeriods: DIAGNOSIS_PERIODS,
    tutorialRuledOffsets,
    tipRuledOffsets,
    onLater,
    goTutorial,
    onTutorialStart,
    onDiagnosisStart,
  }
}
