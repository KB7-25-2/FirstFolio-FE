<script setup>
import { computed } from 'vue'

const props = defineProps({
  /** CHAPTER 라벨 (예: CHAPTER 01) */
  chapterLabel: {
    type: String,
    default: '',
  },
  /** 소단원/챕터 제목 */
  title: {
    type: String,
    required: true,
  },
  /** 현재 페이지 (1-based) */
  current: {
    type: Number,
    default: 1,
  },
  /** 전체 페이지 수 */
  total: {
    type: Number,
    default: 1,
  },
})

const progressPercent = computed(() => {
  if (props.total <= 0) return 0
  return Math.min(100, Math.max(0, (props.current / props.total) * 100))
})

const counterLabel = computed(() => `${props.current} / ${props.total}`)
</script>

<template>
  <div class="flex w-full flex-col gap-2.5">
    <div class="flex items-center gap-2 py-0.5">
      <div class="min-w-0 flex-1">
        <p
          v-if="chapterLabel"
          class="text-[10px] leading-[14px] font-medium tracking-[0.4px] text-[#c17f24]"
        >
          {{ chapterLabel }}
        </p>
        <p class="truncate text-[13px] leading-5 font-bold text-[var(--cork-ink)]">
          {{ title }}
        </p>
      </div>
      <p class="shrink-0 text-[12px] font-bold text-[#c17f24]">
        {{ counterLabel }}
      </p>
    </div>
    <div class="relative h-1.5 w-full overflow-hidden rounded-[3px] bg-[rgba(44,24,16,0.16)]">
      <div
        class="absolute top-0 left-0 h-1.5 rounded-[3px] bg-[#c17f24] transition-[width] duration-200"
        :style="{ width: `${progressPercent}%` }"
      />
    </div>
  </div>
</template>
