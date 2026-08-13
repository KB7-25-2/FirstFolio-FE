<script setup>
import { computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useDashboardStore } from '@/store/dashboardStore.js'
import { useStudyStore } from '@/store/studyStore.js'
import penguin from '@/assets/study/penguin.png'
import BaseLoading from '@/components/BaseLoading.vue'
import MemoPin from '@/components/MemoPin.vue'

const dashboardStore = useDashboardStore()
const studyStore = useStudyStore()
const router = useRouter()
const { chapterTitle, learningItems, continueRoute, isLoading, error } = storeToRefs(studyStore)
const {
  learning,
  learningContinueRoute,
  isLoading: dashboardLoading,
  error: dashboardError,
} = storeToRefs(dashboardStore)

onMounted(async () => {
  try {
    await dashboardStore.fetchDashboard()
  } catch {
    // dashboard 실패 시에도 학습 노트는 study 경로로 폴백
  }

  const dashLearning = learning.value
  if (dashLearning && dashLearning.available !== false && dashLearning.mainChapterId != null) {
    studyStore.isLoading = true
    studyStore.error = null
    try {
      await Promise.all([
        studyStore.fetchCurriculum(),
        studyStore.fetchLearningProgress(dashLearning.mainChapterId),
        studyStore.fetchContinuePosition(),
      ])
    } catch (err) {
      studyStore.error = err?.message || '학습 현황을 불러오지 못했습니다.'
    } finally {
      studyStore.isLoading = false
    }
    return
  }

  await studyStore.fetchStudyNote()
})

const noteLoading = computed(
  () => isLoading.value || (dashboardLoading.value && !learningItems.value.length),
)
const noteError = computed(() => {
  if (learning.value?.available === false) {
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

  let currentIdx = items.findIndex((item) => item.status === 'IN_PROGRESS')
  if (currentIdx < 0) {
    currentIdx = items.findIndex((item) => item.status === 'NOT_STARTED')
  }
  if (currentIdx < 0) {
    currentIdx = items.length - 1
  }

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

/** 복습 대상: 직전 완료 소단원 */
const reviewLesson = computed(() => roadmapNodes.value.find((node) => node.role === 'prev') ?? null)

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
</script>

<template>
  <div class="relative w-full max-w-[346px]">
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
            v-else-if="noteError"
            class="py-10 text-center font-serif text-xs text-[var(--study-total)]"
          >
            {{ noteError }}
          </div>

          <template v-else>
            <p class="font-serif text-[10px] font-bold tracking-wide text-[var(--study-muted)]">
              현재 학습 현황
            </p>
            <header class="flex h-9 items-end gap-2">
              <h2
                class="min-w-0 flex-1 font-serif font-bold text-[22px] leading-none text-[#212b5c]"
              >
                {{ chapterTitle || '학습 현황' }}
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
                        node.role === 'prev',
                      'border-[#c17f24] bg-[#c17f24] text-[#fff8ec] shadow-[0_0_0_3px_rgba(193,127,36,0.22)]':
                        node.role === 'current',
                      'border-[rgba(33,43,92,0.3)] bg-[#fffdf7] text-[rgba(33,43,92,0.5)]':
                        node.role === 'next',
                    }"
                  >
                    {{ node.role === 'prev' ? '✓' : node.order }}
                  </span>
                </div>

                <div
                  class="min-w-0 flex-1 rounded-[4px] px-2.5 py-2"
                  :class="{
                    'bg-[rgba(237,229,209,0.75)]': node.role === 'prev',
                    'border-[0.5px] border-[rgba(193,127,36,0.65)] bg-[#fae8a8]':
                      node.role === 'current',
                    'bg-[rgba(240,232,214,0.6)]': node.role === 'next',
                  }"
                >
                  <div class="flex items-center justify-between gap-2">
                    <span
                      class="font-serif text-[9px] font-bold tracking-wide"
                      :class="{
                        'text-[rgba(89,140,82,0.9)]': node.role === 'prev',
                        'text-[#c17f24]': node.role === 'current',
                        'text-[rgba(33,43,92,0.55)]': node.role === 'next',
                      }"
                    >
                      {{ node.roleLabel }}
                    </span>
                    <button
                      v-if="node.role === 'current' && effectiveContinueRoute"
                      type="button"
                      class="study-continue-cta shrink-0 rounded px-1.5 py-0.5 font-serif text-[12px] font-bold whitespace-nowrap text-[var(--study-continue)]"
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
                      v-else-if="node.role === 'prev'"
                      class="font-serif text-[9px] text-[rgba(89,140,82,0.9)]"
                    >
                      완료
                    </span>
                  </div>
                  <p
                    class="mt-0.5 font-serif text-[13px] leading-snug font-bold"
                    :class="{
                      'text-[rgba(41,33,26,0.5)] line-through': node.role === 'prev',
                      'text-[#29211a]': node.role === 'current',
                      'text-[rgba(41,33,26,0.72)]': node.role === 'next',
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
          </template>
        </div>
      </section>
    </div>
  </div>
</template>
