<script setup>
import { computed, onActivated, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoute, useRouter } from 'vue-router'
import { useStudyStore } from '@/store/studyStore.js'
import { getMainChapterDisplay } from '@/constants/mainChapterDisplay.js'
import { withScheduleStatus } from '@/utils/scheduleStatus.js'
import LearningLayout from '@/components/learning/LearningLayout.vue'
import LearningPageHeader from '@/components/learning/LearningPageHeader.vue'
import TimetableSheet from '@/components/learning/TimetableSheet.vue'

const route = useRoute()
const router = useRouter()
const studyStore = useStudyStore()
const { curriculumItems, learningItems, scenarioQuizReady, scenarioQuizItem } =
  storeToRefs(studyStore)

const isLoading = ref(false)
const error = ref(null)
const actionError = ref(null)
const activeIndex = ref(0)

const sortedCurriculum = computed(() =>
  curriculumItems.value.slice().sort((a, b) => a.displayOrder - b.displayOrder),
)

const routeMainChapterId = computed(() => Number(route.params.mainChapterId))

const currentChapter = computed(() => sortedCurriculum.value[activeIndex.value] ?? null)

const unitIndexLabel = computed(() => {
  if (!sortedCurriculum.value.length) return ''
  return `${activeIndex.value + 1} / ${sortedCurriculum.value.length}`
})

const periods = computed(() => {
  if (currentChapter.value?.status === 'LOCKED') return []
  return withScheduleStatus(learningItems.value).filter(
    (item) => item.entryType !== 'SCENARIO_QUIZ',
  )
})

const scenarioCtaTitle = computed(() => scenarioQuizItem.value?.title ?? '대단원 실전 퀴즈')

const scenarioCtaSubtitle = computed(
  () => scenarioQuizItem.value?.periodSubtitle ?? '배운 내용을 실전 상황에서 점검해요',
)

const chapterDisplay = computed(() =>
  currentChapter.value ? getMainChapterDisplay(currentChapter.value.mainChapterId) : null,
)

const loadChapter = async (mainChapterId) => {
  isLoading.value = true
  error.value = null
  actionError.value = null
  try {
    if (!curriculumItems.value.length) {
      await studyStore.fetchCurriculum()
    }
    const index = sortedCurriculum.value.findIndex((item) => item.mainChapterId === mainChapterId)
    activeIndex.value = index >= 0 ? index : 0
    const chapter = sortedCurriculum.value[activeIndex.value]
    if (!chapter || chapter.status === 'LOCKED') return
    await studyStore.fetchLearningProgress(chapter.mainChapterId)
  } catch (err) {
    error.value = err?.message || '소단원 목록을 불러오지 못했습니다.'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadChapter(routeMainChapterId.value)
})

onActivated(() => {
  loadChapter(routeMainChapterId.value)
})

watch(routeMainChapterId, (id) => {
  loadChapter(id)
})

const syncRoute = (mainChapterId) => {
  if (Number(route.params.mainChapterId) === mainChapterId) return
  router.replace({
    name: 'learning-main-chapter',
    params: { mainChapterId },
  })
}

const goPrev = () => {
  if (activeIndex.value <= 0) return
  const chapter = sortedCurriculum.value[activeIndex.value - 1]
  syncRoute(chapter.mainChapterId)
}

const goNext = () => {
  if (activeIndex.value >= sortedCurriculum.value.length - 1) return
  const chapter = sortedCurriculum.value[activeIndex.value + 1]
  syncRoute(chapter.mainChapterId)
}

let touchStartX = 0
const onTouchStart = (event) => {
  touchStartX = event.changedTouches[0]?.clientX ?? 0
}
const onTouchEnd = (event) => {
  const endX = event.changedTouches[0]?.clientX ?? 0
  const delta = endX - touchStartX
  if (Math.abs(delta) < 48) return
  if (delta > 0) goPrev()
  else goNext()
}

