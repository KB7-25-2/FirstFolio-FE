import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useCurriculumStore } from '@/store/curriculumStore.js'

/**
 * Figma 10 커리큘럼 시간표 · 확정
 */
export const useCurriculumConfirm = () => {
  const router = useRouter()
  const curriculumStore = useCurriculumStore()
  const { orderedItems, availableItems, isLoading, isConfirming, error } =
    storeToRefs(curriculumStore)

  const actionError = ref('')

  onMounted(async () => {
    if (orderedItems.value.length) return
    try {
      await curriculumStore.fetchDraft()
    } catch {
      /* store.error */
    }
  })

  const optionalCount = computed(
    () => orderedItems.value.filter((i) => i.sourceType !== 'REQUIRED').length,
  )

  const chapterSubtitle = (item) => {
    if (item.sourceType === 'REQUIRED') return '필수 선행 · 제거할 수 없음'
    if (item.sourceType === 'LEVEL_TEST_WRONG') return '진단 오답 · 추천 포함'
    return '장바구니에서 추가'
  }

  /** TimetableSheet periods */
  const periods = computed(() => {
    const rows = []
    const selected = orderedItems.value

    selected.forEach((item, index) => {
      const week = index + 1
      if (item.sourceType === 'REQUIRED') {
        rows.push({
          order: week,
          title: `${week}주차 · ${item.title}`,
          periodSubtitle: chapterSubtitle(item),
          scheduleStatus: 'IN_PROGRESS',
          statusLabel: '시작',
        })
        return
      }
      rows.push({
        order: week,
        title: `${week}주차 · ${item.title}`,
        periodSubtitle: chapterSubtitle(item),
        scheduleStatus: 'NEXT',
        statusLabel: '다음',
      })
    })

    availableItems.value.forEach((item, index) => {
      rows.push({
        order: selected.length + index + 1,
        title: `장바구니 · ${item.title}`,
        periodSubtitle: '원할 때 추가 가능',
        scheduleStatus: 'LOCKED',
        statusLabel: '선택',
      })
    })

    rows.push({
      order: '✓',
      title: '구성 확정',
      periodSubtitle: `필수 1 + 선택 ${optionalCount.value} · 총 ${selected.length}과정`,
      scheduleStatus: 'COMPLETED',
      statusLabel: '완료',
    })

    return rows
  })

  const goEdit = () => {
    router.push({ name: 'onboarding-curriculum' })
  }

  /** 학습 시작: 서버 확정 후 홈 */
  const onStartLearning = async () => {
    actionError.value = ''
    try {
      await curriculumStore.confirm()
      await router.push({ name: 'home' })
    } catch (err) {
      actionError.value = err?.message || '확정에 실패했습니다.'
    }
  }

  return {
    orderedItems,
    periods,
    isLoading,
    isConfirming,
    error,
    actionError,
    goEdit,
    onStartLearning,
  }
}
