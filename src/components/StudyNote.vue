<script setup>
import { computed, onActivated, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useDashboardStore } from '@/store/dashboardStore.js'
import { useStudyStore } from '@/store/studyStore.js'
import { getCurriculumDraft } from '@/services/curriculumService.js'
import {
  isQuizInProgress,
  isSubChapterFullyCompleted,
  needsQuizAttempt,
} from '@/utils/subChapterProgress.js'
import { findStudyNoteFocusIndex } from '@/utils/studyNoteFocus.js'
import { findRecommendableOutsideCurriculum } from '@/utils/studyNoteRecommend.js'
import penguin from '@/assets/study/penguin.png'
import BaseLoading from '@/components/BaseLoading.vue'
import MemoPin from '@/components/MemoPin.vue'

/** public/ 자산 — 정적 src="/…" 는 Vitest에서 file:///… 로 깨짐 */
const celebrationGif = `${import.meta.env.BASE_URL}dance.gif`

const dashboardStore = useDashboardStore()
const studyStore = useStudyStore()
const router = useRouter()
const {
  chapterTitle,
  learningItems,
  continueRoute,
  isLoading,
  error,
  scenarioQuizReady,
  scenarioQuizItem,
  isFocusedMainChapterCompleted,
  isCurriculumFullyCompleted,
  focusedMainChapterId,
  curriculumItems,
} = storeToRefs(studyStore)
const {
  learning,
  learningContinueRoute,
  isLoading: dashboardLoading,
  error: dashboardError,
} = storeToRefs(dashboardStore)

/** @type {import('vue').Ref<Array<{ mainChapterId: number, title: string }>>} */
const recommendableChapters = ref([])

const hasRecommendableChapters = computed(() => recommendableChapters.value.length > 0)

const recommendTitlePreview = computed(() =>
  recommendableChapters.value
    .slice(0, 3)
    .map((item) => item.title)
    .join(' · '),
)

const refreshRecommendableChapters = async () => {
  if (!isCurriculumFullyCompleted.value) {
    recommendableChapters.value = []
    return
  }
  try {
    const { data } = await getCurriculumDraft()
    recommendableChapters.value = findRecommendableOutsideCurriculum({
      curriculumItems: curriculumItems.value,
      recommendationCandidates: data.recommendationCandidates,
      cartCandidates: data.cartCandidates,
    })
  } catch {
    recommendableChapters.value = []
  }
}

const loadStudyNote = async () => {
  try {
    await dashboardStore.ensureDashboard()
  } catch {
    // dashboard 실패 시에도 학습 노트는 study store 경로로 폴백
  }

  // 로드맵·학습 노트가 store에 있으면 API 생략
  if (studyStore.hasRoadmap) {
    if (learningItems.value.length && (continueRoute.value || learningContinueRoute.value)) {
      await studyStore.refreshLearningItems(undefined, { syncProgress: true })
      await refreshRecommendableChapters()
      return
    }
  }

  await studyStore.fetchStudyNote()
  await refreshRecommendableChapters()
}

let hasMounted = false
onMounted(async () => {
  await loadStudyNote()
  hasMounted = true
})
onActivated(() => {
  if (hasMounted) loadStudyNote()
})

const noteLoading = computed(
  () => isLoading.value || (dashboardLoading.value && !learningItems.value.length),
)
const noteError = computed(() => {
  if (learning.value?.available === false && !learningItems.value.length && !noteLoading.value) {
    return learning.value.reason === 'NOT_STARTED'
      ? '아직 시작한 학습이 없습니다.'
      : learning.value.reason || '이어갈 학습이 없습니다.'
  }
  return error.value || dashboardError.value
})

/** 이어하기 API route(page 쿼리 포함) 우선, dashboard 요약 경로는 폴백 */
const effectiveContinueRoute = computed(() => continueRoute.value || learningContinueRoute.value)

const ruledOffsets = computed(() => Array.from({ length: 10 }, (_, index) => 48 + index * 22))

/** 시나리오 퀴즈를 제외한 소단원 (order 순) */
const lessonItems = computed(() =>
  learningItems.value
    .filter((item) => item.entryType !== 'SCENARIO_QUIZ')
    .slice()
    .sort((a, b) => a.order - b.order),
)

