<script setup>
import { computed } from 'vue'
import { formatKoreanDate } from '@/utils/date.js'

const props = defineProps({
  /** 화면 제목 (예: 학습 로드맵) */
  title: {
    type: String,
    required: true,
  },
  /** 제목 아래 보조 설명 */
  subtitle: {
    type: String,
    default: '',
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
  <header class="chalk-header m-0 w-full shrink-0 px-5">
    <p class="font-serif text-[10px] tracking-wide text-[var(--chalk-text-muted)]">
      {{ resolvedDate }}
    </p>
    <div class="mt-1 flex items-center justify-between gap-3">
      <div class="min-w-0 flex-1">
        <p v-if="eyebrow" class="mb-0.5 font-serif text-[10px] text-[var(--chalk-text-faint)]">
          {{ eyebrow }}
        </p>
        <h1
          class="chalk-header__title font-pen text-[28px] leading-none font-normal text-[var(--chalk-text)]"
        >
          {{ title }}
        </h1>
        <p
          v-if="subtitle"
          class="mt-1 truncate font-serif text-[11px] leading-tight text-[var(--chalk-text-faint)]"
        >
          {{ subtitle }}
        </p>
      </div>
      <div v-if="$slots.badge || $slots.actions" class="shrink-0">
        <slot name="badge" />
        <slot name="actions" />
      </div>
    </div>
  </header>
</template>
