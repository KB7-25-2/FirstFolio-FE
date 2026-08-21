<script setup>
defineOptions({ name: 'LearningRoadmapView' })

import { computed, nextTick, onActivated, onBeforeUnmount, onDeactivated, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import LearningLayout from '@/components/learning/LearningLayout.vue'
import LearningNotePaper from '@/components/learning/LearningNotePaper.vue'
import BaseLoading from '@/components/BaseLoading.vue'
import ScrollReveal from '@/components/ScrollReveal.vue'
import { useLearningRoadmap } from '@/composables/useLearningRoadmap.js'
import {
  getPersistedFocusStageIndex,
  getPersistedListScrollTop,
  persistRoadmapFocus,
  setPersistedFocusStageIndex,
  setPersistedListScrollTop,
} from '@/utils/learningRoadmapFocus.js'

const {
  isLoading,
  error,
  actionError,
  stages,
  activeStageIndex,
  hasRoadmap,
  statusLabel,
  periodStatusLabel,
  isPeriodQuizDue,
  accentClass,
  openPeriod,
  startScenarioQuiz,
  selectStage,
  focusMainChapterId,
  currentProgressMainChapterId,
} = useLearningRoadmap()

const listRef = ref(null)
/** 스크롤로 보이는 대단원 (상단 강조) */
const focusStageIndex = ref(getPersistedFocusStageIndex())
/** 화면 진입 시 실제 진행 대단원으로 자동 포커스했는지 여부 */
const hasFocusedCurrentProgress = ref(false)
/** 탭 전환으로 비활성일 때 activeStage 동기화가 포커스를 덮어쓰지 않게 */
const isViewActive = ref(true)

/** `scroll-mt-[3.75rem]` — 스크롤 스파이 마커와 scrollIntoView 오프셋을 맞춤 */
const SCROLL_SPY_OFFSET = 60

const orderLabel = (index) => String(index + 1).padStart(2, '0')

const periodDomId = (stage, period) =>
  `period-${period.progressId ?? `${stage.mainChapterId}-${period.order}`}`

const periodDoneCount = (stage) =>
  (stage.periods ?? []).filter((period) => period.scheduleStatus === 'COMPLETED').length

const periodTotalCount = (stage) => (stage.periods ?? []).length

const stageFillPercent = (stage) => {
  const total = periodTotalCount(stage)
  if (!total) return stage.status === 'COMPLETED' ? 100 : 0
  return Math.round((periodDoneCount(stage) / total) * 100)
}

const overall = computed(() => {
  let done = 0
  let total = 0
  for (const stage of stages.value) {
    const count = periodTotalCount(stage)
    total += count
    done += periodDoneCount(stage)
  }
  return {
    done,
    total,
    percent: total > 0 ? Math.round((done / total) * 100) : 0,
  }
})

const focusStage = computed(() => stages.value[focusStageIndex.value] ?? null)

const isPeriodCurrent = (period) =>
  isPeriodQuizDue(period) ||
  period.scheduleStatus === 'IN_PROGRESS' ||
  period.scheduleStatus === 'NEXT'

const isPeriodLocked = (stage, period) =>
  stage.status === 'LOCKED' || period.scheduleStatus === 'LOCKED'

const findCurrentPeriodTarget = () => {
  const list = stages.value
  if (!list.length) return null

  const preferredId = focusMainChapterId.value
  const ordered =
    preferredId != null
      ? [
          ...list.filter((stage) => stage.mainChapterId === preferredId),
          ...list.filter((stage) => stage.mainChapterId !== preferredId),
        ]
      : list

  for (const status of ['IN_PROGRESS', 'NEXT']) {
    for (const stage of ordered) {
      const period = (stage.periods ?? []).find((row) => row.scheduleStatus === status)
      if (period) {
        const stageIndex = list.findIndex((row) => row.mainChapterId === stage.mainChapterId)
        return { stage, period, stageIndex }
      }
    }
  }

  return null
}

/** listRef 내부만 스크롤 (document.scrollIntoView는 잘못된 조상으로 갈 수 있음) */
const scrollRootByDelta = (el, align = 'start', behavior = 'auto') => {
  const root = listRef.value
  if (!root || !el) return 0
  const delta = el.getBoundingClientRect().top - root.getBoundingClientRect().top
  let nextTop = root.scrollTop + delta
  if (align === 'start') nextTop -= SCROLL_SPY_OFFSET
  if (align === 'center') nextTop -= root.clientHeight / 2 - el.clientHeight / 2
  nextTop = Math.max(0, nextTop)
  if (behavior === 'smooth') root.scrollTo({ top: nextTop, behavior: 'smooth' })
  else root.scrollTop = nextTop
  setPersistedListScrollTop(nextTop)
  return nextTop
}

/** 클릭으로 이동 중에는 스크롤 스파이가 강조를 되돌리지 않게 잠금 */
const scrollSpyLocked = ref(false)
/** @type {ReturnType<typeof setTimeout> | null} */
let scrollSpyUnlockTimer = null
/** 프로그램matic 스크롤 직후 스파이 대신 유지할 대단원 인덱스 */
let pendingFocusStageIndex = null

const unlockScrollSpy = (runScrollSpy = true) => {
  scrollSpyLocked.value = false
  if (scrollSpyUnlockTimer != null) {
    clearTimeout(scrollSpyUnlockTimer)
    scrollSpyUnlockTimer = null
  }
  if (pendingFocusStageIndex != null) {
    focusStageIndex.value = pendingFocusStageIndex
    const stage = stages.value[pendingFocusStageIndex]
    if (stage) persistRoadmapFocus(pendingFocusStageIndex, stage.mainChapterId)
    else setPersistedFocusStageIndex(pendingFocusStageIndex)
    pendingFocusStageIndex = null
    return
  }
  if (runScrollSpy) updateFocusFromScroll()
}

const lockScrollSpyTemporarily = (ms = 500, preserveFocusIndex = null) => {
  scrollSpyLocked.value = true
  pendingFocusStageIndex = preserveFocusIndex
  if (scrollSpyUnlockTimer != null) clearTimeout(scrollSpyUnlockTimer)
  scrollSpyUnlockTimer = setTimeout(() => {
    unlockScrollSpy(preserveFocusIndex == null)
  }, ms)
}

const updateFocusFromScroll = () => {
  if (scrollSpyLocked.value) return

  const root = listRef.value
  if (!root || !stages.value.length) return

  const marker = root.getBoundingClientRect().top + SCROLL_SPY_OFFSET
  let current = 0

  for (let index = 0; index < stages.value.length; index += 1) {
    const stage = stages.value[index]
    const el = document.getElementById(`chapter-${stage.mainChapterId}`)
    if (!el) continue
    if (el.getBoundingClientRect().top <= marker) current = index
  }

  if (current !== focusStageIndex.value) {
    focusStageIndex.value = current
    const stage = stages.value[current]
    if (stage) persistRoadmapFocus(current, stage.mainChapterId)
    else setPersistedFocusStageIndex(current)
  }
  setPersistedListScrollTop(root.scrollTop)
}

/** 저장해 둔 scrollTop + 대단원 앵커로 listRef 복원 */
const scrollListToPersisted = () => {
  const root = listRef.value
  if (!root) return false

  const savedTop = getPersistedListScrollTop()
  const index = getPersistedFocusStageIndex()
  const stage = stages.value[index]

  // KeepAlive가 이미 스크롤을 갖고 있고 persist만 0이면 현재 DOM 값을 유지·저장
  if (savedTop <= 0 && root.scrollTop > 0) {
    setPersistedListScrollTop(root.scrollTop)
    return true
  }

  if (savedTop > 0) {
    root.scrollTop = savedTop
  }

  const applied = savedTop > 0 && Math.abs(root.scrollTop - savedTop) <= 8
  if (!applied && stage) {
    const el = document.getElementById(`chapter-${stage.mainChapterId}`)
    if (el) scrollRootByDelta(el, 'start', 'auto')
    if (savedTop > 0 && root.scrollHeight - root.clientHeight >= savedTop - 1) {
      root.scrollTop = savedTop
    }
  }

  // 복원 실패(높이 미확정)로 0이 되면 persist를 덮어쓰지 않음
  if (root.scrollTop > 0 || savedTop === 0) {
    setPersistedListScrollTop(root.scrollTop)
  }
  return true
}

const jumpToStage = async (index) => {
  focusStageIndex.value = index
  const stage = stages.value[index]
  if (stage) persistRoadmapFocus(index, stage.mainChapterId)
  else setPersistedFocusStageIndex(index)
  selectStage(index)
  lockScrollSpyTemporarily(700, index)
  await nextTick()
  if (!stage) {
    unlockScrollSpy(false)
    return
  }
  const el = document.getElementById(`chapter-${stage.mainChapterId}`)
  if (el) scrollRootByDelta(el, 'start', 'smooth')
}

const focusCurrentPeriod = async () => {
  await nextTick()
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))

  const currentProgressStageIndex = stages.value.findIndex(
    (stage) => stage.mainChapterId === currentProgressMainChapterId.value,
  )
  if (currentProgressStageIndex >= 0) {
    await jumpToStage(currentProgressStageIndex)
    return
  }

  const target = findCurrentPeriodTarget()
  if (target?.stageIndex >= 0) {
    await jumpToStage(target.stageIndex)
    return
  }

  if (focusMainChapterId.value != null) {
    const chapterIndex = stages.value.findIndex(
      (stage) => stage.mainChapterId === focusMainChapterId.value,
    )
    if (chapterIndex >= 0) await jumpToStage(chapterIndex)
  }
}

