<script setup>
import LearningNotePaper from '@/components/learning/LearningNotePaper.vue'
import SubChapterPeriodRow from '@/components/learning/SubChapterPeriodRow.vue'
import penguin from '@/assets/study/penguin.png'

defineProps({
  categoryLabel: { type: String, default: '금융 기초 카테고리' },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  unitIndex: { type: String, default: '' },
  /** @type {import('vue').PropType<Array>} */
  periods: { type: Array, default: () => [] },
  chapterLocked: { type: Boolean, default: false },
  /** 전체 LESSON 수료 후 실전 시나리오 퀴즈 CTA */
  showScenarioCta: { type: Boolean, default: false },
})

defineEmits(['select-period', 'start-scenario'])
</script>

<template>
  <div class="relative w-full max-w-full overflow-hidden">
    <div
      class="pointer-events-none absolute top-1 right-2 z-30 size-11 -rotate-[10deg] overflow-hidden rounded-full border-[2.5px] border-white bg-[#fffaed] shadow-[0_3px_6px_rgba(0,0,0,0.3)]"
      aria-hidden="true"
    >
      <img
        :src="penguin"
        alt=""
        class="absolute top-[8px] left-[2px] h-[26px] w-[36px] object-cover"
      />
    </div>

    <LearningNotePaper surface-class="bg-[#f5edd9]" :show-tape="true">
      <div class="relative px-4 pt-5 pb-4">
        <div class="flex items-start justify-between gap-2 pr-10">
          <div class="min-w-0">
            <p class="font-serif text-[10px] font-black text-[rgba(139,100,60,0.55)]">
              {{ categoryLabel }}
            </p>
            <h2 class="mt-1 font-pen text-[28px] leading-none text-[#212b5c]">{{ title }}</h2>
            <p class="mt-2 font-serif text-[11px] text-[rgba(139,100,60,0.7)]">{{ description }}</p>
          </div>
          <div
            v-if="unitIndex"
            class="shrink-0 -rotate-3 rounded border-[1.5px] border-[rgba(193,127,36,0.85)] px-2 py-1"
          >
            <p class="font-serif text-[11px] font-black whitespace-nowrap text-[#c17f24]">
              {{ unitIndex }}
            </p>
          </div>
        </div>

        <div class="mt-3 h-[1.5px] bg-[rgba(139,100,60,0.25)]" />
        <p class="mt-2.5 font-serif text-[10px] font-black text-[rgba(139,100,60,0.45)]">
          오늘의 교시 일정
        </p>

        <div v-if="chapterLocked" class="py-10 text-center">
          <p class="font-pen text-[18px] text-[rgba(139,100,60,0.55)]">아직 잠긴 대단원이에요</p>
          <p class="mt-1 font-serif text-[11px] text-[rgba(139,100,60,0.4)]">
            선행 대단원을 먼저 수료해 주세요
          </p>
        </div>

        <div
          v-else
          class="mt-2 flex max-h-[360px] flex-col gap-2 overflow-x-hidden overflow-y-auto pb-6"
        >
          <SubChapterPeriodRow
            v-for="period in periods"
            :key="`${period.order}-${period.subChapterId ?? period.title}`"
            :order="period.order"
            :title="period.title"
            :subtitle="period.periodSubtitle || period.shortLabel"
            :schedule-status="period.scheduleStatus"
            @select="$emit('select-period', period)"
          />

          <button
            v-if="showScenarioCta"
            type="button"
            class="memo-selectable mt-1 flex h-11 w-full items-center justify-center rounded-[6px] bg-[#c17f24] font-serif text-[13px] font-bold text-[#fff8ec] shadow-[0_2px_6px_rgba(139,80,20,0.3)]"
            @click="$emit('start-scenario')"
          >
            대단원 실전 퀴즈 시작 →
          </button>
        </div>

        <p
          v-if="!chapterLocked && periods.length && !showScenarioCta"
          class="pointer-events-none absolute bottom-3 left-0 w-full text-center font-pen text-[13px] text-[rgba(139,100,60,0.55)]"
        >
          위로 밀어 다음 교시 보기
        </p>
      </div>
    </LearningNotePaper>
  </div>
</template>