/**
 * 직전 · 현재 · 다음 소단원만 로드맵 노드로
 * @returns {{ key: string|number, subChapterId: number|null, mainChapterId: number|null, order: number, title: string, role: 'prev'|'current'|'next', roleLabel: string, status: string }[]}
 */
const roadmapNodes = computed(() => {
  const items = lessonItems.value
  if (!items.length) return []

  const currentIdx = findStudyNoteFocusIndex(items)

  /** @type {{ key: string|number, subChapterId: number|null, mainChapterId: number|null, order: number, title: string, role: 'prev'|'current'|'next', roleLabel: string, status: string }[]} */
  const nodes = []

  const toNode = (item, role, roleLabel) => ({
    key: item.subChapterId ?? `${role}-${item.order}`,
    subChapterId: item.subChapterId,
    mainChapterId: item.mainChapterId,
    order: item.order,
    title: item.title,
    role,
    roleLabel,
    status: item.status,
    quizInProgress: isQuizInProgress(item),
    quizDue: needsQuizAttempt(item),
    fullyCompleted: isSubChapterFullyCompleted(item),
  })

  if (currentIdx > 0) {
    nodes.push(toNode(items[currentIdx - 1], 'prev', '직전'))
  }

  nodes.push(toNode(items[currentIdx], 'current', '현재'))

  if (currentIdx < items.length - 1) {
    nodes.push(toNode(items[currentIdx + 1], 'next', '다음'))
  }

  return nodes
})

/** 복습 대상: 직전 완료(퀴즈 포함) 소단원 */
const reviewLesson = computed(() => {
  const prev = roadmapNodes.value.find((node) => node.role === 'prev')
  if (!prev?.subChapterId) return null
  const item = lessonItems.value.find((row) => row.subChapterId === prev.subChapterId)
  return item && isSubChapterFullyCompleted(item) ? prev : null
})

/**
 * @param {string} routePath
 */
const resolveContinueLocation = (routePath) => {
  const resolved = router.resolve(routePath)
  if (resolved.matched.length) {
    return {
      name: resolved.name,
      params: resolved.params,
      query: resolved.query,
    }
  }
  return { name: 'learning' }
}

const onContinue = (event) => {
  event.stopPropagation()
  if (!effectiveContinueRoute.value) {
    router.push({ name: 'learning' })
    return
  }
  router.push(resolveContinueLocation(effectiveContinueRoute.value))
}

const goReviewLesson = (event) => {
  event.stopPropagation()
  const lesson = reviewLesson.value
  if (!lesson?.subChapterId) {
    router.push({ name: 'learning' })
    return
  }
  router.push({
    name: 'learning-lesson',
    params: { subChapterId: lesson.subChapterId },
  })
}

const goLearning = () => {
  router.push({ name: 'learning' })
}

const goCurriculumEdit = (event) => {
  event.stopPropagation()
  router.push({ name: 'onboarding-curriculum', query: { mode: 'edit' } })
}

const goScenarioQuiz = (event) => {
  event.stopPropagation()
  const mainChapterId = scenarioQuizItem.value?.mainChapterId ?? focusedMainChapterId.value
  if (!mainChapterId) return
  router.push({
    name: 'learning-scenario-quiz',
    params: { mainChapterId },
  })
}
</script>