watch(activeStageIndex, (index) => {
  if (!isViewActive.value) return
  if (scrollSpyLocked.value) return
  if (index >= 0) {
    focusStageIndex.value = index
    const stage = stages.value[index]
    if (stage) persistRoadmapFocus(index, stage.mainChapterId)
  }
})

/** @type {ReturnType<typeof setTimeout> | null} */
let restoreRetryTimer = null

const restoreFocusSnapshot = async () => {
  focusStageIndex.value = getPersistedFocusStageIndex()
  lockScrollSpyTemporarily(1000, focusStageIndex.value)

  const run = () => {
    scrollListToPersisted()
  }

  await nextTick()
  run()
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
  run()

  // 탭 Transition(out-in ~220ms) 후 레이아웃 확정되면 재적용
  if (restoreRetryTimer != null) clearTimeout(restoreRetryTimer)
  restoreRetryTimer = setTimeout(() => {
    restoreRetryTimer = null
    run()
  }, 280)
}

watch(
  () => [hasRoadmap.value, isLoading.value],
  async ([ready, loading]) => {
    if (!ready || loading) return

    // 같은 화면 인스턴스에서는 사용자가 고른 스크롤 위치를 유지한다.
    if (hasFocusedCurrentProgress.value) {
      await restoreFocusSnapshot()
      return
    }

    hasFocusedCurrentProgress.value = true
    focusStageIndex.value = activeStageIndex.value
    const stage = stages.value[activeStageIndex.value]
    if (stage) persistRoadmapFocus(activeStageIndex.value, stage.mainChapterId)
    await focusCurrentPeriod()
    await nextTick()
    if (listRef.value) setPersistedListScrollTop(listRef.value.scrollTop)
  },
)