const openPeriod = async (period) => {
  actionError.value = null
  if (period.scheduleStatus === 'LOCKED') return
  if (!period.subChapterId) return

  try {
    await studyStore.fetchSubChapterContent(period.subChapterId)
    const page = studyStore.currentContent?.progress?.lastPageId
    router.push({
      name: 'learning-lesson',
      params: { subChapterId: period.subChapterId },
      query: page ? { page } : undefined,
    })
  } catch (err) {
    if (err?.code === 'PREREQUISITE_REQUIRED') {
      actionError.value = '선행 학습을 먼저 완료해 주세요.'
    } else if (err?.code === 'SUB_CHAPTER_NOT_FOUND') {
      actionError.value = '공개된 소단원을 찾을 수 없습니다.'
    } else {
      actionError.value = err?.message || '학습 콘텐츠를 불러오지 못했습니다.'
    }
  }
}

const startScenarioQuiz = () => {
  if (!currentChapter.value || currentChapter.value.status === 'LOCKED') return
  router.push({
    name: 'learning-scenario-quiz',
    params: { mainChapterId: currentChapter.value.mainChapterId },
  })
}
</script>

<template>
  <LearningLayout>
    <template #header>
      <LearningPageHeader title="학습 시간표" />
    </template>

    <p class="mb-3 font-pen text-[14px] text-[rgba(245,237,217,0.5)]">
      ← 좌우 스와이프 = 대단원 · 상하 슬라이드 = 소단원 →
    </p>

    <p v-if="isLoading" class="font-serif text-sm text-[rgba(245,237,217,0.55)]">불러오는 중…</p>
    <p v-else-if="error" class="font-serif text-sm text-red-300">{{ error }}</p>

    <div
      v-else-if="currentChapter"
      class="flex min-h-0 w-full max-w-full flex-1 flex-col items-center overflow-x-hidden overflow-y-auto pb-2"
      @touchstart.passive="onTouchStart"
      @touchend.passive="onTouchEnd"
    >
      <div class="relative mx-auto w-full max-w-[300px]">
        <button
          type="button"
          class="absolute top-16 left-0 z-10 flex h-[160px] w-7 -translate-x-1/2 items-center justify-center rounded-r bg-[#e5dec7]/90 font-serif text-[10px] text-[rgba(41,33,26,0.45)] transition-opacity duration-200 hover:opacity-90 disabled:opacity-30"
          :disabled="activeIndex <= 0"
          aria-label="이전 대단원"
          @click="goPrev"
        >
          {{ activeIndex > 0 ? sortedCurriculum[activeIndex - 1].title.slice(0, 2) : '' }}
        </button>

        <TimetableSheet
          :title="currentChapter.title"
          :description="chapterDisplay?.description ?? ''"
          :unit-index="unitIndexLabel"
          :periods="periods"
          :chapter-locked="currentChapter.status === 'LOCKED'"
          :show-scenario-cta="scenarioQuizReady"
          :scenario-title="scenarioCtaTitle"
          :scenario-subtitle="scenarioCtaSubtitle"
          @select-period="openPeriod"
          @start-scenario="startScenarioQuiz"
        />

        <button
          type="button"
          class="absolute top-16 right-0 z-10 flex h-[160px] w-7 translate-x-1/2 items-center justify-center rounded-l bg-[#fff1a3]/90 font-serif text-[10px] text-[rgba(41,33,26,0.45)] transition-opacity duration-200 hover:opacity-90 disabled:opacity-30"
          :disabled="activeIndex >= sortedCurriculum.length - 1"
          aria-label="다음 대단원"
          @click="goNext"
        >
          {{
            activeIndex < sortedCurriculum.length - 1
              ? sortedCurriculum[activeIndex + 1].title.slice(0, 2)
              : ''
          }}
        </button>
      </div>

      <p v-if="actionError" class="mt-3 font-serif text-sm text-red-300">{{ actionError }}</p>
    </div>

    <template #footer>
      <div
        v-if="sortedCurriculum.length"
        class="flex shrink-0 items-center justify-center gap-1.5 pt-3 pb-1"
        aria-label="대단원 페이지"
      >
        <button
          v-for="(item, index) in sortedCurriculum"
          :key="item.curriculumItemId"
          type="button"
          class="size-1.5 rounded-full transition-colors"
          :class="index === activeIndex ? 'bg-[#c17f24]' : 'bg-[rgba(245,237,217,0.35)]'"
          :aria-label="`${item.title}로 이동`"
          @click="syncRoute(item.mainChapterId)"
        />
      </div>
    </template>
  </LearningLayout>
</template>