<template>
  <div class="relative w-full max-w-[346px]" data-testid="study-note">
    <div
      class="memo-selectable relative z-10"
      role="button"
      tabindex="0"
      aria-label="현재 학습 현황으로 이동"
      @click="goLearning"
      @keydown.enter="goLearning"
    >
      <MemoPin side="left" tone="study" />

      <div
        class="pointer-events-none absolute -top-5 -right-1 z-20 size-11 rotate-8 overflow-hidden rounded-[22px] border-[2.5px] border-white bg-[var(--study-sticker)] shadow-[0_3px_6px_rgba(0,0,0,0.3)]"
        aria-hidden="true"
      >
        <img
          :src="penguin"
          alt=""
          class="absolute top-[8px] left-[2px] h-[25px] w-[34px] object-cover"
        />
      </div>

      <section
        class="relative min-h-[220px] w-full -rotate-[0.9deg] overflow-hidden rounded-[3px] border-[0.5px] border-[var(--study-border)] bg-[var(--study-surface)] shadow-[0_4px_10px_rgba(0,0,0,0.3)]"
        aria-label="현재 학습 현황"
      >
        <div class="pointer-events-none absolute inset-0" aria-hidden="true">
          <div
            v-for="top in ruledOffsets"
            :key="top"
            class="absolute left-0 h-px w-full bg-[var(--study-line)]"
            :style="{ top: `${top}px` }"
          />
        </div>
        <div class="relative flex min-h-[260px] flex-col gap-1 px-4 py-3">
          <BaseLoading
            v-if="noteLoading"
            class="py-10 text-center"
            tone="onLight"
            size="xs"
            message="학습 현황을 불러오는 중…"
          />
          <div
            v-else-if="noteError && !isCurriculumFullyCompleted"
            class="py-10 text-center font-serif text-xs text-[var(--study-total)]"
          >
            {{ noteError }}
          </div>

          <template v-else-if="isCurriculumFullyCompleted">
            <p
              class="font-serif text-[10px] font-bold tracking-wide"
              :class="
                hasRecommendableChapters
                  ? 'text-[rgba(193,127,36,0.9)]'
                  : 'text-[rgba(89,140,82,0.85)]'
              "
            >
              {{ hasRecommendableChapters ? '다음 학습 추천' : '학습 완료' }}
            </p>
            <div
              class="mt-2 flex flex-1 flex-col items-center justify-center rounded-[6px] border-[0.5px] border-dashed px-4 py-8 text-center"
              :class="
                hasRecommendableChapters
                  ? 'border-[rgba(193,127,36,0.45)] bg-[rgba(250,232,168,0.55)]'
                  : 'border-[rgba(89,140,82,0.45)] bg-[rgba(238,248,234,0.85)]'
              "
            >
              <img
                :src="celebrationGif"
                alt=""
                class="max-h-[100px] w-[100px] select-none object-contain"
                width="100"
                height="100"
                decoding="async"
                draggable="false"
              />
              <!-- <span
                class="flex size-11 items-center justify-center rounded-full font-sans text-[22px] text-white"
                :class="
                  hasRecommendableChapters
                    ? 'bg-[#c17f24] shadow-[0_2px_6px_rgba(193,127,36,0.35)]'
                    : 'bg-[#598c52] shadow-[0_2px_6px_rgba(89,140,82,0.35)]'
                "
                aria-hidden="true"
              >
                {{ hasRecommendableChapters ? '＋' : '✓' }}
              </span> -->
              <p
                class="mt-3 font-serif text-[17px] leading-snug font-black"
                :class="hasRecommendableChapters ? 'text-[#7a4e12]' : 'text-[#2f5a2c]'"
              >
                현재 설정하신 모든 커리큘럼을<br />수료하셨습니다!
              </p>
              <template v-if="hasRecommendableChapters">
                <p class="mt-2 font-serif text-[12px] leading-relaxed text-[rgba(122,78,18,0.85)]">
                  아직 담지 않은 대단원이 있어요.<br />커리큘럼에 추가해 볼까요?
                </p>
                <p
                  v-if="recommendTitlePreview"
                  class="mt-2 max-w-full truncate font-serif text-[11px] font-bold text-[#c17f24]"
                >
                  {{ recommendTitlePreview }}{{ recommendableChapters.length > 3 ? ' …' : '' }}
                </p>
                <button
                  type="button"
                  class="mt-5 rounded bg-[#c17f24] px-3 py-1.5 font-serif text-[11px] font-bold text-white transition-transform duration-150 hover:scale-[1.02] active:scale-[0.97]"
                  @click.stop="goCurriculumEdit"
                >
                  커리큘럼에 담기 →
                </button>
              </template>
              <template v-else>
                <p class="mt-2 font-serif text-[12px] leading-relaxed text-[rgba(61,107,56,0.8)]">
                  다음 업데이트를 기다려주세요!
                </p>
                <button
                  type="button"
                  class="mt-5 rounded bg-[rgba(89,140,82,0.92)] px-3 py-1.5 font-serif text-[11px] font-bold text-white transition-transform duration-150 hover:scale-[1.02] active:scale-[0.97]"
                  @click.stop="goLearning"
                >
                  로드맵 다시 보기 →
                </button>
              </template>
            </div>
          </template>

          <template v-else>
            <p class="font-serif text-[10px] font-bold tracking-wide text-[var(--study-muted)]">
              현재 학습 현황
            </p>
            <header class="flex h-9 items-end gap-2">
              <h2
                class="flex min-w-0 flex-1 items-center gap-1.5 font-serif font-bold text-[22px] leading-none text-[#212b5c]"
              >
                <span class="truncate">{{ chapterTitle || '학습 현황' }}</span>
                <span
                  v-if="isFocusedMainChapterCompleted"
                  class="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-[#598c52] font-sans text-[13px] text-white"
                  aria-label="대단원 완료"
                >
                  ✓
                </span>
              </h2>
            </header>

            <!-- 복습 유도 -->
            <button
              v-if="reviewLesson"
              type="button"
              class="mt-1 w-full rounded-[4px] border-[0.5px] border-[rgba(89,140,82,0.35)] bg-[#eef8ea] px-3 py-2.5 text-left transition-transform duration-150 hover:scale-[1.01]"
              :aria-label="`${reviewLesson.title} 복습하기`"
              @click="goReviewLesson"
            >
              <p class="font-serif font-bold text-[16px] leading-none text-[#3d6b38]">
                다시 한 번 복습해볼까요?
              </p>
              <div class="mt-2 flex items-center justify-between gap-2">
                <div class="min-w-0">
                  <p
                    class="font-serif text-[9px] font-bold tracking-wide text-[rgba(89,140,82,0.85)]"
                  >
                    복습 · 직전 소단원
                  </p>
                  <p class="mt-0.5 truncate font-serif text-[13px] font-bold text-[#29211a]">
                    {{ reviewLesson.order }}. {{ reviewLesson.title }}
                  </p>
                </div>
                <span
                  class="shrink-0 rounded bg-[rgba(89,140,82,0.9)] px-2 py-1 font-serif text-[10px] font-bold text-white"
                >
                  강좌 →
                </span>
              </div>
            </button>

            <p class="mt-2 font-serif text-[9px] text-[var(--study-muted)]">학습 진행 로드맵</p>

            <ol
              v-if="roadmapNodes.length"
              class="relative mt-1 flex flex-col py-1 pl-0"
              aria-label="직전 · 현재 · 다음 소단원"
            >
              <!-- 경로 세로선 -->
              <span
                v-if="roadmapNodes.length > 1"
                class="pointer-events-none absolute top-4 bottom-6 left-[15px] w-0.5 bg-[rgba(139,100,60,0.28)]"
                aria-hidden="true"
              />

              <li
                v-for="node in roadmapNodes"
                :key="node.key"
                class="relative z-[1] mb-2.5 flex items-stretch gap-3 last:mb-0"
              >
                <div class="flex w-8 shrink-0 items-start justify-center pt-1">
                  <span
                    class="flex size-8 items-center justify-center rounded-full border-[0.5px] font-serif text-[15px] leading-none"
                    :class="{
                      'border-[rgba(89,140,82,0.75)] bg-[#e8f5e4] text-[#598c52]':
                        node.fullyCompleted,
                      'border-[#c17f24] bg-[#c17f24] text-[#fff8ec] shadow-[0_0_0_3px_rgba(193,127,36,0.22)]':
                        node.role === 'current' && !node.fullyCompleted,
                      'border-[rgba(33,43,92,0.3)] bg-[#fffdf7] text-[rgba(33,43,92,0.5)]':
                        !node.fullyCompleted && (node.role === 'next' || node.role === 'prev'),
                    }"
                  >
                    {{ node.fullyCompleted ? '✓' : node.order }}
                  </span>
                </div>

                <div
                  class="min-w-0 flex-1 rounded-[4px] px-2.5 py-2"
                  :class="{
                    'bg-[rgba(237,229,209,0.75)]': node.role === 'prev' && node.fullyCompleted,
                    'border-[0.5px] border-[rgba(193,127,36,0.65)] bg-[#fae8a8]':
                      node.role === 'current',
                    'bg-[rgba(240,232,214,0.6)]':
                      node.role === 'next' || (node.role === 'prev' && !node.fullyCompleted),
                  }"
                >
                  <div class="flex items-center justify-between gap-2">
                    <span
                      class="font-serif text-[9px] font-bold tracking-wide"
                      :class="{
                        'text-[rgba(89,140,82,0.9)]': node.role === 'prev' && node.fullyCompleted,
                        'text-[#c17f24]': node.role === 'current',
                        'text-[rgba(33,43,92,0.55)]':
                          node.role === 'next' || (node.role === 'prev' && !node.fullyCompleted),
                      }"
                    >
                      {{ node.roleLabel }}
                    </span>
                    <span
                      v-if="node.role === 'current' && node.quizInProgress"
                      class="font-serif text-[9px] font-bold text-[#c17f24]"
                    >
                      퀴즈 진행중
                    </span>
                    <span
                      v-else-if="node.role === 'current' && node.quizDue"
                      class="font-serif text-[9px] font-bold text-[#c17f24]"
                    >
                      퀴즈 풀기
                    </span>
                    <button
                      v-else-if="node.role === 'current' && effectiveContinueRoute"
                      type="button"
                      class="shrink-0 rounded bg-[rgba(89,140,82,0.9)] px-2 py-1 font-serif text-[10px] font-bold whitespace-nowrap text-white transition-transform duration-150 hover:scale-[1.02] active:scale-[0.97]"
                      @click.stop="onContinue"
                    >
                      이어서 →
                    </button>
                    <span
                      v-else-if="node.role === 'current' && node.status === 'IN_PROGRESS'"
                      class="font-serif text-[9px] text-[#c17f24]"
                    >
                      진행 중
                    </span>
                    <span
                      v-else-if="node.role === 'prev' && node.fullyCompleted"
                      class="font-serif text-[9px] text-[rgba(89,140,82,0.9)]"
                    >
                      완료
                    </span>
                  </div>
                  <p
                    class="mt-0.5 font-serif text-[13px] leading-snug font-bold"
                    :class="{
                      'text-[rgba(41,33,26,0.5)] line-through':
                        node.role === 'prev' && node.fullyCompleted,
                      'text-[#29211a]': node.role === 'current',
                      'text-[rgba(41,33,26,0.72)]':
                        node.role === 'next' || (node.role === 'prev' && !node.fullyCompleted),
                    }"
                  >
                    {{ node.order }}. {{ node.title }}
                  </p>
                </div>
              </li>
            </ol>

            <p v-else class="py-8 text-center font-serif text-[11px] text-[var(--study-muted)]">
              표시할 학습 구간이 없습니다
            </p>

            <!-- 대단원 실전 퀴즈 CTA -->
            <button
              v-if="scenarioQuizReady"
              type="button"
              class="mt-3 w-full rounded-[4px] border-[0.5px] border-[rgba(33,43,92,0.35)] bg-[#eef0fc] px-3 py-2.5 text-left transition-transform duration-150 hover:scale-[1.01]"
              aria-label="대단원 실전 퀴즈 시작"
              @click.stop="goScenarioQuiz"
            >
              <p class="font-serif font-bold text-[15px] leading-none text-[#212b5c]">
                실전 퀴즈에 도전해볼까요? 🎯
              </p>
              <div class="mt-2 flex items-center justify-between gap-2">
                <p class="font-serif text-[11px] text-[rgba(33,43,92,0.6)]">
                  {{ scenarioQuizItem?.title || '대단원 실전 퀴즈' }}
                </p>
                <span
                  class="shrink-0 rounded bg-[#212b5c] px-2 py-1 font-serif text-[10px] font-bold text-white"
                >
                  시작 →
                </span>
              </div>
            </button>
          </template>
        </div>
      </section>
    </div>
  </div>
</template>
