import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/store/authStore.js'
import { useCurriculumStore } from '@/store/curriculumStore.js'
import { useStudyStore } from '@/store/studyStore.js'
import { setCurriculumConfirmed } from '@/utils/curriculumConfirm.js'

/**
 * Figma 10 커리큘럼 시간표 · 확정(응답 미리보기)
 */
export const useCurriculumConfirm = () => {
  const router = useRouter()
  const route = useRoute()
  const authStore = useAuthStore()
  const studyStore = useStudyStore()
  const curriculumStore = useCurriculumStore()
  const { orderedItems, isLoading, isConfirming, error, confirmed, editMode } =
    storeToRefs(curriculumStore)

  const actionError = ref('')
  /** 학습 화면에서 ?mode=edit 로 들어온 경우만 수정 플로우 */
  const isEditMode = computed(() => route.query.mode === 'edit' || editMode.value)

  onMounted(async () => {
    if (orderedItems.value.length) return
    try {
      if (route.query.mode === 'edit') {
        await curriculumStore.fetchForEdit()
        return
      }
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

  /** TimetableSheet periods — 서버 확정/수정 Response items만 표시 */
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

    rows.push({
      order: '✓',
      title: isEditMode.value || confirmed.value ? '구성 적용 완료' : '구성 확정',
      periodSubtitle: `필수 1 + 선택 ${optionalCount.value} · 총 ${selected.length}과정`,
      scheduleStatus: 'COMPLETED',
      statusLabel: '완료',
    })

    return rows
  })

  const goEdit = () => {
    router.push({
      name: 'onboarding-curriculum',
      query: route.query.mode === 'edit' ? { mode: 'edit' } : undefined,
    })
  }

  /**
   * 학습 시작 / 학습으로
   * — sessionStorage onboarding_step 이 CURRICULUM 이면 가드가 /home·/learning 진입을 막음
   * — 반드시 HOME + curriculum_state.confirmed 를 맞춘 뒤 이동
   */
  const onStartLearning = async () => {
    actionError.value = ''
    try {
      if (!confirmed.value && route.query.mode !== 'edit') {
        await curriculumStore.confirm()
      }

      authStore.setOnboardingStep('HOME')
      setCurriculumConfirmed(true)
      editMode.value = false

      if (route.query.mode === 'edit') {
        studyStore.invalidateRoadmap()
        try {
          await Promise.all([
            studyStore.fetchCurriculum(),
            studyStore.fetchRoadmap({ force: true }),
          ])
        } catch {
          /* 학습 화면에서 재시도 */
        }
        await router.push({ name: 'learning' })
        return
      }

      await router.push({ name: 'home' })
    } catch (err) {
      actionError.value = err?.message || '이동에 실패했습니다.'
    }
  }

  return {
    orderedItems,
    periods,
    isLoading,
    isConfirming,
    isEditMode,
    error,
    actionError,
    goEdit,
    onStartLearning,
  }
}
