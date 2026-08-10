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
  /** default: 일반 학습 화면 / quiz: 시험지·퀴즈 */
  variant: {
    type: String,
    default: 'default',
    validator: (value) => ['default', 'quiz'].includes(value),
  },
  /** 퀴즈 variant — 현재 문항 (1-based) */
  progressCurrent: {
    type: Number,
    default: 0,
  },
  /** 퀴즈 variant — 전체 문항 */
  progressTotal: {
    type: Number,
    default: 0,
  },
})

const resolvedDate = computed(() => props.dateLabel || formatKoreanDate())

const isQuiz = computed(() => props.variant === 'quiz')

const resolvedEyebrow = computed(() => {
  if (props.eyebrow) return props.eyebrow
  if (isQuiz.value) return 'FIRSTFOLIO · QUIZ'
  return ''
})

const progressPercent = computed(() => {
  if (!props.progressTotal || props.progressCurrent < 1) return 0
  return Math.min(100, Math.round((props.progressCurrent / props.progressTotal) * 100))
})

const showProgress = computed(() => isQuiz.value && props.progressTotal > 0)
</script>

<template>
  <header class="learning-header shrink-0 pb-3">
    <p v-if="!isQuiz" class="font-serif text-[10px] tracking-wide text-[var(--cork-ink-faint)]">
      {{ resolvedDate }}
    </p>

    <div class="flex items-start justify-between gap-3" :class="isQuiz ? 'pt-1' : 'mt-1'">
      <div class="min-w-0 flex-1">
        <p
          v-if="resolvedEyebrow"
          class="font-serif text-[10px] tracking-[0.12em] text-[var(--cork-ink-faint)] uppercase"
        >
          {{ resolvedEyebrow }}
        </p>
        <h1
          class="font-serif font-bold leading-none text-[#212b5c]"
          :class="[resolvedEyebrow ? 'mt-1' : '', isQuiz ? 'text-[26px]' : 'text-[28px]']"
        >
          {{ title }}
        </h1>
        <p
          v-if="subtitle"
          class="mt-1 truncate font-serif text-[11px] leading-tight text-[var(--cork-ink-muted)]"
        >
          {{ subtitle }}
        </p>
      </div>
      <div v-if="$slots.badge || $slots.actions" class="shrink-0 pt-0.5">
        <slot name="badge" />
        <slot name="actions" />
      </div>
    </div>

    <div v-if="showProgress" class="mt-3">
      <div class="flex items-center justify-between gap-2">
        <span class="font-serif text-[10px] text-[var(--cork-ink-faint)]">진행</span>
        <span class="font-serif text-[10px] font-bold text-[#c17f24]">
          {{ progressCurrent }} / {{ progressTotal }}
        </span>
      </div>
      <div class="learning-header__progress-track mt-1" aria-hidden="true">
        <div class="learning-header__progress-fill" :style="{ width: `${progressPercent}%` }" />
      </div>
    </div>
  </header>
</template>
