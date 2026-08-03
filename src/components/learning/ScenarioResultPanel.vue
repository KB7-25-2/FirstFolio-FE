<script setup>
import { computed } from 'vue'

const props = defineProps({
  title: {
    type: String,
    default: '상담 평가',
  },
  correctCount: {
    type: Number,
    default: 0,
  },
  totalCount: {
    type: Number,
    default: 0,
  },
  quizScore: {
    type: Number,
    default: 0,
  },
  rewardStar: {
    type: Number,
    default: 0,
  },
  pointsGranted: {
    type: Number,
    default: 0,
  },
})

defineEmits(['confirm'])

const gradeLabel = computed(() => {
  if (props.quizScore >= 80) return '훌륭합니다'
  if (props.quizScore >= 50) return '무난합니다'
  return '다시 연습해 보세요'
})
</script>

<template>
  <div class="px-5 py-8 text-center">
    <p class="font-serif text-[11px] tracking-wide text-[rgba(139,100,60,0.65)]">SCENARIO RESULT</p>
    <p class="mt-1 font-serif text-[18px] font-black text-[#29211a]">{{ title }}</p>
    <p class="mt-2 font-pen text-[15px] text-[#212b5c]">{{ gradeLabel }}</p>

    <p class="mt-6 font-pen text-[40px] leading-none text-[#212b5c]">
      {{ correctCount }}
      <span class="text-[22px] text-[rgba(33,43,92,0.45)]">/ {{ totalCount }}</span>
    </p>
    <p class="mt-3 font-serif text-[13px] text-[rgba(61,31,8,0.75)]">정답률 {{ quizScore }}%</p>

    <div class="mt-5 flex flex-wrap items-center justify-center gap-2">
      <span
        v-if="rewardStar > 0"
        class="rounded border border-[rgba(193,127,36,0.45)] bg-[#fff7eb] px-3 py-1 font-serif text-[12px] font-bold text-[#c17f24]"
      >
        별 {{ rewardStar }}
      </span>
      <span
        v-if="pointsGranted > 0"
        class="rounded border border-[rgba(61,122,74,0.4)] bg-[#edf5e5] px-3 py-1 font-serif text-[12px] font-bold text-[#3d7a4a]"
      >
        포인트 +{{ pointsGranted }}
      </span>
      <span v-else class="font-serif text-[12px] text-[rgba(139,100,60,0.55)]">
        이번 응시 포인트 없음
      </span>
    </div>

    <button
      type="button"
      class="mt-8 flex h-12 w-full items-center justify-center rounded bg-[#c17f24] font-serif text-[15px] font-bold text-[#f5edd9]"
      @click="$emit('confirm')"
    >
      학습 목록으로
    </button>
  </div>
</template>
