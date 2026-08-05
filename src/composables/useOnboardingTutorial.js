import { computed, ref } from 'vue'
import { useAuthStore } from '@/store/authStore.js'
import { useLevelTestStore } from '@/store/levelTestStore.js'

export const TUTORIAL_STEPS = [
  {
    key: 'questions',
    title: '기초 질문 4개 풀기',
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
    periodSubtitle: '1교시 · 기초 진단',
    scheduleStatus: 'NEXT',
  },
  {
    order: 2,
    title: '채권',
    periodSubtitle: '2교시 · 기초 진단',
    scheduleStatus: 'NEXT',
  },
  {
    order: 3,
    title: '주식',
    periodSubtitle: '3교시 · 기초 진단',
    scheduleStatus: 'NEXT',
  },
  {
    order: 4,
    title: '펀드',
    periodSubtitle: '4교시 · 기초 진단',
    scheduleStatus: 'NEXT',
  },
]

export const useOnboardingTutorial = () => {
  const authStore = useAuthStore()
  const levelTestStore = useLevelTestStore()

  /** @type {import('vue').Ref<'tutorial' | 'diagnosisIntro' | 'started'>} */
  const phase = ref('tutorial')
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
    phase.value = 'tutorial'
  }

  /** 01 → 02 진단 안내 */
  const onTutorialStart = () => {
    startError.value = ''
    phase.value = 'diagnosisIntro'
  }

  /** 02 → 레벨 테스트 응시 시작 */
  const onDiagnosisStart = async () => {
    startError.value = ''
    isStarting.value = true
    try {
      await levelTestStore.start()
      phase.value = 'started'
    } catch (err) {
      startError.value = err?.message || '레벨 테스트를 시작할 수 없습니다.'
    } finally {
      isStarting.value = false
    }
  }

  return {
    levelTestStore,
    phase,
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
