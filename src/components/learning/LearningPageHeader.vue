<script setup>
import { computed } from 'vue'
import { formatKoreanDate } from '@/utils/date.js'

const props = defineProps({
  /** 화면 제목 (예: 학습 로드맵) */
  title: {
    type: String,
    required: true,
  },
  /** 날짜 라벨. 미전달 시 오늘 날짜 */
  dateLabel: {
    type: String,
    default: '',
  },
  /** 제목 위 작은 설명 (선택) */
  eyebrow: {
    type: String,
    default: '',
  },
})

const resolvedDate = computed(() => props.dateLabel || formatKoreanDate())
</script>

<template>
  <header class="relative">
    <p class="font-serif text-[10px] text-[rgba(245,237,217,0.55)]">
      {{ resolvedDate }}
    </p>
    <div class="mt-1 flex items-start justify-between gap-3">
      <div class="min-w-0 flex-1">
        <p v-if="eyebrow" class="mb-0.5 font-serif text-[10px] text-[rgba(245,237,217,0.55)]">
          {{ eyebrow }}
        </p>
        <h1 class="font-serif text-[21px] font-black text-[#f5edd9]">
          {{ title }}
        </h1>
      </div>
      <div v-if="$slots.badge || $slots.actions" class="shrink-0">
        <slot name="badge" />
        <slot name="actions" />
      </div>
    </div>
  </header>
</template>
