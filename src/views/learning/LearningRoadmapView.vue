<script setup>
import { computed, nextTick, watch } from 'vue'
import LearningLayout from '@/components/learning/LearningLayout.vue'
import LearningPageHeader from '@/components/learning/LearningPageHeader.vue'
import LearningNotePaper from '@/components/learning/LearningNotePaper.vue'
import BaseLoading from '@/components/BaseLoading.vue'
import ScrollReveal from '@/components/ScrollReveal.vue'
import { useLearningRoadmap } from '@/composables/useLearningRoadmap.js'

const {
  isLoading,
  error,
  actionError,
  stages,
  activeStageIndex,
  hasRoadmap,
  statusLabel,
  periodStatusLabel,
  accentClass,
  openPeriod,
  startScenarioQuiz,
  selectStage,
  focusMainChapterId,
} = useLearningRoadmap()

const orderLabel = (index) => String(index + 1).padStart(2, '0')

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

const isPeriodCurrent = (period) =>
  period.scheduleStatus === 'IN_PROGRESS' || period.scheduleStatus === 'NEXT'

const isPeriodLocked = (stage, period) =>
  stage.status === 'LOCKED' || period.scheduleStatus === 'LOCKED'

const jumpToStage = async (index) => {
  selectStage(index)
  await nextTick()
  const stage = stages.value[index]
  if (!stage) return
  document
    .getElementById(`chapter-${stage.mainChapterId}`)
    ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

watch(
  () => [hasRoadmap.value, focusMainChapterId.value, isLoading.value],
  async ([ready, focusId, loading]) => {
    if (!ready || loading || focusId == null) return
    await nextTick()
    document
      .getElementById(`chapter-${focusId}`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  },
)
</script>

<template>
  <LearningLayout content-class="!overflow-hidden">
    <template #header>
      <LearningPageHeader title="학습 목차" subtitle="나만의 금융 커리큘럼" />
    </template>

    <BaseLoading v-if="isLoading" />
    <p v-else-if="error" class="font-serif text-sm text-red-300">{{ error }}</p>

    <div v-else-if="hasRoadmap" class="flex min-h-0 flex-1 flex-col gap-3">
      <!-- 고정: 소개 + 전체 진행 -->
      <div class="shrink-0 space-y-3">
        <div>
          <p class="mt-0.5 font-serif text-[11px] text-[var(--cork-ink-muted)]">
            대단원마다 소단원 진행을 확인하고 이어서 학습해요
          </p>
        </div>

        <p v-if="actionError" class="font-serif text-sm text-red-700">{{ actionError }}</p>

        <LearningNotePaper surface-class="bg-[#fffaed]" :show-pin="false">
          <div class="px-3.5 py-3">
            <div class="flex items-end justify-between gap-2">
              <div>
                <p class="font-serif text-[10px] tracking-wide text-[rgba(139,100,60,0.55)]">
                  전체 진행
                </p>
                <p class="mt-1 font-pen text-[22px] leading-none text-[#212b5c]">
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
                  'learning-syllabus__seg--active': index === activeStageIndex,
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

      <!-- 스크롤: 대단원 × 소단원 목차 -->
      <div
        data-scroll-reveal-root
        class="hide-scrollbar min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain pb-1"
      >
        <section
          v-for="(stage, stageIndex) in stages"
          :id="`chapter-${stage.mainChapterId}`"
          :key="stage.curriculumItemId"
          class="learning-syllabus__chapter scroll-mt-2"
          :class="{
            'learning-syllabus__chapter--active': stageIndex === activeStageIndex,
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
                      <p class="font-pen text-[13px] leading-none text-[rgba(33,43,92,0.5)]">
                        {{ orderLabel(stageIndex) }} · {{ statusLabel(stage.status) }}
                      </p>
                      <p class="shrink-0 font-serif text-[11px] font-bold text-[#c17f24]">
                        {{ periodDoneCount(stage) }}/{{ periodTotalCount(stage) }}
                      </p>
                    </div>
                    <h2 class="mt-1 font-pen text-[22px] leading-none text-[#212b5c]">
                      {{ stage.title }}
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
                      type="button"
                      class="learning-syllabus__row"
                      :class="{
                        'learning-syllabus__row--done': period.scheduleStatus === 'COMPLETED',
                        'learning-syllabus__row--now': isPeriodCurrent(period),
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
                        <span v-else-if="isPeriodCurrent(period)" class="learning-syllabus__dot" />
                        <span v-else class="learning-syllabus__empty" />
                      </span>
                      <span class="learning-syllabus__row-body">
                        <span class="learning-syllabus__row-meta">
                          {{ orderLabel(periodIndex) }}교시 ·
                          {{ periodStatusLabel(period.scheduleStatus) }}
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

    <p v-else class="py-10 text-center font-serif text-sm text-[var(--cork-ink-muted)]">
      표시할 학습 목차가 없습니다
    </p>
  </LearningLayout>
</template>