const saveFocusSnapshot = () => {
  if (listRef.value) setPersistedListScrollTop(listRef.value.scrollTop)
  const stage = stages.value[focusStageIndex.value]
  if (stage) persistRoadmapFocus(focusStageIndex.value, stage.mainChapterId)
  else setPersistedFocusStageIndex(focusStageIndex.value)
}

onDeactivated(() => {
  isViewActive.value = false
  saveFocusSnapshot()
})

onBeforeUnmount(() => {
  if (restoreRetryTimer != null) clearTimeout(restoreRetryTimer)
  saveFocusSnapshot()
})

onActivated(async () => {
  isViewActive.value = true
  // KeepAlive 재진입 시에도 실제 진행 중 대단원을 먼저 보여준다.
  // useLearningRoadmap의 onActivated가 이어하기·로드맵을 재조회한 뒤 watch에서 포커스한다.
  hasFocusedCurrentProgress.value = false
})
</script>

<template>
  <LearningLayout :pad-for-nav="false" lock-shell-scroll>
    <BaseLoading v-if="isLoading" />
    <p v-else-if="error" class="font-serif text-sm text-red-300">{{ error }}</p>

    <div v-else-if="hasRoadmap" class="flex min-h-0 flex-1 flex-col gap-3">
      <!-- 고정: 소개 + 전체 진행 -->
      <div class="shrink-0 space-y-3">
        <header class="chalk-header">
          <div class="flex w-full items-center justify-between gap-2">
            <div class="min-w-0">
              <p class="font-serif text-[10px] tracking-wide text-[var(--chalk-text-muted)]">
                나만의 금융 커리큘럼
              </p>
              <h1
                class="chalk-header__title mt-1 truncate font-pen text-[26px] leading-none font-normal text-[var(--chalk-text)]"
              >
                학습
              </h1>
            </div>
            <RouterLink
              :to="{ name: 'onboarding-curriculum', query: { mode: 'edit' } }"
              class="shrink-0 font-serif text-[11px] font-bold text-[#c17f24] underline-offset-2 hover:underline"
            >
              커리큘럼 수정
            </RouterLink>
          </div>
          <p class="mt-1.5 font-serif text-xs text-[rgba(41,33,26,0.55)]">
            대단원마다 소단원 진행을 확인하고 이어서 학습해요
          </p>
        </header>

        <p v-if="actionError" class="font-serif text-sm text-red-700">{{ actionError }}</p>

        <LearningNotePaper surface-class="bg-[#fffaed]" :show-pin="false">
          <div class="px-3.5 py-3">
            <div class="flex items-end justify-between gap-2">
              <div>
                <p class="font-serif text-[10px] tracking-wide text-[rgba(139,100,60,0.55)]">
                  전체 진행
                </p>
                <p class="mt-1 font-serif font-bold text-[22px] leading-none text-[#212b5c]">
                  {{ overall.done }}
                  <span class="text-[16px] text-[rgba(33,43,92,0.45)]"
                    >/ {{ overall.total }} 교시</span
                  >
                </p>
              </div>
              <p class="font-serif text-[12px] font-bold text-[#c17f24]">{{ overall.percent }}%</p>
            </div>

            <div class="learning-syllabus__overview mt-3" role="list" aria-label="대단원별 진행">
              <button
                v-for="(stage, index) in stages"
                :key="stage.curriculumItemId"
                type="button"
                class="learning-syllabus__seg"
                :class="{
                  'learning-syllabus__seg--active': index === focusStageIndex,
                  'learning-syllabus__seg--locked': stage.status === 'LOCKED',
                  'learning-syllabus__seg--done': stage.status === 'COMPLETED',
                }"
                role="listitem"
                :aria-label="`${stage.title} ${stageFillPercent(stage)}%`"
                @click="jumpToStage(index)"
              >
                <span class="learning-syllabus__seg-track" aria-hidden="true">
                  <span
                    class="learning-syllabus__seg-fill"
                    :style="{ width: `${stageFillPercent(stage)}%` }"
                  />
                </span>
                <span class="learning-syllabus__seg-label">{{ stage.title }}</span>
              </button>
            </div>
          </div>
        </LearningNotePaper>
      </div>

      <!-- 스크롤: 대단원 × 소단원 목차 (Navbar 오버레이 여백은 여기만) -->
      <div
        ref="listRef"
        data-scroll-reveal-root
        class="nav-scroll-pad hide-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain"
        @scroll.passive="updateFocusFromScroll"
      >
        <div
          v-if="focusStage"
          class="learning-syllabus__focus sticky top-0 z-10 mb-3"
          :class="accentClass(focusStage.accent)"
        >
          <div class="learning-syllabus__focus-inner">
            <span v-if="focusStage.icon" class="learning-syllabus__focus-icon" aria-hidden="true">
              {{ focusStage.icon }}
            </span>
            <div class="min-w-0 flex-1">
              <p class="font-serif text-[11px] leading-none text-[rgba(33,43,92,0.55)]">
                {{ orderLabel(focusStageIndex) }} · {{ statusLabel(focusStage.status) }}
              </p>
              <p
                class="mt-0.5 truncate font-serif font-bold text-[18px] leading-none text-[#212b5c]"
              >
                {{ focusStage.title }}
              </p>
            </div>
            <div class="shrink-0 text-right">
              <p class="font-serif text-[11px] font-bold text-[#c17f24]">
                {{ periodDoneCount(focusStage) }}/{{ periodTotalCount(focusStage) }}
              </p>
              <div
                class="mt-1 h-1 w-12 overflow-hidden rounded-[2px] bg-[rgba(44,24,16,0.12)]"
                aria-hidden="true"
              >
                <div
                  class="h-full rounded-[2px] bg-[#c17f24]"
                  :style="{ width: `${stageFillPercent(focusStage)}%` }"
                />
              </div>
            </div>
          </div>
        </div>

        <div class="space-y-3">
          <section
            v-for="(stage, stageIndex) in stages"
            :id="`chapter-${stage.mainChapterId}`"
            :key="stage.curriculumItemId"
            class="learning-syllabus__chapter scroll-mt-[3.75rem]"
            :class="{
              'learning-syllabus__chapter--active': stageIndex === focusStageIndex,
              'learning-syllabus__chapter--locked': stage.status === 'LOCKED',
            }"
          >
            <ScrollReveal>
              <LearningNotePaper :surface-class="accentClass(stage.accent)" :show-pin="false">
                <div class="px-3.5 py-3">
                  <button
                    type="button"
                    class="flex w-full items-start gap-2 text-left"
                    @click="jumpToStage(stageIndex)"
                  >
                    <span v-if="stage.icon" class="mt-0.5 text-lg leading-none" aria-hidden="true">
                      {{ stage.icon }}
                    </span>
                    <div class="min-w-0 flex-1">
                      <div class="flex items-start justify-between gap-2">
                        <p class="font-serif text-[13px] leading-none text-[rgba(33,43,92,0.5)]">
                          {{ orderLabel(stageIndex) }} · {{ statusLabel(stage.status) }}
                        </p>
                        <p class="shrink-0 font-serif text-[11px] font-bold text-[#c17f24]">
                          {{ periodDoneCount(stage) }}/{{ periodTotalCount(stage) }}
                        </p>
                      </div>
                      <h2
                        class="mt-1 flex items-center gap-1.5 font-serif font-bold text-[22px] leading-none text-[#212b5c]"
                      >
                        <span class="truncate">{{ stage.title }}</span>
                        <span
                          v-if="stage.status === 'COMPLETED'"
                          class="inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-[#598c52] font-sans text-[13px] text-white"
                          aria-label="대단원 완료"
                        >
                          ✓
                        </span>
                      </h2>
                      <p
                        v-if="stage.description"
                        class="mt-1.5 font-serif text-[11px] leading-snug text-[rgba(61,31,8,0.6)]"
                      >
                        {{ stage.description }}
                      </p>
                    </div>
                  </button>

                  <div
                    class="mt-2.5 h-1.5 w-full overflow-hidden rounded-[3px] bg-[rgba(44,24,16,0.12)]"
                    aria-hidden="true"
                  >
                    <div
                      class="h-full rounded-[3px] bg-[#c17f24] transition-[width] duration-200"
                      :style="{ width: `${stageFillPercent(stage)}%` }"
                    />
                  </div>

                  <p
                    v-if="stage.status === 'LOCKED'"
                    class="mt-2 font-serif text-[11px] text-[rgba(61,31,8,0.5)]"
                  >
                    이전 대단원을 완료하면 열려요
                  </p>

                  <ul v-if="stage.periods.length" class="learning-syllabus__list mt-3">
                    <li
                      v-for="(period, periodIndex) in stage.periods"
                      :key="period.progressId ?? `${stage.mainChapterId}-${period.order}`"
                    >
                      <button
                        :id="periodDomId(stage, period)"
                        type="button"
                        class="learning-syllabus__row"
                        :class="{
                          'learning-syllabus__row--done': period.scheduleStatus === 'COMPLETED',
                          'learning-syllabus__row--now': isPeriodCurrent(period),
                          'learning-syllabus__row--quiz': isPeriodQuizDue(period),
                          'learning-syllabus__row--locked': isPeriodLocked(stage, period),
                        }"
                        :disabled="isPeriodLocked(stage, period)"
                        @click="openPeriod(period)"
                      >
                        <span class="learning-syllabus__mark" aria-hidden="true">
                          <span
                            v-if="period.scheduleStatus === 'COMPLETED'"
                            class="learning-syllabus__check"
                          >
                            ✓
                          </span>
                          <span
                            v-else-if="isPeriodCurrent(period)"
                            class="learning-syllabus__dot"
                          />
                          <span v-else class="learning-syllabus__empty" />
                        </span>
                        <span class="learning-syllabus__row-body">
                          <span class="learning-syllabus__row-meta">
                            {{ orderLabel(periodIndex) }}교시 ·
                            {{ periodStatusLabel(period.scheduleStatus, period) }}
                          </span>
                          <span class="learning-syllabus__row-title">{{ period.title }}</span>
                        </span>
                      </button>
                    </li>
                  </ul>

                  <p v-else class="mt-3 font-serif text-[11px] text-[rgba(61,31,8,0.5)]">
                    표시할 소단원이 없습니다
                  </p>

                  <div
                    v-if="stage.scenarioReady"
                    class="mt-3 border-t border-[rgba(107,68,35,0.12)] pt-3"
                  >
                    <button
                      type="button"
                      class="cork-btn cork-btn--primary w-full"
                      @click="startScenarioQuiz(stage)"
                    >
                      {{ stage.scenarioTitle }}
                    </button>
                    <p class="mt-1.5 font-serif text-[10px] text-[rgba(61,31,8,0.55)]">
                      {{ stage.scenarioSubtitle }}
                    </p>
                  </div>
                </div>
              </LearningNotePaper>
            </ScrollReveal>
          </section>
        </div>
      </div>
    </div>

    <p v-else class="py-10 text-center font-serif text-sm text-[var(--cork-ink-muted)]">
      표시할 학습 목차가 없습니다
    </p>
  </LearningLayout>
</template>
